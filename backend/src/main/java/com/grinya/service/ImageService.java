package com.grinya.service;

import com.grinya.model.MediaType;
import com.grinya.model.Video;
import com.grinya.model.VideoStatus;
import com.grinya.repository.VideoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;

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
