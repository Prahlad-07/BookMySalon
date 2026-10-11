/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-08-31
 *
 * <p>Content-based salon recommendations: score salons by how many of the
 * services a customer has booked before they also offer, blended with the
 * salon's average rating. Falls back to top-rated salons for new customers.</p>
 */
package com.bookmysalon.service.recommendation;

import com.bookmysalon.dto.recommendation.RecommendationDto;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.entity.ServiceOffering;
import com.bookmysalon.repository.BookingRepository;
import com.bookmysalon.repository.ReviewRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.repository.ServiceOfferingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationService {

    private final BookingRepository bookingRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final SalonRepository salonRepository;
    private final ReviewRepository reviewRepository;

    public List<RecommendationDto> recommendSalons(Long userId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));

        List<Long> bookedServiceIds = bookingRepository.distinctServiceOfferingIdsForCustomer(userId);
        Set<String> bookedServiceNames = serviceOfferingRepository.findAllById(bookedServiceIds).stream()
                .map(ServiceOffering::getName)
                .filter(name -> name != null && !name.isBlank())
                .map(name -> name.toLowerCase().trim())
                .collect(Collectors.toSet());

        Map<Long, Double> ratingBySalon = new HashMap<>();
        for (Object[] row : reviewRepository.ratingSummaryBySalon()) {
            ratingBySalon.put(((Number) row[0]).longValue(), ((Number) row[1]).doubleValue());
        }

        Map<Long, List<ServiceOffering>> offeringsBySalon = serviceOfferingRepository.findAll().stream()
                .filter(o -> o.getSalonId() != null)
                .collect(Collectors.groupingBy(ServiceOffering::getSalonId));

        List<RecommendationDto> scored = new ArrayList<>();
        for (Salon salon : salonRepository.findAll()) {
            double rating = ratingBySalon.getOrDefault(salon.getId(), 0d);
            List<ServiceOffering> offerings = offeringsBySalon.getOrDefault(salon.getId(), List.of());
            if (offerings.isEmpty()) {
                continue;
            }

            long matchCount = offerings.stream()
                    .map(o -> o.getName() == null ? "" : o.getName().toLowerCase().trim())
                    .filter(bookedServiceNames::contains)
                    .distinct()
                    .count();

            double score = matchCount * 2.0 + rating / 5.0 + Math.min(offerings.size(), 10) * 0.05;

            List<String> reasons = new ArrayList<>();
            if (matchCount > 0) {
                reasons.add("Offers " + matchCount + " service" + (matchCount == 1 ? "" : "s")
                        + " you have booked before");
            }
            if (rating >= 4.0) {
                reasons.add("Highly rated (" + String.format("%.1f", rating) + ")");
            }
            if (reasons.isEmpty()) {
                reasons.add(offerings.size() + " services available");
            }

            scored.add(RecommendationDto.builder()
                    .salonId(salon.getId())
                    .salonName(salon.getName())
                    .score(Math.round(score * 100.0) / 100.0)
                    .reason(reasons)
                    .build());
        }

        return scored.stream()
                .sorted(Comparator.comparingDouble(RecommendationDto::getScore).reversed())
                .limit(safeLimit)
                .toList();
    }
}
