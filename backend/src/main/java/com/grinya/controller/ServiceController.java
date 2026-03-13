package com.grinya.controller;

import com.grinya.dto.ReorderRequest;
import com.grinya.dto.ServiceResponse;
import com.grinya.model.Service;
import com.grinya.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
public class ServiceController {

    @Autowired
    private ServiceRepository serviceRepository;

    // ── Public ───────────────────────────────────────────────────────────────

    @GetMapping("/api/services")
    public ResponseEntity<List<ServiceResponse>> getServices() {
        List<ServiceResponse> result = serviceRepository.findAllByOrderBySortOrder()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    @PostMapping("/api/admin/services")
    public ResponseEntity<?> createService(
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String price) {

        if (title == null || title.isBlank()) {
            return ResponseEntity.badRequest().body("Title is required");
        }

        Service service = new Service();
        service.setTitle(title.trim());
        service.setDescription(description != null ? description.trim() : null);
        service.setPrice(price != null ? price.trim() : null);
        service.setSortOrder(serviceRepository.findAllByOrderBySortOrder().size());

        return ResponseEntity.ok(toResponse(serviceRepository.save(service)));
    }

    @PutMapping("/api/admin/services/{id}")
    public ResponseEntity<?> updateService(
            @PathVariable Long id,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String price) {

        return serviceRepository.findById(id).map(service -> {
            if (title != null && !title.isBlank()) {
                service.setTitle(title.trim());
            }
            if (description != null) {
                service.setDescription(description.trim());
            }
            if (price != null) {
                service.setPrice(price.trim());
            }
            return ResponseEntity.ok(toResponse(serviceRepository.save(service)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/admin/services/{id}")
    public ResponseEntity<?> deleteService(@PathVariable Long id) {
        return serviceRepository.findById(id).map(service -> {
            serviceRepository.delete(service);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/api/admin/services/reorder")
    public ResponseEntity<?> reorderServices(@RequestBody ReorderRequest request) {
        List<Long> ids = request.getOrderedIds();
        for (int i = 0; i < ids.size(); i++) {
            int index = i;
            serviceRepository.findById(ids.get(i)).ifPresent(service -> {
                service.setSortOrder(index);
                serviceRepository.save(service);
            });
        }
        return ResponseEntity.ok().build();
    }

    private ServiceResponse toResponse(Service service) {
        return new ServiceResponse(
                service.getId(),
                service.getTitle(),
                service.getDescription(),
                service.getPrice(),
                service.getSortOrder()
        );
    }
}
