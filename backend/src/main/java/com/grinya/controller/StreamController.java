package com.grinya.controller;

import com.grinya.repository.VideoRepository;
import com.grinya.service.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stream")
@CrossOrigin(origins = "*")
public class StreamController {

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private StorageService storageService;

    @GetMapping("/{id}")
    public ResponseEntity<String> getStreamUrl(@PathVariable Long id) {
        return videoRepository.findById(id)
                .map(video -> {
                    if (video.getHlsPath() != null) {
                        String url = storageService.getPresignedUrl(video.getHlsPath());
                        return ResponseEntity.ok(url);
                    }
                    return ResponseEntity.notFound().<String>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
