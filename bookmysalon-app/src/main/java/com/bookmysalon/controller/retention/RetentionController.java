package com.bookmysalon.controller.retention;

import com.bookmysalon.dto.retention.CouponDto;
import com.bookmysalon.service.retention.RetentionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/retention")
@RequiredArgsConstructor
public class RetentionController {
    private final RetentionService retentionService;

    @PostMapping("/generate-coupon")
    public CouponDto generateCoupon(@RequestParam Long userId, @RequestParam(defaultValue = "20") int discountPct, @RequestParam(defaultValue = "30") int days) {
        return retentionService.generateCouponForUser(userId, discountPct, days);
    }

    @PostMapping("/churn-score")
    public double churnScore(@RequestParam Long userId) {
        return retentionService.computeChurnScore(userId);
    }
}
