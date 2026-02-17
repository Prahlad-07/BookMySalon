/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.SalonDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.exception.UnauthorizedException;
import com.bookmysalon.security.CustomUserPrincipal;
import com.bookmysalon.service.SalonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/salons")
@RequiredArgsConstructor
public class SalonController {

    private final SalonService salonService;

    @PostMapping("/me")
    public ResponseEntity<ApiResponse<SalonDto>> createSalonForCurrentOwner(@RequestBody SalonDto salonDto) {
        try {
            CustomUserPrincipal principal = getCurrentUserPrincipal();
            ensureOwnerOrAdmin();

            salonDto.setOwnerId(principal.getId());
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
            CustomUserPrincipal principal = getCurrentUserPrincipal();
            ensureOwnerOrAdmin();

            List<SalonDto> salons = salonService.getSalonsByOwnerId(principal.getId());
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

    private CustomUserPrincipal getCurrentUserPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (CustomUserPrincipal) authentication.getPrincipal();
    }

    private void ensureOwnerOrAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Set<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        if (!roles.contains("ROLE_SALON_OWNER") && !roles.contains("ROLE_ADMIN")) {
            throw new UnauthorizedException("Only salon owners or admins can manage owner salons");
        }
    }
}
