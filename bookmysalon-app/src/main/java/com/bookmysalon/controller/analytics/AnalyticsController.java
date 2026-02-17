package com.bookmysalon.controller.analytics;

import com.bookmysalon.service.analytics.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    @GetMapping("/services/popular")
    public List<?> popularServices(@RequestParam(required = false) Long salonId, @RequestParam(defaultValue = "30") int days, @RequestParam(defaultValue = "10") int limit) {
        return analyticsService.getPopularServices(salonId, days, limit);
    }

    @GetMapping("/revenue")
    public List<Map<String, Object>> revenue(@RequestParam String start, @RequestParam String end) {
        return analyticsService.getRevenuePerDay(start, end);
    }

    @GetMapping("/heatmap")
    public List<Map<String, Object>> heatmap(@RequestParam Long salonId, @RequestParam(defaultValue = "90") int days) {
        return analyticsService.getPeakHeatmap(salonId, days);
    }

    @GetMapping("/repeat-rate")
    public double repeatRate(@RequestParam(defaultValue = "90") int days) {
        return analyticsService.getRepeatRate(days);
    }
}
