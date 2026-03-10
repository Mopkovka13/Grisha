package com.grinya.controller;

import com.grinya.dto.ReorderRequest;
import com.grinya.dto.VideoResponse;
import com.grinya.model.Video;
import com.grinya.model.VideoCategory;
import com.grinya.model.VideoStatus;
import com.grinya.repository.VideoRepository;
import com.grinya.service.StorageService;
import com.grinya.service.TranscodingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/videos")
@CrossOrigin(origins = "*")
public class AdminVideoController {

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private StorageService storageService;

    @Autowired
    private TranscodingService transcodingService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "category", defaultValue = "OTHER") String categoryStr) {

        try {
            VideoCategory category = VideoCategory.valueOf(categoryStr.toUpperCase());

            // Create video entity
            Video video = new Video();
            video.setTitle(title);
            video.setFilename(file.getOriginalFilename());
            video.setFileSize(file.getSize());
            video.setCategory(category);
            video.setStatus(VideoStatus.PENDING);
            video.setProgress(0);
            video.setS3Key("pending");

            // Save to database first to get ID
            video = videoRepository.save(video);

            // Update s3Key with real path now that we have ID
            String s3Key = "originals/" + video.getId() + "/" + file.getOriginalFilename();
            video.setS3Key(s3Key);
            video = videoRepository.save(video);

            // Write multipart to temp file (Spring already buffered to disk — this is a fast rename)
            File tempFile = new File(System.getProperty("java.io.tmpdir"), video.getId() + "_" + file.getOriginalFilename());
            file.transferTo(tempFile);

            // Kick off async pipeline (save to storage + transcode) and return immediately
            transcodingService.transcodeVideo(video.getId(), tempFile.getAbsolutePath());

            return ResponseEntity.ok(toVideoResponse(video));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid category");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<VideoResponse>> getAllVideos() {
        List<VideoResponse> videos = videoRepository.findAll(Sort.by("sortOrder")).stream()
                .map(this::toVideoResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(videos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VideoResponse> getVideo(@PathVariable Long id) {
        return videoRepository.findById(id)
                .map(v -> ResponseEntity.ok(toVideoResponse(v)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<VideoResponse> getVideoStatus(@PathVariable Long id) {
        return videoRepository.findById(id)
                .map(v -> ResponseEntity.ok(toVideoResponse(v)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateVideo(@PathVariable Long id, @RequestParam(required = false) String title) {
        return videoRepository.findById(id)
                .map(video -> {
                    if (title != null && !title.isEmpty()) {
                        video.setTitle(title);
                    }
                    videoRepository.save(video);
                    return ResponseEntity.ok(toVideoResponse(video));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVideo(@PathVariable Long id) {
        return videoRepository.findById(id)
                .map(video -> {
                    // Delete from S3
                    String prefix = "originals/" + video.getId() + "/";
                    storageService.deleteDirectory(prefix);

                    if (video.getThumbnailPath() != null) {
                        storageService.deleteFile(video.getThumbnailPath());
                    }
                    if (video.getPreviewPath() != null) {
                        storageService.deleteFile(video.getPreviewPath());
                    }
                    if (video.getHlsPath() != null) {
                        String hlsPrefix = "hls/" + video.getId() + "/";
                        storageService.deleteDirectory(hlsPrefix);
                    }

                    // Delete from database
                    videoRepository.delete(video);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/reorder")
    public ResponseEntity<?> reorderVideos(@RequestBody ReorderRequest request) {
        try {
            List<Long> orderedIds = request.getOrderedIds();
            for (int i = 0; i < orderedIds.size(); i++) {
                Long id = orderedIds.get(i);
                int index = i;
                videoRepository.findById(id).ifPresent(video -> {
                    video.setSortOrder(index);
                    videoRepository.save(video);
                });
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Reorder failed: " + e.getMessage());
        }
    }

    private VideoResponse toVideoResponse(Video video) {
        return new VideoResponse(
                video.getId(),
                video.getTitle(),
                video.getThumbnailPath() != null ? storageService.getPresignedUrl(video.getThumbnailPath()) : null,
                video.getPreviewPath() != null ? storageService.getPresignedUrl(video.getPreviewPath()) : null,
                video.getHlsPath() != null ? storageService.getPresignedUrl(video.getHlsPath()) : null,
                video.getDurationSeconds(),
                video.getWidth(),
                video.getHeight(),
                video.getStatus(),
                video.getProgress(),
                video.getCategory(),
                video.getSortOrder(),
                video.getCreatedAt()
        );
    }
}
