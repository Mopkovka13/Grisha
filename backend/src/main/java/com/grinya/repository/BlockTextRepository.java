package com.grinya.repository;

import com.grinya.model.BlockText;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlockTextRepository extends JpaRepository<BlockText, Long> {
    Optional<BlockText> findBySlug(String slug);
}
