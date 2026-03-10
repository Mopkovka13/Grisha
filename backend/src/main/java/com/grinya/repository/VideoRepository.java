package com.grinya.repository;

import com.grinya.model.Video;
import com.grinya.model.VideoCategory;
import com.grinya.model.VideoStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VideoRepository extends JpaRepository<Video, Long> {
    List<Video> findByStatusOrderBySortOrder(VideoStatus status);

    List<Video> findByCategoryAndStatusOrderBySortOrder(VideoCategory category, VideoStatus status);

    List<Video> findByStatusOrderByCreatedAtDesc(VideoStatus status);
}
