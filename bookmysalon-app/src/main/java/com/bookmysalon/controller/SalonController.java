/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.SalonDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.entity.Role;
import com.bookmysalon.entity.User;
import com.bookmysalon.entity.UserRole;
import com.bookmysalon.exception.UnauthorizedException;
import com.bookmysalon.repository.RoleRepository;
import com.bookmysalon.repository.UserRepository;
import com.bookmysalon.security.CustomUserPrincipal;
import com.bookmysalon.service.SalonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/salons")
@RequiredArgsConstructor
public class SalonController {

    private final SalonService salonService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @PostMapping("/me")
    public ResponseEntity<ApiResponse<SalonDto>> createSalonForCurrentOwner(@RequestBody SalonDto salonDto) {
        try {
            CustomUserPrincipal principal = getCurrentUserPrincipal();
            promoteToSalonOwnerIfNeeded(principal.getId());

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
            User user = userRepository.findById(principal.getId())
                    .orElseThrow(() -> new UnauthorizedException("User account not found"));

            if (!isOwnerOrAdmin(user)) {
                return ResponseEntity.ok(ApiResponse.<List<SalonDto>>builder()
                        .success(true)
                        .message("No owner salons yet. Create your first salon.")
                        .data(List.of())
                        .build());
            }

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
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserPrincipal principal)) {
            throw new UnauthorizedException("User authentication is required");
        }
        return principal;
    }

    private boolean isOwnerOrAdmin(User user) {
        if (user.getRole() == UserRole.SALON_OWNER || user.getRole() == UserRole.ADMIN) {
            return true;
        }

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return false;
        }

        return user.getRoles().stream()
                .map(role -> role.getName())
                .anyMatch(roleName -> roleName == UserRole.SALON_OWNER || roleName == UserRole.ADMIN);
    }

    private void promoteToSalonOwnerIfNeeded(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User account not found"));

        if (isOwnerOrAdmin(user)) {
            return;
        }

        Role ownerRole = roleRepository.findByName(UserRole.SALON_OWNER)
                .orElseGet(() -> roleRepository.save(new Role(null, UserRole.SALON_OWNER)));

        Set<Role> updatedRoles = user.getRoles() == null ? new HashSet<>() : new HashSet<>(user.getRoles());
        updatedRoles.add(ownerRole);
        user.setRoles(updatedRoles);
        user.setRole(UserRole.SALON_OWNER);
        userRepository.save(user);
    }
}
