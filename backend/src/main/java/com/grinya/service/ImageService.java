package com.grinya.service;

import com.grinya.model.MediaType;
import com.grinya.model.Video;
import com.grinya.model.VideoStatus;
import com.grinya.repository.VideoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Photo counterpart of {@link TranscodingService}. There is nothing to
 * transcode, so this runs inline: store the file, read its dimensions, done.
 * The entry goes straight to READY — no PENDING/PROCESSING states to poll.
 */
@Service
public class ImageService {

    private static final Logger logger = LoggerFactory.getLogger(ImageService.class);

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private StorageService storageService;

    @Value("${ffmpeg.ffprobe-path:ffprobe}")
    private String ffprobePath;

    @Value("${ffmpeg.path:ffmpeg}")
    private String ffmpegPath;

    /** Tallest the carousel ever draws a photo (~560 CSS px), doubled for 2x screens */
    private static final int MAX_HEIGHT = 1200;

    /**
     * Stores the uploaded photo and records its size.
     *
     * @return the saved entry, already READY
     */
    public Video storeImage(Long videoId, String sourceFilePath) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new RuntimeException("Video not found: " + videoId));

        File source = new File(sourceFilePath);
        try {
            storageService.uploadFile(video.getS3Key(), source);
            video.setImagePath(video.getS3Key());
            video.setMediaType(MediaType.IMAGE);

            int[] size = probeImageSize(sourceFilePath);
            if (size != null) {
                video.setWidth(size[0]);
                video.setHeight(size[1]);

                // Serve a web-sized copy; the original stays under s3Key
                String displayKey = optimize(videoId, sourceFilePath, size);
                if (displayKey != null) video.setImagePath(displayKey);
            } else {
                // The landing page falls back to a default ratio when these are null
                logger.warn("Could not read dimensions of image {} — layout will use the default ratio", videoId);
            }

            video.setStatus(VideoStatus.READY);
            video.setProgress(100);
            return videoRepository.save(video);

        } finally {
            if (!source.delete()) {
                logger.warn("Could not delete temp upload {}", sourceFilePath);
            }
        }
    }

    /**
     * Optimises photos uploaded before this existed. They are recognised by
     * imagePath still pointing at the stored original; once re-encoded it
     * points at the display copy, so a second run skips them.
     *
     * Runs off the request thread — ffmpeg on a backlog of large photos must
     * not hold up startup.
     */
    @Async("transcodingExecutor")
    public void backfillUnoptimised() {
        List<Video> pending = videoRepository.findAll().stream()
                .filter(v -> v.getMediaType() == MediaType.IMAGE)
                .filter(v -> v.getImagePath() != null && v.getImagePath().equals(v.getS3Key()))
                .toList();

        if (pending.isEmpty()) return;
        logger.info("Optimising {} photo(s) uploaded before image optimisation existed", pending.size());

        for (Video video : pending) {
            try {
                Path original = storageService.resolveKey(video.getS3Key());
                if (!Files.isRegularFile(original)) {
                    logger.warn("Original missing for image {} — skipping", video.getId());
                    continue;
                }

                int[] size = probeImageSize(original.toString());
                if (size == null) continue;

                String key = optimize(video.getId(), original.toString(), size);
                if (key == null) continue;

                video.setWidth(size[0]);
                video.setHeight(size[1]);
                video.setImagePath(key);
                videoRepository.save(video);
            } catch (Exception e) {
                logger.warn("Could not optimise existing image {}: {}", video.getId(), e.getMessage());
            }
        }
    }

    /**
     * Re-encodes the upload to a web-sized WebP.
     *
     * Cameras and screen grabs are wildly oversized for this: a 3654x2664 PNG
     * arrived at 28 MB to be shown about 768px wide. The carousel never draws
     * a photo taller than ~560 CSS px, so capping the height at MAX_HEIGHT
     * still leaves room for a 2x display.
     *
     * @return storage key of the optimised copy, or null to keep the original
     */
    private String optimize(Long videoId, String sourceFilePath, int[] size) {
        int targetHeight = Math.min(MAX_HEIGHT, size[1]);

        // WebP first. JPEG as the fallback because libwebp is a build-time
        // option in ffmpeg and Alpine's package is not guaranteed to carry it —
        // without a second attempt that would silently leave the original in
        // place, which looks exactly like the optimisation working.
        String key = encode(videoId, sourceFilePath, targetHeight, "webp", "libwebp",
                new String[]{"-quality", "82", "-compression_level", "6"});
        if (key != null) return key;

        return encode(videoId, sourceFilePath, targetHeight, "jpg", "mjpeg",
                new String[]{"-q:v", "4"});
    }

    private String encode(Long videoId, String sourceFilePath, int targetHeight,
                          String extension, String codec, String[] codecArgs) {
        String key = "images/" + videoId + "/display." + extension;
        File out = new File(System.getProperty("java.io.tmpdir"),
                videoId + "_display." + extension);

        try {
            List<String> command = new ArrayList<>(List.of(
                    ffmpegPath, "-y", "-v", "error",
                    "-i", sourceFilePath,
                    // Height computed here rather than as an ffmpeg expression:
                    // a comma inside one would be read as a filter separator
                    "-vf", "scale=-2:" + targetHeight,
                    "-frames:v", "1",
                    "-c:v", codec
            ));
            command.addAll(List.of(codecArgs));
            command.add(out.getAbsolutePath());

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectError(ProcessBuilder.Redirect.INHERIT);
            Process p = pb.start();
            boolean finished = p.waitFor(120, TimeUnit.SECONDS);

            if (!finished || p.exitValue() != 0 || !out.isFile() || out.length() == 0) {
                logger.warn("{} encode failed for image {}", codec, videoId);
                return null;
            }

            logger.info("Optimised image {} to {}: {} KB -> {} KB",
                    videoId, extension,
                    new File(sourceFilePath).length() / 1024, out.length() / 1024);
            storageService.uploadFile(key, out);
            return key;

        } catch (Exception e) {
            // ffmpeg is absent in local dev — keep the original rather than
            // failing the upload
            logger.warn("ffmpeg unavailable for image {}: {}", videoId, e.getMessage());
            return null;
        } finally {
            out.delete();
        }
    }

    /**
     * Dimensions via ffprobe rather than ImageIO: ffprobe is already in the
     * image and reads webp and avif, which ImageIO cannot decode at all.
     *
     * @return {width, height}, or null if ffprobe could not tell
     */
    private int[] probeImageSize(String inputPath) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    ffprobePath, "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "stream=width,height",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    inputPath
            );
            pb.redirectError(ProcessBuilder.Redirect.INHERIT);
            Process p = pb.start();
            String out = new String(p.getInputStream().readAllBytes()).trim();
            p.waitFor();

            String[] parts = out.split("\\R");
            if (parts.length < 2) return null;

            return new int[]{
                    Integer.parseInt(parts[0].trim()),
                    Integer.parseInt(parts[1].trim())
            };
        } catch (Exception e) {
            logger.warn("ffprobe failed on image {}: {}", inputPath, e.getMessage());
            return null;
        }
    }
}
