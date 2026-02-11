package com.bookmysalon.controller;

import com.bookmysalon.dto.ServiceOfferingDto;
import com.bookmysalon.dto.response.ApiResponse;
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

    @PostMapping
    public ResponseEntity<ApiResponse<ServiceOfferingDto>> createServiceOffering(@RequestBody ServiceOfferingDto serviceOfferingDto) {
        try {
            ServiceOfferingDto created = serviceOfferingService.createServiceOffering(serviceOfferingDto);
            return ResponseEntity.ok(ApiResponse.<ServiceOfferingDto>builder()
                    .success(true)
                    .message("Service offering created successfully")
                    .data(created)
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
            ServiceOfferingDto updated = serviceOfferingService.updateServiceOffering(id, serviceOfferingDto);
            return ResponseEntity.ok(ApiResponse.<ServiceOfferingDto>builder()
                    .success(true)
                    .message("Service offering updated successfully")
                    .data(updated)
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
            serviceOfferingService.deleteServiceOffering(id);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Service offering deleted successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<Void>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }
}
