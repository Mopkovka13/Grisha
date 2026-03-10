package com.grinya.dto;

import java.util.List;

public class ReorderRequest {
    private List<Long> orderedIds;

    public ReorderRequest() {}

    public ReorderRequest(List<Long> orderedIds) {
        this.orderedIds = orderedIds;
    }

    public List<Long> getOrderedIds() {
        return orderedIds;
    }

    public void setOrderedIds(List<Long> orderedIds) {
        this.orderedIds = orderedIds;
    }
}
