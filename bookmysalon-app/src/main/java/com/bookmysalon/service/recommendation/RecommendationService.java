package com.bookmysalon.service.recommendation;

import com.bookmysalon.dto.recommendation.RecommendationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RecommendationService {
    private final JdbcTemplate jdbc;

    /**
     * Recommend salons for a user using simple scoring: service overlap + rating + proximity placeholder.
     */
    public List<RecommendationDto> recommendSalons(Long userId, Double lat, Double lng, int limit) {
        // 1) get user's top service ids
        String sqlUserServices = "SELECT service_offering_id, COUNT(*) as cnt FROM bookings WHERE user_id = ? AND status='CONFIRMED' GROUP BY service_offering_id ORDER BY cnt DESC LIMIT 10";
        List<Map<String, Object>> userServices = jdbc.queryForList(sqlUserServices, userId);
        List<Long> topServiceIds = new ArrayList<>();
        for (Map<String, Object> r : userServices) topServiceIds.add(((Number) r.get("service_offering_id")).longValue());

        // 2) score salons by how many of these services they offer and their average rating
        String sql = "SELECT s.id AS salon_id, s.name AS salon_name, COALESCE(avg(r.rating),0) AS avg_rating, COUNT(so.id) AS match_count " +
                "FROM salon s " +
                "LEFT JOIN service_offering so ON so.salon_id = s.id " +
                "LEFT JOIN reviews r ON r.salon_id = s.id " +
                "WHERE so.id IN (" + (topServiceIds.isEmpty() ? "0" : topServiceIds.stream().map(Object::toString).reduce((a,b)->a+","+b).orElse("0")) + ") " +
                "GROUP BY s.id, s.name ORDER BY match_count DESC, avg_rating DESC LIMIT ?";

        List<Map<String, Object>> rows = jdbc.queryForList(sql, limit);
        List<RecommendationDto> out = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            RecommendationDto dto = RecommendationDto.builder()
                    .salonId(((Number) r.get("salon_id")).longValue())
                    .salonName((String) r.get("salon_name"))
                    .score(((Number) r.get("match_count")).doubleValue() + ((Number) r.get("avg_rating")).doubleValue() / 5.0)
                    .reason(List.of("Service match", "High rating"))
                    .build();
            out.add(dto);
        }
        return out;
    }
}
