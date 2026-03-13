package com.grinya.dto;

import com.grinya.model.VideoStatus;

import java.time.LocalDateTime;

public class VideoResponse {
    private Long id;
    private String title;
    private String thumbnailPath;
    private String previewPath;
    private String hlsPath;
    private Integer durationSeconds;
    private Integer width;
    private Integer height;
    private VideoStatus status;
    private Integer progress;
    private String category;
    private Integer sortOrder;
    private LocalDateTime createdAt;

    public VideoResponse(Long id, String title, String thumbnailPath, String previewPath, String hlsPath,
                         Integer durationSeconds, Integer width, Integer height, VideoStatus status,
                         Integer progress, String category, Integer sortOrder, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.thumbnailPath = thumbnailPath;
        this.previewPath = previewPath;
        this.hlsPath = hlsPath;
        this.durationSeconds = durationSeconds;
        this.width = width;
        this.height = height;
        this.status = status;
        this.progress = progress;
        this.category = category;
        this.sortOrder = sortOrder;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getThumbnailPath() { return thumbnailPath; }
    public void setThumbnailPath(String thumbnailPath) { this.thumbnailPath = thumbnailPath; }
    public String getPreviewPath() { return previewPath; }
    public void setPreviewPath(String previewPath) { this.previewPath = previewPath; }
    public String getHlsPath() { return hlsPath; }
    public void setHlsPath(String hlsPath) { this.hlsPath = hlsPath; }
    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }
    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }
    public VideoStatus getStatus() { return status; }
    public void setStatus(VideoStatus status) { this.status = status; }
    public Integer getProgress() { return progress; }
    public void setProgress(Integer progress) { this.progress = progress; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
