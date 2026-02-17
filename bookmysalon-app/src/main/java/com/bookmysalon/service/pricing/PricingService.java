package com.bookmysalon.service.pricing;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PricingService {
    private final JdbcTemplate jdbc;

    public BigDecimal computePrice(Long serviceOfferingId, Long salonId, LocalDateTime slot) {
        // fetch base price
        String sql = "SELECT base_price FROM service_offering WHERE id = ?";
        BigDecimal base = jdbc.queryForObject(sql, BigDecimal.class, serviceOfferingId);
        if (base == null) base = BigDecimal.ZERO;

        double timeFactor = isPeakHour(slot) ? 1.15 : 1.0;
        double demandFactor = highDemand(salonId, slot) ? 1.2 : 1.0;
        double dayFactor = isWeekend(slot) ? 1.1 : 1.0;

        BigDecimal finalPrice = base.multiply(BigDecimal.valueOf(timeFactor * demandFactor * dayFactor));
        return finalPrice.setScale(2, RoundingMode.HALF_UP);
    }

    private boolean isPeakHour(LocalDateTime slot) {
        int h = slot.getHour();
        return h >= 17 && h <= 20; // simple peak definition
    }

    private boolean highDemand(Long salonId, LocalDateTime slot) {
        // simple heuristic: bookings in next 24h greater than threshold
        String sql = "SELECT COUNT(*) FROM bookings WHERE salon_id = ? AND created_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 DAY)";
        Integer cnt = jdbc.queryForObject(sql, Integer.class, salonId);
        return cnt != null && cnt > 10; // threshold
    }

    private boolean isWeekend(LocalDateTime slot) {
        DayOfWeek d = slot.getDayOfWeek();
        return d == DayOfWeek.SATURDAY || d == DayOfWeek.SUNDAY;
    }
}
