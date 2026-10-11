/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-08-31
 */
package com.bookmysalon.controller.retention;

import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.dto.retention.ChurnScoreDto;
import com.bookmysalon.dto.retention.CouponDto;
import com.bookmysalon.security.SecurityUtils;
import com.bookmysalon.service.retention.RetentionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/retention")
@RequiredArgsConstructor
public class RetentionController {

    private final RetentionService retentionService;

    @GetMapping("/churn-score")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ChurnScoreDto>> churnScore(@RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(retentionService.computeChurnScore(userId)));
    }

    @PostMapping("/coupons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CouponDto>> generateCoupon(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "20") int discountPct,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.ok(
                retentionService.generateCouponForUser(userId, discountPct, days),
                "Coupon created"));
    }

    @GetMapping("/coupons/me")
    public ResponseEntity<ApiResponse<List<CouponDto>>> myCoupons() {
        return ResponseEntity.ok(ApiResponse.ok(
                retentionService.couponsForUser(SecurityUtils.currentUserId())));
    }
}
