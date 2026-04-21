/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.SalonDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.exception.UnauthorizedException;
import com.bookmysalon.security.SecurityUtils;
import com.bookmysalon.service.SalonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/salons")
@RequiredArgsConstructor
public class SalonController {

    private final SalonService salonService;

    @PostMapping("/me")
    public ResponseEntity<ApiResponse<SalonDto>> createSalonForCurrentOwner(@RequestBody SalonDto salonDto) {
        try {
            ensureSalonOwnerAccess();

            salonDto.setOwnerId(SecurityUtils.currentUserId());
            SalonDto createdSalon = salonService.createSalon(salonDto);
            return ResponseEntity.ok(ApiResponse.<SalonDto>builder()
                    .success(true)
                    .message("Salon created successfully")
                    .data(createdSalon)
                    .build());
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(ApiResponse.<SalonDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<SalonDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<SalonDto>>> getCurrentOwnerSalons() {
        try {
            ensureSalonOwnerAccess();

            List<SalonDto> salons = salonService.getSalonsByOwnerId(SecurityUtils.currentUserId());

            if (salons.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.<List<SalonDto>>builder()
                        .success(true)
                        .message("No owner salons yet. Create your first salon.")
                        .data(List.of())
                        .build());
            }

            return ResponseEntity.ok(ApiResponse.<List<SalonDto>>builder()
                    .success(true)
                    .message("Owner salons fetched successfully")
                    .data(salons)
                    .build());
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(ApiResponse.<List<SalonDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<SalonDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SalonDto>> createSalon(@RequestBody SalonDto salonDto) {
        try {
            ensureSalonOwnerAccess();
            if (!SecurityUtils.isAdmin()) {
                salonDto.setOwnerId(SecurityUtils.currentUserId());
            } else if (salonDto.getOwnerId() == null) {
                salonDto.setOwnerId(SecurityUtils.currentUserId());
            }
            SalonDto createdSalon = salonService.createSalon(salonDto);
            return ResponseEntity.ok(ApiResponse.<SalonDto>builder()
                    .success(true)
                    .message("Salon created successfully")
                    .data(createdSalon)
                    .build());
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(ApiResponse.<SalonDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<SalonDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<SalonDto>>> getSalonsNearLocation(
            @RequestParam("lat") double latitude,
            @RequestParam("lng") double longitude,
            @RequestParam(value = "radius", defaultValue = "10") double radiusKm
    ) {
        try {
            List<SalonDto> salons = salonService.getSalonsNearLocation(latitude, longitude, radiusKm);
            return ResponseEntity.ok(ApiResponse.<List<SalonDto>>builder()
                    .success(true)
                    .data(salons)
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.<List<SalonDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<SalonDto>>builder()
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
            if (!SecurityUtils.isAdmin() && !SecurityUtils.currentUserId().equals(ownerId)) {
                return forbidden("You are not allowed to view this owner's salons");
            }
            List<SalonDto> salons = salonService.getSalonsByOwnerId(ownerId);
            return ResponseEntity.ok(ApiResponse.<List<SalonDto>>builder()
                    .success(true)
                    .data(salons)
                    .build());
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(ApiResponse.<List<SalonDto>>builder()
                    .success(false)
                    .error(e.getMessage())
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
            SalonDto existingSalon = salonService.getSalonById(id);
            ensureCanManageSalon(existingSalon);
            salonDto.setOwnerId(existingSalon.getOwnerId());
            SalonDto updatedSalon = salonService.updateSalon(id, salonDto);
            return ResponseEntity.ok(ApiResponse.<SalonDto>builder()
                    .success(true)
                    .message("Salon updated successfully")
                    .data(updatedSalon)
                    .build());
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(ApiResponse.<SalonDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.<SalonDto>builder()
                    .success(false)
                    .error(e.getMessage())
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
            SalonDto existingSalon = salonService.getSalonById(id);
            ensureCanManageSalon(existingSalon);
            salonService.deleteSalon(id);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Salon deleted successfully")
                    .build());
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(ApiResponse.<Void>builder()
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

    private void ensureSalonOwnerAccess() {
        if (!SecurityUtils.isSalonOwner() && !SecurityUtils.isAdmin()) {
            throw new UnauthorizedException("Only salon owners or admins can manage salon profiles");
        }
    }

    private void ensureCanManageSalon(SalonDto salon) {
        if (SecurityUtils.isAdmin()) {
            return;
        }
        if (!SecurityUtils.isSalonOwner() || salon.getOwnerId() == null || !salon.getOwnerId().equals(SecurityUtils.currentUserId())) {
            throw new UnauthorizedException("You are not allowed to manage this salon");
        }
    }

    private <T> ResponseEntity<ApiResponse<T>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.<T>builder()
                .success(false)
                .error(message)
                .build());
    }
}
