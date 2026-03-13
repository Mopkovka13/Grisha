package com.grinya.controller;

import com.grinya.dto.CategoryResponse;
import com.grinya.dto.ReorderRequest;
import com.grinya.model.Category;
import com.grinya.repository.CategoryRepository;
import com.grinya.repository.VideoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private VideoRepository videoRepository;

    // ── Public ──────────────────────────────────────────────────────────────

    @GetMapping("/api/categories")
    public ResponseEntity<List<CategoryResponse>> getPublicCategories() {
        List<CategoryResponse> result = categoryRepository.findByVisibleTrueOrderBySortOrder()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    @GetMapping("/api/admin/categories")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        List<CategoryResponse> result = categoryRepository.findAllByOrderBySortOrder()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/api/admin/categories")
    public ResponseEntity<?> createCategory(
            @RequestParam String slug,
            @RequestParam String displayName) {

        String cleanSlug = slug.toLowerCase().replaceAll("[^a-z0-9-]", "-").replaceAll("-+", "-").replaceAll("^-|-$", "");
        if (cleanSlug.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid slug");
        }
        if (categoryRepository.existsBySlug(cleanSlug)) {
            return ResponseEntity.badRequest().body("Slug already exists");
        }

        Category category = new Category();
        category.setSlug(cleanSlug);
        category.setDisplayName(displayName.trim());
        category.setSortOrder(categoryRepository.findAllByOrderBySortOrder().size());
        return ResponseEntity.ok(toResponse(categoryRepository.save(category)));
    }

    @PutMapping("/api/admin/categories/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable Long id,
            @RequestParam(required = false) String displayName,
            @RequestParam(required = false) Boolean visible) {

        return categoryRepository.findById(id).map(cat -> {
            if (displayName != null && !displayName.isBlank()) {
                cat.setDisplayName(displayName.trim());
            }
            if (visible != null) {
                cat.setVisible(visible);
            }
            return ResponseEntity.ok(toResponse(categoryRepository.save(cat)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/admin/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        return categoryRepository.findById(id).map(cat -> {
            long count = videoRepository.countByCategory(cat.getSlug());
            if (count > 0) {
                return ResponseEntity.badRequest().body("Нельзя удалить: в категории " + count + " роликов");
            }
            categoryRepository.delete(cat);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/api/admin/categories/reorder")
    public ResponseEntity<?> reorderCategories(@RequestBody ReorderRequest request) {
        List<Long> ids = request.getOrderedIds();
        for (int i = 0; i < ids.size(); i++) {
            int index = i;
            categoryRepository.findById(ids.get(i)).ifPresent(cat -> {
                cat.setSortOrder(index);
                categoryRepository.save(cat);
            });
        }
        return ResponseEntity.ok().build();
    }

    private CategoryResponse toResponse(Category cat) {
        long count = videoRepository.countByCategory(cat.getSlug());
        return new CategoryResponse(cat.getId(), cat.getSlug(), cat.getDisplayName(),
                cat.getSortOrder(), cat.getVisible(), count);
    }
}
