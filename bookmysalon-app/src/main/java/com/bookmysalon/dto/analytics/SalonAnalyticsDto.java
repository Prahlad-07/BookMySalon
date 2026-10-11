/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-08-31
 */
package com.bookmysalon.dto.analytics;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class SalonAnalyticsDto {
    private Long salonId;
    private String salonName;
    private long totalBookings;
    private long upcomingBookings;
    private double completedRevenue;
    private double projectedRevenue;
    private double averageRating;
    private long reviewCount;
    private Map<String, Long> bookingsByStatus;
    private List<DailyRevenueDto> revenueTrend;
    private List<PopularServiceDto> popularServices;
}
