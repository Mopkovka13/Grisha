package com.grinya.repository;

import com.grinya.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByVisibleTrueOrderBySortOrder();
    List<Category> findAllByOrderBySortOrder();
    Optional<Category> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
