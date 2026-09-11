package com.grinya.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${storage.base-dir:/app/media}")
    private String storageBaseDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String mediaLocation = "file:" + storageBaseDir;
        if (!mediaLocation.endsWith("/")) mediaLocation += "/";

        // Media is addressed by entry id and never rewritten in place, so it can
        // be cached hard. Without this every revisit re-downloads the photos.
        registry.addResourceHandler("/media/**")
                .addResourceLocations(mediaLocation)
                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic());

        // Serve static files; fall back to index.html for SPA routes
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requested = location.createRelative(resourcePath);
                        return requested.exists() && requested.isReadable()
                                ? requested
                                : new ClassPathResource("/static/index.html");
                    }
                });
    }
}
