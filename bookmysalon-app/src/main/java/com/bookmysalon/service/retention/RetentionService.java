package com.bookmysalon.service.retention;

import com.bookmysalon.dto.retention.CouponDto;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class RetentionService {
    private final JdbcTemplate jdbc;

    public double computeChurnScore(Long userId) {
        // simple scoring: recent activity + cancellations
        String sqlRecent = "SELECT COUNT(*) FROM bookings WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        Integer recent = jdbc.queryForObject(sqlRecent, Integer.class, userId);
        String sqlCancels = "SELECT COUNT(*) FROM bookings WHERE user_id = ? AND status = 'CANCELLED' AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)";
        Integer cancels = jdbc.queryForObject(sqlCancels, Integer.class, userId);

        int score = 0;
        if (recent != null && recent > 0) score += 5;
        if (cancels != null) score -= Math.min(cancels, 5);

        // normalize to -10..+10
        return Math.max(-10, Math.min(10, score));
    }

    public CouponDto generateCouponForUser(Long userId, int discountPct, int daysValid) {
        String code = "RET-" + RandomStringUtils.randomAlphanumeric(6).toUpperCase();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime until = now.plusDays(daysValid);
        String sql = "INSERT INTO coupons (code, discount_pct, valid_from, valid_until, usage_limit) VALUES (?, ?, ?, ?, ?)";
        jdbc.update(sql, code, discountPct, now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), until.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), 1);

        CouponDto dto = new CouponDto();
        dto.setCode(code);
        dto.setDiscountPct(discountPct);
        dto.setValidFrom(now);
        dto.setValidUntil(until);
        return dto;
    }
}
