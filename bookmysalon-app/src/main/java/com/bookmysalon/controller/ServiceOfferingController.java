/**
 * @author Prahlad Yadav
 * @version 1.0
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
import org.springframework.http.HttpStatus;
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
        try {
            ensureCanManageSalon(serviceOfferingDto.getSalonId());
            ensureCategoryBelongsToSalon(serviceOfferingDto.getCategoryId(), serviceOfferingDto.getSalonId());
            ServiceOfferingDto created = serviceOfferingService.createServiceOffering(serviceOfferingDto);
            return ResponseEntity.ok(ApiResponse.<ServiceOfferingDto>builder()
                    .success(true)
                    .message("Service offering created successfully")
                    .data(created)
                    .build());
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.<ServiceOfferingDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<ServiceOfferingDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceOfferingDto>> getServiceOffering(@PathVariable Long id) {
        try {
            ServiceOfferingDto serviceOffering = serviceOfferingService.getServiceOfferingById(id);
            return ResponseEntity.ok(ApiResponse.<ServiceOfferingDto>builder()
                    .success(true)
                    .data(serviceOffering)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<ServiceOfferingDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceOfferingDto>>> getAllServiceOfferings() {
        try {
            List<ServiceOfferingDto> serviceOfferings = serviceOfferingService.getAllServiceOfferings();
            return ResponseEntity.ok(ApiResponse.<List<ServiceOfferingDto>>builder()
                    .success(true)
                    .data(serviceOfferings)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<ServiceOfferingDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<ApiResponse<List<ServiceOfferingDto>>> getSalonServiceOfferings(@PathVariable Long salonId) {
        try {
            List<ServiceOfferingDto> serviceOfferings = serviceOfferingService.getServiceOfferingsBySalonId(salonId);
            return ResponseEntity.ok(ApiResponse.<List<ServiceOfferingDto>>builder()
                    .success(true)
                    .data(serviceOfferings)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<ServiceOfferingDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<List<ServiceOfferingDto>>> getCategoryServiceOfferings(@PathVariable Long categoryId) {
        try {
            List<ServiceOfferingDto> serviceOfferings = serviceOfferingService.getServiceOfferingsByCategoryId(categoryId);
            return ResponseEntity.ok(ApiResponse.<List<ServiceOfferingDto>>builder()
                    .success(true)
                    .data(serviceOfferings)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<ServiceOfferingDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceOfferingDto>> updateServiceOffering(@PathVariable Long id, @RequestBody ServiceOfferingDto serviceOfferingDto) {
        try {
            ServiceOfferingDto existing = serviceOfferingService.getServiceOfferingById(id);
            ensureCanManageSalon(existing.getSalonId());
            if (serviceOfferingDto.getCategoryId() != null) {
                ensureCategoryBelongsToSalon(serviceOfferingDto.getCategoryId(), existing.getSalonId());
            }
            serviceOfferingDto.setSalonId(existing.getSalonId());
            ServiceOfferingDto updated = serviceOfferingService.updateServiceOffering(id, serviceOfferingDto);
            return ResponseEntity.ok(ApiResponse.<ServiceOfferingDto>builder()
                    .success(true)
                    .message("Service offering updated successfully")
                    .data(updated)
                    .build());
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.<ServiceOfferingDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.<ServiceOfferingDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<ServiceOfferingDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteServiceOffering(@PathVariable Long id) {
        try {
            ServiceOfferingDto existing = serviceOfferingService.getServiceOfferingById(id);
            ensureCanManageSalon(existing.getSalonId());
            serviceOfferingService.deleteServiceOffering(id);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Service offering deleted successfully")
                    .build());
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.<Void>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<Void>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
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
        if (!SecurityUtils.isSalonOwner() || salon.getOwnerId() == null || !salon.getOwnerId().equals(SecurityUtils.currentUserId())) {
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
