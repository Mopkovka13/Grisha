package com.grinya.dto;

public class ServiceResponse {
    private Long id;
    private String title;
    private String description;
    private String price;
    private Integer sortOrder;

    public ServiceResponse(Long id, String title, String description, String price, Integer sortOrder) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.price = price;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getPrice() { return price; }
    public Integer getSortOrder() { return sortOrder; }
}
