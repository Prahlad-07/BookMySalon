/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.controller.pricing;

import com.bookmysalon.service.pricing.PricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/pricing")
@RequiredArgsConstructor
public class PricingController {
    private final PricingService pricingService;
    @GetMapping("/estimate")
    public BigDecimal estimate(@RequestParam Long serviceOfferingId, @RequestParam Long salonId, @RequestParam String slot) {
        LocalDateTime dt = LocalDateTime.parse(slot);
        return pricingService.computePrice(serviceOfferingId, salonId, dt);
    }
}
