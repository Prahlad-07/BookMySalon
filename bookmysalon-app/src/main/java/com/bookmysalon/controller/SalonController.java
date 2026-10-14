/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-14
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.SalonDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.exception.UnauthorizedException;
import com.bookmysalon.security.SecurityUtils;
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

    @PostMapping("/me")
    public ResponseEntity<ApiResponse<SalonDto>> createSalonForCurrentOwner(@RequestBody SalonDto salonDto) {
        ensureSalonOwnerAccess();
        salonDto.setOwnerId(SecurityUtils.currentUserId());
        SalonDto createdSalon = salonService.createSalon(salonDto);
        return ResponseEntity.ok(ApiResponse.ok(createdSalon, "Salon created successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<SalonDto>>> getCurrentOwnerSalons() {
        ensureSalonOwnerAccess();
        List<SalonDto> salons = salonService.getSalonsByOwnerId(SecurityUtils.currentUserId());
        String message = salons.isEmpty()
                ? "No owner salons yet. Create your first salon."
                : "Owner salons fetched successfully";
        return ResponseEntity.ok(ApiResponse.ok(salons, message));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SalonDto>> createSalon(@RequestBody SalonDto salonDto) {
        ensureSalonOwnerAccess();
        if (!SecurityUtils.isAdmin() || salonDto.getOwnerId() == null) {
            salonDto.setOwnerId(SecurityUtils.currentUserId());
        }
        SalonDto createdSalon = salonService.createSalon(salonDto);
        return ResponseEntity.ok(ApiResponse.ok(createdSalon, "Salon created successfully"));
    }

    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<SalonDto>>> getSalonsNearLocation(
            @RequestParam("lat") double latitude,
            @RequestParam("lng") double longitude,
            @RequestParam(value = "radius", defaultValue = "10") double radiusKm) {
        List<SalonDto> salons = salonService.getSalonsNearLocation(latitude, longitude, radiusKm);
        return ResponseEntity.ok(ApiResponse.ok(salons));
    }

    /**
     * Paginated, filterable public listing. Filtering, sorting and paging run in the
     * database against indexed columns, so cost stays flat as the catalogue grows.
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<com.bookmysalon.dto.response.PageResponse<SalonDto>>> searchSalons(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "minRating", required = false) Double minRating,
            @RequestParam(value = "maxPrice", required = false) Double maxPrice,
            @RequestParam(value = "openNow", defaultValue = "false") boolean openNow,
            @RequestParam(value = "sort", defaultValue = "rating") String sort,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "12") int size) {
        var criteria = new com.bookmysalon.dto.SalonSearchCriteria(q, city, minRating, maxPrice, openNow, sort);
        return ResponseEntity.ok(ApiResponse.ok(salonService.searchSalons(criteria, page, size)));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<com.bookmysalon.dto.SalonInsightsDto>> insights() {
        return ResponseEntity.ok(ApiResponse.ok(salonService.getInsights()));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<SalonDto>> getSalon(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(salonService.getSalonById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SalonDto>>> getAllSalons() {
        return ResponseEntity.ok(ApiResponse.ok(salonService.getAllSalons()));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<List<SalonDto>>> getSalonsByOwner(@PathVariable Long ownerId) {
        if (!SecurityUtils.isAdmin() && !SecurityUtils.currentUserId().equals(ownerId)) {
            throw new UnauthorizedException("You are not allowed to view this owner's salons");
        }
        return ResponseEntity.ok(ApiResponse.ok(salonService.getSalonsByOwnerId(ownerId)));
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<ApiResponse<List<SalonDto>>> getSalonsByCity(@PathVariable String city) {
        return ResponseEntity.ok(ApiResponse.ok(salonService.getSalonsByCity(city)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SalonDto>> updateSalon(@PathVariable Long id, @RequestBody SalonDto salonDto) {
        SalonDto existingSalon = salonService.getSalonById(id);
        ensureCanManageSalon(existingSalon);
        salonDto.setOwnerId(existingSalon.getOwnerId());
        SalonDto updatedSalon = salonService.updateSalon(id, salonDto);
        return ResponseEntity.ok(ApiResponse.ok(updatedSalon, "Salon updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSalon(@PathVariable Long id) {
        SalonDto existingSalon = salonService.getSalonById(id);
        ensureCanManageSalon(existingSalon);
        salonService.deleteSalon(id);
        return ResponseEntity.ok(ApiResponse.message("Salon deleted successfully"));
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
        if (!SecurityUtils.isSalonOwner() || salon.getOwnerId() == null
                || !salon.getOwnerId().equals(SecurityUtils.currentUserId())) {
            throw new UnauthorizedException("You are not allowed to manage this salon");
        }
    }
}
