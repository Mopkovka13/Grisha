package com.grinya.config;

import com.grinya.model.Category;
import com.grinya.model.Service;
import com.grinya.repository.CategoryRepository;
import com.grinya.repository.ServiceRepository;
import com.grinya.repository.VideoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private DataSource dataSource;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        dropLegacyCategoryCheckConstraints();
        seedDefaultCategories();
        migrateLegacyVideoCategories();
        seedDefaultServices();
    }

    // Hibernate created a CHECK constraint for the old VideoCategory enum:
    // CHECK (CATEGORY IN ('WEDDING','CORPORATE','OTHER'))
    // ddl-auto:update doesn't remove it, so we drop it manually before migration.
    private void dropLegacyCategoryCheckConstraints() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            ResultSet rs = stmt.executeQuery(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS " +
                "WHERE TABLE_NAME = 'VIDEOS' AND CONSTRAINT_TYPE = 'CHECK'"
            );

            List<String> names = new ArrayList<>();
            while (rs.next()) names.add(rs.getString(1));

            for (String name : names) {
                try {
                    stmt.execute("ALTER TABLE VIDEOS DROP CONSTRAINT \"" + name + "\"");
                    logger.info("Dropped legacy check constraint: {}", name);
                } catch (Exception e) {
                    logger.warn("Could not drop constraint {}: {}", name, e.getMessage());
                }
            }
        } catch (Exception e) {
            logger.warn("Could not query check constraints: {}", e.getMessage());
        }
    }

    private void seedDefaultCategories() {
        List<Object[]> defaults = List.of(
                new Object[]{"wedding",   "Свадебное видео",     0},
                new Object[]{"corporate", "Корпоративное видео", 1},
                new Object[]{"other",     "Другое видео",        2}
        );
        for (Object[] row : defaults) {
            String slug = (String) row[0];
            if (!categoryRepository.existsBySlug(slug)) {
                Category cat = new Category();
                cat.setSlug(slug);
                cat.setDisplayName((String) row[1]);
                cat.setSortOrder((Integer) row[2]);
                categoryRepository.save(cat);
            }
        }
        if (!categoryRepository.existsBySlug("showcase")) {
            Category cat = new Category();
            cat.setSlug("showcase");
            cat.setDisplayName("Главная страница");
            cat.setSortOrder(99);
            cat.setVisible(false);
            categoryRepository.save(cat);
        }
    }

    private void seedDefaultServices() {
        if (serviceRepository.count() > 0) return;

        Object[][] defaults = {
            {"Свадебная съёмка",   "Полный день съёмки, монтаж свадебного фильма и короткого ролика для соцсетей. Сохраню самые трогательные моменты вашего дня.",                         "от 50 000 ₽", 0},
            {"Рекламные ролики",   "Создание рекламных видео для бизнеса: от разработки концепции до финального монтажа и цветокоррекции.",                                                 "от 80 000 ₽", 1},
            {"Музыкальные клипы",  "Съёмка и постпродакшн музыкальных клипов любой сложности. Работаю с артистами всех жанров.",                                                           "от 100 000 ₽", 2},
            {"Мероприятия",        "Видеосъёмка конференций, корпоративов, концертов и других мероприятий. Многокамерная съёмка.",                                                          "от 30 000 ₽", 3},
        };

        for (Object[] row : defaults) {
            Service s = new Service();
            s.setTitle((String) row[0]);
            s.setDescription((String) row[1]);
            s.setPrice((String) row[2]);
            s.setSortOrder((Integer) row[3]);
            serviceRepository.save(s);
        }
    }

    // Converts legacy uppercase values (WEDDING → wedding) stored by the old enum
    private void migrateLegacyVideoCategories() {
        Map<String, String> legacy = Map.of(
                "WEDDING",   "wedding",
                "CORPORATE", "corporate",
                "OTHER",     "other"
        );
        videoRepository.findAll().forEach(video -> {
            String cat = video.getCategory();
            if (cat != null && legacy.containsKey(cat)) {
                video.setCategory(legacy.get(cat));
                videoRepository.save(video);
            }
        });
    }
}
