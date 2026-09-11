package com.grinya.controller;

import com.grinya.model.BlockText;
import com.grinya.repository.BlockTextRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
public class BlockTextController {

    private static final int MAX_LENGTH = 4000;

    @Autowired
    private BlockTextRepository blockTextRepository;

    /**
     * Returns empty strings rather than 404 for a block that was never edited,
     * so the public page has nothing to special-case.
     */
    @GetMapping("/api/block-texts/{slug}")
    public ResponseEntity<BlockText> getBlockText(@PathVariable String slug) {
        return ResponseEntity.ok(
                blockTextRepository.findBySlug(slug).orElseGet(() -> {
                    BlockText empty = new BlockText();
                    empty.setSlug(slug);
                    empty.setHeading("");
                    empty.setBody("");
                    return empty;
                })
        );
    }

    /** Upsert — the row is created the first time the admin saves it. */
    @PutMapping("/api/admin/block-texts/{slug}")
    public ResponseEntity<?> updateBlockText(
            @PathVariable String slug,
            @RequestParam(required = false) String heading,
            @RequestParam(required = false) String body) {

        if ((heading != null && heading.length() > MAX_LENGTH)
                || (body != null && body.length() > MAX_LENGTH)) {
            return ResponseEntity.badRequest().body("Text too long");
        }

        BlockText text = blockTextRepository.findBySlug(slug).orElseGet(() -> {
            BlockText created = new BlockText();
            created.setSlug(slug);
            return created;
        });

        if (heading != null) text.setHeading(heading);
        if (body != null) text.setBody(body);

        return ResponseEntity.ok(blockTextRepository.save(text));
    }
}
