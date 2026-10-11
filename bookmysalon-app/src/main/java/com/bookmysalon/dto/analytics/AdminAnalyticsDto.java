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
public class AdminAnalyticsDto {
    private long totalSalons;
    private long totalCustomers;
    private long totalBookings;
    private double totalRevenue;
    private double completedRevenue;
    private double repeatCustomerRate;
    private Map<String, Long> bookingsByStatus;
    private List<DailyRevenueDto> revenueTrend;
    private List<TopSalonDto> topSalons;
    private List<PopularServiceDto> popularServices;
}
