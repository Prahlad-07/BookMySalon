/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 */
package com.bookmysalon.controller.analytics;

import com.bookmysalon.dto.analytics.AdminAnalyticsDto;
import com.bookmysalon.dto.analytics.SalonAnalyticsDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.exception.ResourceNotFoundException;
import com.bookmysalon.exception.UnauthorizedException;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.security.SecurityUtils;
import com.bookmysalon.service.analytics.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final SalonRepository salonRepository;

    @GetMapping("/admin/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminAnalyticsDto>> adminOverview(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.adminOverview(days)));
    }

    @GetMapping("/salon/{salonId}/overview")
    public ResponseEntity<ApiResponse<SalonAnalyticsDto>> salonOverview(
            @PathVariable Long salonId,
            @RequestParam(defaultValue = "30") int days) {
        ensureCanViewSalonAnalytics(salonId);
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.salonOverview(salonId, days)));
    }

    private void ensureCanViewSalonAnalytics(Long salonId) {
        if (SecurityUtils.isAdmin()) {
            return;
        }
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new ResourceNotFoundException("Salon not found with id: " + salonId));
        if (salon.getOwnerId() == null || !salon.getOwnerId().equals(SecurityUtils.currentUserId())) {
            throw new UnauthorizedException("You are not allowed to view analytics for this salon");
        }
    }
}
