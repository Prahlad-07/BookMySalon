/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-08-31
 *
 * <p>Reporting built on the JPA model (no hand-rolled SQL against tables that do
 * not exist). Every query is scoped by the caller in the controller layer.</p>
 */
package com.bookmysalon.service.analytics;

import com.bookmysalon.dto.analytics.AdminAnalyticsDto;
import com.bookmysalon.dto.analytics.DailyRevenueDto;
import com.bookmysalon.dto.analytics.PopularServiceDto;
import com.bookmysalon.dto.analytics.SalonAnalyticsDto;
import com.bookmysalon.dto.analytics.TopSalonDto;
import com.bookmysalon.entity.Booking;
import com.bookmysalon.entity.BookingStatus;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.entity.UserRole;
import com.bookmysalon.exception.ResourceNotFoundException;
import com.bookmysalon.repository.BookingRepository;
import com.bookmysalon.repository.ReviewRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private static final int MAX_TREND_DAYS = 180;

    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final SalonRepository salonRepository;
    private final UserRepository userRepository;

    public AdminAnalyticsDto adminOverview(int days) {
        int windowDays = clampDays(days);
        LocalDateTime since = LocalDate.now().minusDays(windowDays - 1L).atStartOfDay();

        Map<String, Long> byStatus = toStatusMap(bookingRepository.countGroupByStatus());
        long totalBookings = byStatus.values().stream().mapToLong(Long::longValue).sum();
        double totalRevenue = round(bookingRepository.sumTotalPriceExcludingCancelled());

        List<TopSalonDto> topSalons = topSalons(5);
        List<PopularServiceDto> popular = popularServices(null, 8);
        List<DailyRevenueDto> trend = revenueTrend(bookingRepository.findByCreatedAtAfter(since), windowDays);

        return AdminAnalyticsDto.builder()
                .totalSalons(salonRepository.count())
                .totalCustomers(userRepository.countByRole(UserRole.CUSTOMER))
                .totalBookings(totalBookings)
                .totalRevenue(totalRevenue)
                .completedRevenue(round(bookingRepository.sumTotalPriceByStatus(BookingStatus.COMPLETED)))
                .repeatCustomerRate(repeatCustomerRate())
                .bookingsByStatus(byStatus)
                .revenueTrend(trend)
                .topSalons(topSalons)
                .popularServices(popular)
                .build();
    }

    public SalonAnalyticsDto salonOverview(Long salonId, int days) {
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new ResourceNotFoundException("Salon not found with id: " + salonId));
        int windowDays = clampDays(days);
        LocalDateTime since = LocalDate.now().minusDays(windowDays - 1L).atStartOfDay();

        Map<String, Long> byStatus = toStatusMap(bookingRepository.countGroupByStatusForSalon(salonId));
        long upcoming = bookingRepository.countBySalonIdAndStatusInAndStartTimeGreaterThan(
                salonId, List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED), LocalDateTime.now());

        List<DailyRevenueDto> trend = revenueTrend(
                bookingRepository.findBySalonIdAndCreatedAtAfter(salonId, since), windowDays);

        return SalonAnalyticsDto.builder()
                .salonId(salonId)
                .salonName(salon.getName())
                .totalBookings(bookingRepository.countBySalonId(salonId))
                .upcomingBookings(upcoming)
                .completedRevenue(round(bookingRepository.sumTotalPriceBySalonAndStatus(salonId, BookingStatus.COMPLETED)))
                .projectedRevenue(round(bookingRepository.sumTotalPriceBySalonAndStatuses(
                        salonId, List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED))))
                .averageRating(round(reviewRepository.averageRatingForSalon(salonId)))
                .reviewCount(reviewRepository.countBySalonId(salonId))
                .bookingsByStatus(byStatus)
                .revenueTrend(trend)
                .popularServices(popularServices(salonId, 6))
                .build();
    }

    // ---- helpers -----------------------------------------------------

    private List<TopSalonDto> topSalons(int limit) {
        List<Object[]> rows = bookingRepository.aggregateBySalon(PageRequest.of(0, Math.max(1, limit)));
        if (rows.isEmpty()) {
            return List.of();
        }
        List<Long> ids = rows.stream().map(r -> ((Number) r[0]).longValue()).toList();
        Map<Long, Salon> salons = salonRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Salon::getId, s -> s));
        List<TopSalonDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            Long id = ((Number) row[0]).longValue();
            Salon salon = salons.get(id);
            result.add(TopSalonDto.builder()
                    .salonId(id)
                    .name(salon != null ? salon.getName() : "Salon #" + id)
                    .city(salon != null ? salon.getCity() : null)
                    .bookings(((Number) row[1]).longValue())
                    .revenue(round(((Number) row[2]).doubleValue()))
                    .build());
        }
        return result;
    }

    private List<PopularServiceDto> popularServices(Long salonId, int limit) {
        return bookingRepository.popularServices(salonId, PageRequest.of(0, Math.max(1, limit))).stream()
                .map(row -> PopularServiceDto.builder()
                        .serviceId(((Number) row[0]).longValue())
                        .serviceName((String) row[1])
                        .count(((Number) row[2]).intValue())
                        .build())
                .toList();
    }

    private List<DailyRevenueDto> revenueTrend(List<Booking> bookings, int windowDays) {
        Map<LocalDate, double[]> byDay = new TreeMap<>();
        LocalDate start = LocalDate.now().minusDays(windowDays - 1L);
        for (int i = 0; i < windowDays; i++) {
            byDay.put(start.plusDays(i), new double[]{0, 0});
        }
        for (Booking b : bookings) {
            if (b.getCreatedAt() == null) {
                continue;
            }
            LocalDate day = b.getCreatedAt().toLocalDate();
            double[] cell = byDay.get(day);
            if (cell == null) {
                continue;
            }
            if (b.getStatus() != BookingStatus.CANCELLED) {
                cell[0] += b.getTotalPrice() == null ? 0 : b.getTotalPrice();
            }
            cell[1] += 1;
        }
        List<DailyRevenueDto> trend = new ArrayList<>();
        byDay.forEach((day, cell) -> trend.add(DailyRevenueDto.builder()
                .date(day)
                .revenue(round(cell[0]))
                .bookings((long) cell[1])
                .build()));
        return trend;
    }

    private double repeatCustomerRate() {
        List<Object[]> rows = bookingRepository.countGroupByCustomer();
        if (rows.isEmpty()) {
            return 0d;
        }
        long repeat = rows.stream().filter(r -> ((Number) r[1]).longValue() > 1).count();
        return round(100.0 * repeat / rows.size());
    }

    private Map<String, Long> toStatusMap(List<Object[]> rows) {
        Map<String, Long> map = new LinkedHashMap<>();
        for (BookingStatus status : BookingStatus.values()) {
            map.put(status.name(), 0L);
        }
        for (Object[] row : rows) {
            map.put(((BookingStatus) row[0]).name(), ((Number) row[1]).longValue());
        }
        return map;
    }

    private int clampDays(int days) {
        if (days <= 0) {
            return 30;
        }
        return Math.min(days, MAX_TREND_DAYS);
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
