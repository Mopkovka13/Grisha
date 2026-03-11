package com.grinya.service;

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
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class TranscodingService {

    private static final Logger logger = LoggerFactory.getLogger(TranscodingService.class);

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private StorageService storageService;

    @Value("${ffmpeg.path:ffmpeg}")
    private String ffmpegPath;

    @Value("${ffmpeg.ffprobe-path:ffprobe}")
    private String ffprobePath;

    @Value("${ffmpeg.temp-dir:/tmp/grinya}")
    private String tempDir;

    @Async("transcodingExecutor")
    public void transcodeVideo(Long videoId, String sourceFilePath, String targetResolutionsStr) {
        try {
            Video video = videoRepository.findById(videoId)
                    .orElseThrow(() -> new RuntimeException("Video not found"));

            Set<Integer> targetResolutions = parseResolutions(targetResolutionsStr);

            logger.info("Starting transcoding for video {}: {}", videoId, video.getTitle());
            video.setStatus(VideoStatus.PROCESSING);
            videoRepository.save(video);

            // Create temp directory for this video
            String tempVideoDir = tempDir + File.separator + videoId;
            Files.createDirectories(Paths.get(tempVideoDir));

            // Move source file to storage and to working input path
            String localInputPath = tempVideoDir + File.separator + "input.mp4";
            storageService.uploadFile(video.getS3Key(), new File(sourceFilePath));
            Files.copy(Paths.get(sourceFilePath), Paths.get(localInputPath), StandardCopyOption.REPLACE_EXISTING);
            new File(sourceFilePath).delete();

            // Get video metadata
            VideoMetadata metadata = probeVideo(localInputPath);
            video.setWidth(metadata.width);
            video.setHeight(metadata.height);
            video.setDurationSeconds(metadata.duration);
            video.setProgress(10);
            videoRepository.save(video);

            // Generate thumbnail
            generateThumbnail(videoId, localInputPath, metadata, tempVideoDir);
            updateProgress(videoId, 25);

            // Generate preview
            generatePreview(videoId, localInputPath, metadata, tempVideoDir);
            updateProgress(videoId, 40);

            // Generate HLS streams
            generateHLS(videoId, localInputPath, metadata, tempVideoDir, targetResolutions);

            // Update video status — reload to preserve paths saved by sub-steps
            video = videoRepository.findById(videoId).orElseThrow();
            video.setStatus(VideoStatus.READY);
            video.setProgress(100);
            videoRepository.save(video);

            logger.info("Transcoding completed for video {}", videoId);

            // Cleanup temp files
            cleanupTempDir(tempVideoDir);

        } catch (Exception e) {
            logger.error("Transcoding failed for video " + videoId, e);
            Video video = videoRepository.findById(videoId).orElse(null);
            if (video != null) {
                video.setStatus(VideoStatus.FAILED);
                videoRepository.save(video);
            }
        }
    }

    private Set<Integer> parseResolutions(String resolutionsStr) {
        if (resolutionsStr == null || resolutionsStr.isBlank()) {
            return Set.of(360, 480, 720, 1080);
        }
        return Arrays.stream(resolutionsStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .collect(Collectors.toSet());
    }

    private void generateThumbnail(Long videoId, String inputPath, VideoMetadata metadata, String tempDir) throws Exception {
        logger.info("Generating thumbnail for video {}", videoId);

        int seekTime = metadata.duration / 4; // 25% of duration
        String thumbPath = tempDir + File.separator + "thumb.jpg";

        String[] command = {
                ffmpegPath,
                "-i", inputPath,
                "-ss", String.valueOf(seekTime),
                "-frames:v", "1",
                "-vf", "scale=640:-1",
                thumbPath
        };

        executeCommand(command);

        // Upload thumbnail to S3
        String s3Key = "thumbnails/" + videoId + "/thumb.jpg";
        storageService.uploadFile(s3Key, new File(thumbPath));

        Video video = videoRepository.findById(videoId).orElse(null);
        if (video != null) {
            video.setThumbnailPath(s3Key);
            videoRepository.save(video);
        }
    }

    private void generatePreview(Long videoId, String inputPath, VideoMetadata metadata, String tempDir) throws Exception {
        logger.info("Generating preview for video {}", videoId);

        int seekTime = metadata.duration / 4; // 25% of duration
        String previewPath = tempDir + File.separator + "preview.mp4";

        String[] command = {
                ffmpegPath,
                "-i", inputPath,
                "-ss", String.valueOf(seekTime),
                "-t", "4",
                "-vf", "scale=480:-2",
                "-an",
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "28",
                "-movflags", "+faststart",
                previewPath
        };

        executeCommand(command);

        // Upload preview to S3
        String s3Key = "previews/" + videoId + "/preview.mp4";
        storageService.uploadFile(s3Key, new File(previewPath));

        Video video = videoRepository.findById(videoId).orElse(null);
        if (video != null) {
            video.setPreviewPath(s3Key);
            videoRepository.save(video);
        }
    }

    private void generateHLS(Long videoId, String inputPath, VideoMetadata metadata, String tempDir, Set<Integer> targetResolutions) throws Exception {
        logger.info("Generating HLS streams for video {}", videoId);

        String hlsDir = tempDir + File.separator + "hls";
        Files.createDirectories(Paths.get(hlsDir));

        // height, audioBitrate, progressAfter
        int[][] streams = {
            {144,  64,  47},
            {240,  96,  52},
            {360,  96,  57},
            {480,  128, 65},
            {720,  128, 75},
            {1080, 192, 85}
        };

        List<String> generatedResolutions = new ArrayList<>();

        for (int[] s : streams) {
            int height = s[0];
            int audioBitrate = s[1];
            int progressAfter = s[2];
            String label = height + "p";

            if (!targetResolutions.contains(height)) {
                continue;
            }

            if (metadata.height > 0 && height > metadata.height) {
                logger.info("Skipping {}p — source is {}p", height, metadata.height);
                updateProgress(videoId, progressAfter);
                continue;
            }

            logger.info("Generating {}p stream for video {}", height, videoId);
            String[] command = {
                    ffmpegPath,
                    "-i", inputPath,
                    "-vf", "scale=-2:" + height,
                    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                    "-c:a", "aac", "-b:a", audioBitrate + "k",
                    "-hls_time", "6", "-hls_list_size", "0",
                    "-hls_segment_filename", hlsDir + "/" + label + "_%03d.ts",
                    hlsDir + "/" + label + ".m3u8"
            };
            executeCommand(command);
            generatedResolutions.add(label);
            updateProgress(videoId, progressAfter);
        }

        // Upload all HLS files
        Path hlsPath = Paths.get(hlsDir);
        for (String res : generatedResolutions) {
            storageService.uploadFile("hls/" + videoId + "/" + res + ".m3u8", hlsPath.resolve(res + ".m3u8"));
            Files.list(hlsPath)
                    .filter(p -> p.getFileName().toString().startsWith(res + "_") && p.getFileName().toString().endsWith(".ts"))
                    .forEach(p -> {
                        try {
                            storageService.uploadFile("hls/" + videoId + "/" + p.getFileName(), p);
                        } catch (Exception e) {
                            logger.error("Failed to upload HLS segment", e);
                        }
                    });
        }

        // Generate and upload master playlist
        generateMasterPlaylist(videoId, hlsDir, generatedResolutions);
    }

    private void generateMasterPlaylist(Long videoId, String hlsDir, List<String> resolutions) throws Exception {
        // bandwidth and resolution per height
        java.util.Map<String, String> info = new java.util.LinkedHashMap<>();
        info.put("144p",  "BANDWIDTH=200000,RESOLUTION=256x144");
        info.put("240p",  "BANDWIDTH=300000,RESOLUTION=426x240");
        info.put("360p",  "BANDWIDTH=500000,RESOLUTION=640x360");
        info.put("480p",  "BANDWIDTH=1000000,RESOLUTION=854x480");
        info.put("720p",  "BANDWIDTH=2500000,RESOLUTION=1280x720");
        info.put("1080p", "BANDWIDTH=5000000,RESOLUTION=1920x1080");

        StringBuilder master = new StringBuilder("#EXTM3U\n#EXT-X-VERSION:3\n");
        for (String res : resolutions) {
            master.append("#EXT-X-STREAM-INF:").append(info.getOrDefault(res, "BANDWIDTH=2000000")).append("\n");
            master.append(res).append(".m3u8\n");
        }

        String masterPath = hlsDir + File.separator + "master.m3u8";
        Files.write(Paths.get(masterPath), master.toString().getBytes());
        storageService.uploadFile("hls/" + videoId + "/master.m3u8", new File(masterPath));

        videoRepository.findById(videoId).ifPresent(v -> {
            v.setHlsPath("hls/" + videoId + "/master.m3u8");
            videoRepository.save(v);
        });
    }

    private VideoMetadata probeVideo(String inputPath) throws Exception {
        // Width and height from video stream
        ProcessBuilder pb1 = new ProcessBuilder(
                ffprobePath, "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=width,height",
                "-of", "default=noprint_wrappers=1:nokey=1",
                inputPath
        );
        pb1.redirectError(ProcessBuilder.Redirect.INHERIT);
        Process p1 = pb1.start();
        String streamOutput = new String(p1.getInputStream().readAllBytes()).trim();
        p1.waitFor();

        if (streamOutput.isEmpty()) {
            throw new RuntimeException("ffprobe returned no video stream info for: " + inputPath);
        }

        String[] parts = streamOutput.split("\\n");
        int width = Integer.parseInt(parts[0].trim());
        int height = Integer.parseInt(parts[1].trim());

        // Duration from format — always present, unlike stream duration
        ProcessBuilder pb2 = new ProcessBuilder(
                ffprobePath, "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                inputPath
        );
        pb2.redirectError(ProcessBuilder.Redirect.INHERIT);
        Process p2 = pb2.start();
        String durationStr = new String(p2.getInputStream().readAllBytes()).trim();
        p2.waitFor();

        int duration = (durationStr.isEmpty() || durationStr.equals("N/A"))
                ? 0
                : (int) Double.parseDouble(durationStr);

        return new VideoMetadata(width, height, duration);
    }

    private void executeCommand(String[] command) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.inheritIO();
        Process process = pb.start();

        boolean completed = process.waitFor(60, TimeUnit.MINUTES);
        if (!completed) {
            process.destroyForcibly();
            throw new RuntimeException("FFmpeg command timed out");
        }

        if (process.exitValue() != 0) {
            throw new RuntimeException("FFmpeg command failed with exit code " + process.exitValue());
        }
    }

private void cleanupTempDir(String tempDir) {
        try {
            Files.walk(Paths.get(tempDir))
                    .sorted((p1, p2) -> p2.compareTo(p1))
                    .forEach(p -> {
                        try {
                            Files.delete(p);
                        } catch (Exception e) {
                            logger.warn("Failed to delete temp file: " + p, e);
                        }
                    });
        } catch (Exception e) {
            logger.warn("Failed to cleanup temp directory: " + tempDir, e);
        }
    }

    private void updateProgress(Long videoId, int progress) {
        videoRepository.findById(videoId).ifPresent(v -> {
            v.setProgress(progress);
            videoRepository.save(v);
        });
    }

    private static class VideoMetadata {
        int width;
        int height;
        int duration;

        VideoMetadata(int width, int height, int duration) {
            this.width = width;
            this.height = height;
            this.duration = duration;
        }
    }
}
