/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-14
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.ServiceOfferingDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.entity.Category;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.exception.UnauthorizedException;
import com.bookmysalon.repository.CategoryRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.security.SecurityUtils;
import com.bookmysalon.service.ServiceOfferingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-offerings")
@RequiredArgsConstructor
public class ServiceOfferingController {

    private final ServiceOfferingService serviceOfferingService;
    private final SalonRepository salonRepository;
    private final CategoryRepository categoryRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<ServiceOfferingDto>> createServiceOffering(@RequestBody ServiceOfferingDto serviceOfferingDto) {
        ensureCanManageSalon(serviceOfferingDto.getSalonId());
        ensureCategoryBelongsToSalon(serviceOfferingDto.getCategoryId(), serviceOfferingDto.getSalonId());
        ServiceOfferingDto created = serviceOfferingService.createServiceOffering(serviceOfferingDto);
        return ResponseEntity.ok(ApiResponse.ok(created, "Service offering created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceOfferingDto>> getServiceOffering(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(serviceOfferingService.getServiceOfferingById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceOfferingDto>>> getAllServiceOfferings() {
        return ResponseEntity.ok(ApiResponse.ok(serviceOfferingService.getAllServiceOfferings()));
    }

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<ApiResponse<List<ServiceOfferingDto>>> getSalonServiceOfferings(@PathVariable Long salonId) {
        return ResponseEntity.ok(ApiResponse.ok(serviceOfferingService.getServiceOfferingsBySalonId(salonId)));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<List<ServiceOfferingDto>>> getCategoryServiceOfferings(@PathVariable Long categoryId) {
        return ResponseEntity.ok(ApiResponse.ok(serviceOfferingService.getServiceOfferingsByCategoryId(categoryId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceOfferingDto>> updateServiceOffering(@PathVariable Long id,
                                                                               @RequestBody ServiceOfferingDto serviceOfferingDto) {
        ServiceOfferingDto existing = serviceOfferingService.getServiceOfferingById(id);
        ensureCanManageSalon(existing.getSalonId());
        if (serviceOfferingDto.getCategoryId() != null) {
            ensureCategoryBelongsToSalon(serviceOfferingDto.getCategoryId(), existing.getSalonId());
        }
        serviceOfferingDto.setSalonId(existing.getSalonId());
        ServiceOfferingDto updated = serviceOfferingService.updateServiceOffering(id, serviceOfferingDto);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Service offering updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteServiceOffering(@PathVariable Long id) {
        ServiceOfferingDto existing = serviceOfferingService.getServiceOfferingById(id);
        ensureCanManageSalon(existing.getSalonId());
        serviceOfferingService.deleteServiceOffering(id);
        return ResponseEntity.ok(ApiResponse.message("Service offering deleted successfully"));
    }

    private void ensureCanManageSalon(Long salonId) {
        if (salonId == null || salonId <= 0) {
            throw new IllegalArgumentException("Salon ID is required and must be valid");
        }
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new IllegalArgumentException("Salon not found with id: " + salonId));

        if (SecurityUtils.isAdmin()) {
            return;
        }
        if (!SecurityUtils.isSalonOwner() || salon.getOwnerId() == null
                || !salon.getOwnerId().equals(SecurityUtils.currentUserId())) {
            throw new UnauthorizedException("You are not allowed to manage services for this salon");
        }
    }

    private void ensureCategoryBelongsToSalon(Long categoryId, Long salonId) {
        if (categoryId == null || categoryId <= 0) {
            throw new IllegalArgumentException("Category ID is required and must be valid");
        }
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + categoryId));
        if (!category.getSalonId().equals(salonId)) {
            throw new IllegalArgumentException("Selected category does not belong to this salon");
        }
    }
}
