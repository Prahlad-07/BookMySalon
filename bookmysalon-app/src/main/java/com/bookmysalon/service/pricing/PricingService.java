/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 */
package com.bookmysalon.service.pricing;

import com.bookmysalon.entity.BookingStatus;
import com.bookmysalon.entity.ServiceOffering;
import com.bookmysalon.exception.ResourceNotFoundException;
import com.bookmysalon.repository.BookingRepository;
import com.bookmysalon.repository.ServiceOfferingRepository;
import lombok.Builder;
import lombok.Value;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PricingService {

    private static final BigDecimal PEAK_MULTIPLIER = new BigDecimal("1.15");
    private static final BigDecimal WEEKEND_MULTIPLIER = new BigDecimal("1.10");
    private static final BigDecimal HIGH_DEMAND_MULTIPLIER = new BigDecimal("1.20");
    private static final int HIGH_DEMAND_THRESHOLD = 8;

    private final ServiceOfferingRepository serviceOfferingRepository;
    private final BookingRepository bookingRepository;

    public PriceEstimate estimate(Long serviceOfferingId, LocalDateTime slot) {
        ServiceOffering offering = serviceOfferingRepository.findById(serviceOfferingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Service offering not found with id: " + serviceOfferingId));
        if (slot == null) {
            throw new IllegalArgumentException("A booking slot is required to estimate pricing");
        }

        BigDecimal base = BigDecimal.valueOf(offering.getPrice() == null ? 0d : offering.getPrice());
        BigDecimal multiplier = BigDecimal.ONE;
        List<String> factors = new ArrayList<>();

        if (isPeakHour(slot)) {
            multiplier = multiplier.multiply(PEAK_MULTIPLIER);
            factors.add("Peak hours (+15%)");
        }
        if (isWeekend(slot)) {
            multiplier = multiplier.multiply(WEEKEND_MULTIPLIER);
            factors.add("Weekend (+10%)");
        }
        if (isHighDemand(offering.getSalonId(), slot)) {
            multiplier = multiplier.multiply(HIGH_DEMAND_MULTIPLIER);
            factors.add("High demand (+20%)");
        }
        if (factors.isEmpty()) {
            factors.add("Standard pricing");
        }

        BigDecimal estimated = base.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        return PriceEstimate.builder()
                .serviceOfferingId(serviceOfferingId)
                .basePrice(base.setScale(2, RoundingMode.HALF_UP))
                .estimatedPrice(estimated)
                .factors(factors)
                .build();
    }

    private boolean isPeakHour(LocalDateTime slot) {
        int hour = slot.getHour();
        return hour >= 17 && hour <= 20;
    }

    private boolean isWeekend(LocalDateTime slot) {
        DayOfWeek day = slot.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }

    private boolean isHighDemand(Long salonId, LocalDateTime slot) {
        LocalDateTime windowStart = slot.minusHours(12);
        LocalDateTime windowEnd = slot.plusHours(12);
        boolean overlaps = bookingRepository.existsBySalonIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                salonId, List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED), windowEnd, windowStart);
        if (!overlaps) {
            return false;
        }
        long upcoming = bookingRepository.countBySalonIdAndStatusInAndStartTimeGreaterThan(
                salonId, List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED), LocalDateTime.now());
        return upcoming >= HIGH_DEMAND_THRESHOLD;
    }

    @Value
    @Builder
    public static class PriceEstimate {
        Long serviceOfferingId;
        BigDecimal basePrice;
        BigDecimal estimatedPrice;
        List<String> factors;
    }
}
