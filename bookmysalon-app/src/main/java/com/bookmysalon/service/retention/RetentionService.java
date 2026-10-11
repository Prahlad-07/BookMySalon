/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-08-31
 */
package com.bookmysalon.service.retention;

import com.bookmysalon.dto.retention.ChurnScoreDto;
import com.bookmysalon.dto.retention.CouponDto;
import com.bookmysalon.entity.Booking;
import com.bookmysalon.entity.BookingStatus;
import com.bookmysalon.entity.Coupon;
import com.bookmysalon.exception.UserNotFoundException;
import com.bookmysalon.repository.BookingRepository;
import com.bookmysalon.repository.CouponRepository;
import com.bookmysalon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RetentionService {

    private final BookingRepository bookingRepository;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ChurnScoreDto computeChurnScore(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException("User not found with id: " + userId);
        }

        List<Booking> bookings = bookingRepository.findByCustomerId(userId);
        LocalDateTime now = LocalDateTime.now();

        long recent = bookings.stream()
                .filter(b -> b.getCreatedAt() != null && b.getCreatedAt().isAfter(now.minusDays(30)))
                .count();
        long cancellations = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED
                        && b.getCreatedAt() != null && b.getCreatedAt().isAfter(now.minusDays(90)))
                .count();
        LocalDateTime lastActivity = bookings.stream()
                .map(Booking::getCreatedAt)
                .filter(java.util.Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        // 0 (very likely to churn) .. 100 (highly engaged)
        int score = 50;
        score += (int) Math.min(recent * 15, 40);
        score -= (int) Math.min(cancellations * 10, 30);
        if (lastActivity == null || lastActivity.isBefore(now.minusDays(120))) {
            score -= 25;
        } else if (lastActivity.isBefore(now.minusDays(60))) {
            score -= 10;
        }
        score = Math.max(0, Math.min(100, score));

        String risk = score < 35 ? "HIGH" : score < 65 ? "MEDIUM" : "LOW";

        return ChurnScoreDto.builder()
                .userId(userId)
                .engagementScore(score)
                .riskLevel(risk)
                .bookingsLast30Days(recent)
                .cancellationsLast90Days(cancellations)
                .lastActivityAt(lastActivity)
                .build();
    }

    public CouponDto generateCouponForUser(Long userId, int discountPct, int daysValid) {
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException("User not found with id: " + userId);
        }
        int pct = Math.max(1, Math.min(discountPct, 80));
        int days = Math.max(1, Math.min(daysValid, 365));

        LocalDateTime now = LocalDateTime.now();
        Coupon coupon = new Coupon();
        coupon.setCode(uniqueCode());
        coupon.setDiscountPct(pct);
        coupon.setValidFrom(now);
        coupon.setValidUntil(now.plusDays(days));
        coupon.setUsageLimit(1);
        coupon.setTimesUsed(0);
        coupon.setUserId(userId);
        Coupon saved = couponRepository.save(coupon);

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<CouponDto> couponsForUser(Long userId) {
        return couponRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toDto).toList();
    }

    private String uniqueCode() {
        String code;
        do {
            code = "RET-" + RandomStringUtils.randomAlphanumeric(6).toUpperCase();
        } while (couponRepository.existsByCodeIgnoreCase(code));
        return code;
    }

    private CouponDto toDto(Coupon coupon) {
        CouponDto dto = new CouponDto();
        dto.setCode(coupon.getCode());
        dto.setDiscountPct(coupon.getDiscountPct());
        dto.setValidFrom(coupon.getValidFrom());
        dto.setValidUntil(coupon.getValidUntil());
        return dto;
    }
}
