package com.grinya.controller;

import com.grinya.dto.VideoResponse;
import com.grinya.model.VideoStatus;
import com.grinya.repository.CategoryRepository;
import com.grinya.repository.VideoRepository;
import com.grinya.service.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/videos")
@CrossOrigin(origins = "*")
public class PublicVideoController {

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private StorageService storageService;

    @GetMapping
    public ResponseEntity<List<VideoResponse>> getVideos(
            @RequestParam(required = false) String category) {
        List<VideoResponse> videos;

        if (category != null && !category.isEmpty()) {
            String slug = category.toLowerCase();
            if (!categoryRepository.existsBySlug(slug)) {
                return ResponseEntity.badRequest().build();
            }
            videos = videoRepository
                    .findByCategoryAndStatusOrderBySortOrder(slug, VideoStatus.READY)
                    .stream()
                    .map(this::toVideoResponse)
                    .collect(Collectors.toList());
        } else {
            videos = videoRepository
                    .findByStatusOrderBySortOrder(VideoStatus.READY)
                    .stream()
                    .map(this::toVideoResponse)
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(videos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VideoResponse> getVideo(@PathVariable Long id) {
        return videoRepository.findById(id)
                .filter(v -> v.getStatus() == VideoStatus.READY)
                .map(v -> ResponseEntity.ok(toVideoResponse(v)))
                .orElse(ResponseEntity.notFound().build());
    }

    private VideoResponse toVideoResponse(com.grinya.model.Video video) {
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
