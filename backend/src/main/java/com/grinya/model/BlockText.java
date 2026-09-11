package com.grinya.model;

import jakarta.persistence.*;

/**
 * Editable copy for a block on the public site, addressed by slug
 * (e.g. "showcase" for the gallery heading on the landing page).
 * One row per block — created on demand, never deleted by the admin UI.
 */
@Entity
@Table(name = "block_texts")
public class BlockText {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String heading;

    @Column(columnDefinition = "TEXT")
    private String body;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getHeading() {
        return heading;
    }

    public void setHeading(String heading) {
        this.heading = heading;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }
}
