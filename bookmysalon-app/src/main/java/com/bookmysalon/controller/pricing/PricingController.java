/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 */
package com.bookmysalon.controller.pricing;

import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.service.pricing.PricingService;
import com.bookmysalon.service.pricing.PricingService.PriceEstimate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;

    @GetMapping("/estimate")
    public ResponseEntity<ApiResponse<PriceEstimate>> estimate(
            @RequestParam Long serviceOfferingId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime slot) {
        return ResponseEntity.ok(ApiResponse.ok(pricingService.estimate(serviceOfferingId, slot)));
    }
}
