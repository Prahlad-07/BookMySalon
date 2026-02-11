package com.bookmysalon.controller;

import com.bookmysalon.dto.SalonDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.service.SalonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/salons")
@RequiredArgsConstructor
public class SalonController {

    private final SalonService salonService;

    @PostMapping
    public ResponseEntity<ApiResponse<SalonDto>> createSalon(@RequestBody SalonDto salonDto) {
        try {
            SalonDto createdSalon = salonService.createSalon(salonDto);
            return ResponseEntity.ok(ApiResponse.<SalonDto>builder()
                    .success(true)
                    .message("Salon created successfully")
                    .data(createdSalon)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<SalonDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SalonDto>> getSalon(@PathVariable Long id) {
        try {
            SalonDto salon = salonService.getSalonById(id);
            return ResponseEntity.ok(ApiResponse.<SalonDto>builder()
                    .success(true)
                    .data(salon)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<SalonDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SalonDto>>> getAllSalons() {
        try {
            List<SalonDto> salons = salonService.getAllSalons();
            return ResponseEntity.ok(ApiResponse.<List<SalonDto>>builder()
                    .success(true)
                    .data(salons)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<SalonDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<List<SalonDto>>> getSalonsByOwner(@PathVariable Long ownerId) {
        try {
            List<SalonDto> salons = salonService.getSalonsByOwnerId(ownerId);
            return ResponseEntity.ok(ApiResponse.<List<SalonDto>>builder()
                    .success(true)
                    .data(salons)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<SalonDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<ApiResponse<List<SalonDto>>> getSalonsByCity(@PathVariable String city) {
        try {
            List<SalonDto> salons = salonService.getSalonsByCity(city);
            return ResponseEntity.ok(ApiResponse.<List<SalonDto>>builder()
                    .success(true)
                    .data(salons)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<SalonDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SalonDto>> updateSalon(@PathVariable Long id, @RequestBody SalonDto salonDto) {
        try {
            SalonDto updatedSalon = salonService.updateSalon(id, salonDto);
            return ResponseEntity.ok(ApiResponse.<SalonDto>builder()
                    .success(true)
                    .message("Salon updated successfully")
                    .data(updatedSalon)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<SalonDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSalon(@PathVariable Long id) {
        try {
            salonService.deleteSalon(id);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Salon deleted successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<Void>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }
}
