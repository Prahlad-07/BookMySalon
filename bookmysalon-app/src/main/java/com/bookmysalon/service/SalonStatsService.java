package com.bookmysalon.service;

import com.bookmysalon.entity.Salon;
import com.bookmysalon.repository.ReviewRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.repository.ServiceOfferingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Keeps the denormalised listing columns on {@link Salon} (rating, review count,
 * starting price, service count) in step with reviews and services.
 *
 * Writes call {@link #refresh(Long)} for the one salon they touched, so reads stay a
 * single indexed query no matter how many reviews exist.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SalonStatsService {

    private final SalonRepository salonRepository;
    private final ReviewRepository reviewRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;

    /*
     * "Top rated" uses a Bayesian average so a 5.0 from two reviews doesn't outrank a 4.8
     * from two hundred: each salon starts with PRIOR_WEIGHT imaginary reviews at PRIOR_MEAN.
     */
    private static final double PRIOR_MEAN = 4.0;
    private static final double PRIOR_WEIGHT = 5.0;

    /** "From ₹X" should reflect a real service, not a ₹40 threading add-on. */
    private static final double MAIN_SERVICE_FLOOR = 99.0;

    @Transactional
    public void refresh(Long salonId) {
        if (salonId == null) return;
        salonRepository.findById(salonId).ifPresent(this::apply);
    }

    /** Backfills salons created before the stats columns existed (and any left null). */
    @EventListener(ApplicationReadyEvent.class)
    @Order(100)
    @Transactional
    public void backfillMissing() {
        List<Salon> stale = salonRepository.findAll().stream()
                .filter(s -> s.getRatingAvg() == null || s.getServiceCount() == null || s.getRankScore() == null)
                .toList();
        stale.forEach(this::apply);
        if (!stale.isEmpty()) {
            log.info("Backfilled listing stats for {} salon(s)", stale.size());
        }
    }

    @Transactional
    public void refreshAll() {
        salonRepository.findAll().forEach(this::apply);
    }

    private void apply(Salon salon) {
        Object[] reviews = first(reviewRepository.statsForSalon(salon.getId()));
        Object[] services = first(serviceOfferingRepository.statsForSalon(salon.getId()));

        double avg = reviews[0] == null ? 0 : ((Number) reviews[0]).doubleValue();
        salon.setRatingAvg(Math.round(avg * 10.0) / 10.0);
        int count = reviews[1] == null ? 0 : ((Number) reviews[1]).intValue();
        salon.setReviewCount(count);
        double score = (PRIOR_WEIGHT * PRIOR_MEAN + avg * count) / (PRIOR_WEIGHT + count);
        salon.setRankScore(Math.round(score * 1000.0) / 1000.0);
        Double mainFrom = serviceOfferingRepository.minPriceAtLeast(salon.getId(), MAIN_SERVICE_FLOOR);
        Double cheapest = services[0] == null ? null : ((Number) services[0]).doubleValue();
        salon.setMinPrice(mainFrom != null ? mainFrom : cheapest);
        salon.setServiceCount(services[1] == null ? 0 : ((Number) services[1]).intValue());
        salonRepository.save(salon);
    }

    private static Object[] first(List<Object[]> rows) {
        return rows == null || rows.isEmpty() ? new Object[]{null, null} : rows.get(0);
    }
}
