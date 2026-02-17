package com.bookmysalon.service.analytics;

import com.bookmysalon.dto.analytics.PopularServiceDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    private final JdbcTemplate jdbc;

    public List<PopularServiceDto> getPopularServices(Long salonId, int days, int limit) {
        String sql = "SELECT so.id AS service_id, so.name AS service_name, COUNT(b.id) AS cnt " +
                "FROM service_offering so " +
                "JOIN bookings b ON b.service_offering_id = so.id " +
                "WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) " +
                (salonId != null ? "AND so.salon_id = ? " : "") +
                "GROUP BY so.id, so.name ORDER BY cnt DESC LIMIT ?";

        Object[] params = salonId != null ? new Object[]{days, salonId, limit} : new Object[]{days, limit};

        List<Map<String, Object>> rows = salonId != null ? jdbc.queryForList(sql, params) : jdbc.queryForList(sql, params);

        return rows.stream().map(r -> PopularServiceDto.builder()
                .serviceId(((Number) r.get("service_id")).longValue())
                .serviceName((String) r.get("service_name"))
                .count(((Number) r.get("cnt")).intValue())
                .build()).toList();
    }

    public List<Map<String, Object>> getRevenuePerDay(String start, String end) {
        String sql = "SELECT DATE(created_at) as day, SUM(total_price) as revenue " +
                "FROM bookings WHERE created_at BETWEEN ? AND ? GROUP BY day ORDER BY day";
        return jdbc.queryForList(sql, start, end);
    }

    public List<Map<String, Object>> getPeakHeatmap(Long salonId, int days) {
        String sql = "SELECT DAYOFWEEK(created_at) AS dow, HOUR(created_at) AS hour, COUNT(*) AS cnt " +
                "FROM bookings WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) " +
                "AND salon_id = ? GROUP BY dow, hour";
        return jdbc.queryForList(sql, days, salonId);
    }

    public double getRepeatRate(int days) {
        String sql = "SELECT 100.0 * SUM(CASE WHEN b.cnt > 1 THEN 1 ELSE 0 END)/COUNT(*) AS repeat_rate FROM (" +
                " SELECT user_id, COUNT(*) AS cnt FROM bookings WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY user_id" +
                ") b";
        Map<String, Object> row = jdbc.queryForMap(sql, days);
        return ((Number) row.get("repeat_rate")).doubleValue();
    }
}
