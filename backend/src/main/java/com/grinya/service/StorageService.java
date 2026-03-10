package com.grinya.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;

@Service
public class StorageService {

    @Value("${storage.base-dir:/app/media}")
    private String baseDir;

    @Value("${storage.url-prefix:/media}")
    private String urlPrefix;

    public void uploadFile(String key, File file) {
        try {
            Path dest = resolveKey(key);
            Files.createDirectories(dest.getParent());
            Files.copy(file.toPath(), dest, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file: " + key, e);
        }
    }

    public void uploadFile(String key, byte[] data) {
        try {
            Path dest = resolveKey(key);
            Files.createDirectories(dest.getParent());
            Files.write(dest, data);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file: " + key, e);
        }
    }

    public void uploadFile(String key, Path sourcePath) {
        try {
            Path dest = resolveKey(key);
            Files.createDirectories(dest.getParent());
            Files.copy(sourcePath, dest, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file: " + key, e);
        }
    }

    public String getPresignedUrl(String key) {
        return urlPrefix + "/" + key;
    }

    public void deleteFile(String key) {
        try {
            Files.deleteIfExists(resolveKey(key));
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file: " + key, e);
        }
    }

    public void deleteDirectory(String prefix) {
        Path dir = resolveKey(prefix);
        if (!Files.exists(dir)) return;
        try {
            Files.walk(dir)
                    .sorted(Comparator.reverseOrder())
                    .forEach(p -> {
                        try { Files.delete(p); } catch (IOException ignored) {}
                    });
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete directory: " + prefix, e);
        }
    }

    public boolean fileExists(String key) {
        return Files.exists(resolveKey(key));
    }

    public Path resolveKey(String key) {
        return Paths.get(baseDir).resolve(key);
    }
}
