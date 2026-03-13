package com.grinya.dto;

public class CategoryResponse {
    private Long id;
    private String slug;
    private String displayName;
    private Integer sortOrder;
    private Boolean visible;
    private long videoCount;

    public CategoryResponse(Long id, String slug, String displayName,
                            Integer sortOrder, Boolean visible, long videoCount) {
        this.id = id;
        this.slug = slug;
        this.displayName = displayName;
        this.sortOrder = sortOrder;
        this.visible = visible;
        this.videoCount = videoCount;
    }

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getDisplayName() { return displayName; }
    public Integer getSortOrder() { return sortOrder; }
    public Boolean getVisible() { return visible; }
    public long getVideoCount() { return videoCount; }
}
