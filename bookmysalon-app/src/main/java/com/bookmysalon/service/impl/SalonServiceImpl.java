/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
package com.bookmysalon.service.impl;

import com.bookmysalon.dto.SalonDto;
import com.bookmysalon.dto.SalonInsightsDto;
import com.bookmysalon.dto.SalonSearchCriteria;
import com.bookmysalon.dto.response.PageResponse;
import com.bookmysalon.entity.ServiceOffering;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.exception.SalonNotFoundException;
import com.bookmysalon.repository.ReviewRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.repository.ServiceOfferingRepository;
import com.bookmysalon.service.SalonService;
import lombok.RequiredArgsConstructor;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SalonServiceImpl implements SalonService {

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final int MAX_PAGE_SIZE = 48;

    private final SalonRepository salonRepository;
    private final ReviewRepository reviewRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;

    /** Salons keep local opening hours; "open now" is evaluated in this zone. */
    @Value("${app.timezone:Asia/Kolkata}")
    private String timezone = "Asia/Kolkata";

    @Override
    public SalonDto createSalon(SalonDto salonDto) {
        if (salonDto == null) {
            throw new IllegalArgumentException("Salon data cannot be null");
        }
        if (salonDto.getName() == null || salonDto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Salon name is required");
        }
        if (salonDto.getOwnerId() == null || salonDto.getOwnerId() <= 0) {
            throw new IllegalArgumentException("Owner ID is required and must be valid");
        }
        if (salonDto.getPhoneNumber() == null || salonDto.getPhoneNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Phone number is required");
        }
        validatePhoneNumber(salonDto.getPhoneNumber());
        if (salonDto.getEmail() == null || !salonDto.getEmail().contains("@")) {
            throw new IllegalArgumentException("Valid email is required");
        }
        if (salonDto.getCity() == null || salonDto.getCity().trim().isEmpty()) {
            throw new IllegalArgumentException("City is required");
        }
        validateCoordinates(salonDto.getLatitude(), salonDto.getLongitude());
        validateOperatingHours(salonDto.getOpenTime(), salonDto.getCloseTime());

        String normalizedEmail = salonDto.getEmail().trim().toLowerCase();
        String normalizedPhone = salonDto.getPhoneNumber().trim();
        validateSalonEmailAvailability(normalizedEmail, salonDto.getOwnerId(), null);
        String normalizedAddress = salonDto.getAddress() == null ? "" : salonDto.getAddress().trim();

        Salon salon = new Salon();
        salon.setName(salonDto.getName().trim());
        salon.setImages(salonDto.getImages());
        salon.setAddress(normalizedAddress);
        salon.setLatitude(salonDto.getLatitude());
        salon.setLongitude(salonDto.getLongitude());
        salon.setPhoneNumber(normalizedPhone);
        salon.setEmail(normalizedEmail);
        salon.setCity(salonDto.getCity().trim());
        salon.setOwnerId(salonDto.getOwnerId());
        salon.setOpenTime(salonDto.getOpenTime());
        salon.setCloseTime(salonDto.getCloseTime());
        salon.setDescription(trimToLength(salonDto.getDescription(), 1000));
        salon.setRatingAvg(0d);
        salon.setReviewCount(0);
        salon.setServiceCount(0);
        salon.setRankScore(4.0);

        try {
            Salon savedSalon = salonRepository.save(salon);
            return mapToDto(savedSalon);
        } catch (DataIntegrityViolationException ex) {
            throw resolveDataIntegrityViolation(ex, salonDto.getOwnerId(), normalizedEmail, normalizedPhone, null);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public SalonDto getSalonById(Long id) {
        Salon salon = salonRepository.findById(id)
                .orElseThrow(() -> new SalonNotFoundException("Salon not found with id: " + id));
        return mapToDto(salon, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalonDto> getAllSalons() {
        return salonRepository.findAll().stream().map(s -> mapToDto(s, null)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalonDto> getSalonsByOwnerId(Long ownerId) {
        return salonRepository.findByOwnerId(ownerId).stream().map(s -> mapToDto(s, null)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalonDto> getSalonsByCity(String city) {
        return salonRepository.findByCity(city).stream().map(s -> mapToDto(s, null)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalonDto> getSalonsNearLocation(double latitude, double longitude, double radiusKm) {
        validateCoordinates(latitude, longitude);
        validateRadius(radiusKm);

        // Prefilter with an indexed bounding box, then compute exact distances on the survivors.
        double latDelta = Math.toDegrees(radiusKm / EARTH_RADIUS_KM);
        double lngDelta = Math.toDegrees(radiusKm / (EARTH_RADIUS_KM * Math.cos(Math.toRadians(latitude))));
        return salonRepository.findByLatitudeBetweenAndLongitudeBetween(
                        latitude - latDelta, latitude + latDelta, longitude - lngDelta, longitude + lngDelta).stream()
                .map(salon -> new SalonDistance(salon,
                        haversineDistanceKm(latitude, longitude, salon.getLatitude(), salon.getLongitude())))
                .filter(sd -> sd.distanceKm <= radiusKm)
                .sorted(Comparator.comparingDouble(sd -> sd.distanceKm))
                .map(sd -> mapToDto(sd.salon, roundDistance(sd.distanceKm)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SalonDto> searchSalons(SalonSearchCriteria criteria, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        int safePage = Math.max(0, page);
        Page<Salon> result = salonRepository.findAll(
                specFor(criteria), PageRequest.of(safePage, safeSize, sortFor(criteria == null ? null : criteria.sort())));
        return PageResponse.of(result, s -> mapToDto(s, null));
    }

    @Override
    @Transactional(readOnly = true)
    public SalonInsightsDto getInsights() {
        Object[] reviews = reviewRepository.platformStats().stream().findFirst().orElse(new Object[]{0, 0});
        List<SalonInsightsDto.CityCount> cities = salonRepository.countByCity().stream()
                .map(row -> new SalonInsightsDto.CityCount((String) row[0], ((Number) row[1]).longValue()))
                .toList();
        return new SalonInsightsDto(
                salonRepository.count(),
                cities.size(),
                reviews[1] == null ? 0 : ((Number) reviews[1]).longValue(),
                reviews[0] == null ? 0 : round1(((Number) reviews[0]).doubleValue()),
                cities);
    }

    private Specification<Salon> specFor(SalonSearchCriteria c) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (c == null) return cb.and();

            if (c.q() != null && !c.q().isBlank()) {
                String like = "%" + c.q().trim().toLowerCase(Locale.ROOT) + "%";
                Subquery<Long> serviceMatch = query.subquery(Long.class);
                var so = serviceMatch.from(ServiceOffering.class);
                serviceMatch.select(so.get("salonId"))
                        .where(cb.equal(so.get("salonId"), root.get("id")), cb.like(cb.lower(so.get("name")), like));
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("address")), like),
                        cb.like(cb.lower(root.get("city")), like),
                        cb.exists(serviceMatch)));
            }
            if (c.city() != null && !c.city().isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("city")), c.city().trim().toLowerCase(Locale.ROOT)));
            }
            if (c.minRating() != null && c.minRating() > 0) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("ratingAvg"), c.minRating()));
            }
            if (c.maxPrice() != null && c.maxPrice() > 0) {
                predicates.add(cb.lessThanOrEqualTo(root.get("minPrice"), c.maxPrice()));
            }
            if ("price".equalsIgnoreCase(c.sort())) {
                // Price ordering only makes sense for salons that have published a menu.
                predicates.add(cb.isNotNull(root.get("minPrice")));
            }
            if (c.openNow()) {
                LocalTime now = LocalTime.now(zone());
                predicates.add(cb.lessThanOrEqualTo(root.get("openTime"), now));
                predicates.add(cb.greaterThan(root.get("closeTime"), now));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Sort sortFor(String sort) {
        String key = sort == null ? "rating" : sort.toLowerCase(Locale.ROOT);
        return switch (key) {
            case "reviews" -> Sort.by(Sort.Order.desc("reviewCount"), Sort.Order.desc("ratingAvg"), Sort.Order.asc("id"));
            case "price" -> Sort.by(Sort.Order.asc("minPrice"), Sort.Order.desc("rankScore"), Sort.Order.asc("id"));
            case "newest" -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
            case "name" -> Sort.by(Sort.Order.asc("name"), Sort.Order.asc("id"));
            default -> Sort.by(Sort.Order.desc("rankScore"), Sort.Order.desc("reviewCount"), Sort.Order.asc("id"));
        };
    }

    private ZoneId zone() {
        try {
            return ZoneId.of(timezone == null ? "Asia/Kolkata" : timezone);
        } catch (Exception ex) {
            return ZoneId.of("Asia/Kolkata");
        }
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    @Override
    public SalonDto updateSalon(Long id, SalonDto salonDto) {
        Salon salon = salonRepository.findById(id)
                .orElseThrow(() -> new SalonNotFoundException("Salon not found with id: " + id));

        if (salonDto.getName() != null) {
            String normalizedName = salonDto.getName().trim();
            if (normalizedName.isEmpty()) {
                throw new IllegalArgumentException("Salon name is required");
            }
            salon.setName(normalizedName);
        }
        if (salonDto.getImages() != null) salon.setImages(salonDto.getImages());
        if (salonDto.getAddress() != null) salon.setAddress(salonDto.getAddress().trim());
        if (salonDto.getPhoneNumber() != null) {
            String normalizedPhone = salonDto.getPhoneNumber().trim();
            if (normalizedPhone.isEmpty()) {
                throw new IllegalArgumentException("Phone number is required");
            }
            validatePhoneNumber(normalizedPhone);
            salon.setPhoneNumber(normalizedPhone);
        }
        if (salonDto.getEmail() != null) {
            String normalizedEmail = salonDto.getEmail().trim().toLowerCase();
            if (!normalizedEmail.contains("@")) {
                throw new IllegalArgumentException("Valid email is required");
            }
            validateSalonEmailAvailability(normalizedEmail, salon.getOwnerId(), id);
            salon.setEmail(normalizedEmail);
        }
        if (salonDto.getCity() != null) {
            String normalizedCity = salonDto.getCity().trim();
            if (normalizedCity.isEmpty()) {
                throw new IllegalArgumentException("City is required");
            }
            salon.setCity(normalizedCity);
        }
        if (salonDto.getDescription() != null) salon.setDescription(trimToLength(salonDto.getDescription(), 1000));
        if (salonDto.getOpenTime() != null) salon.setOpenTime(salonDto.getOpenTime());
        if (salonDto.getCloseTime() != null) salon.setCloseTime(salonDto.getCloseTime());
        validateOperatingHours(salon.getOpenTime(), salon.getCloseTime());

        Double nextLatitude = salonDto.getLatitude() != null ? salonDto.getLatitude() : salon.getLatitude();
        Double nextLongitude = salonDto.getLongitude() != null ? salonDto.getLongitude() : salon.getLongitude();
        validateCoordinates(nextLatitude, nextLongitude);
        salon.setLatitude(nextLatitude);
        salon.setLongitude(nextLongitude);

        try {
            Salon updatedSalon = salonRepository.save(salon);
            return mapToDto(updatedSalon);
        } catch (DataIntegrityViolationException ex) {
            throw resolveDataIntegrityViolation(ex, salon.getOwnerId(), salon.getEmail(), salon.getPhoneNumber(), id);
        }
    }

    @Override
    public void deleteSalon(Long id) {
        if (!salonRepository.existsById(id)) {
            throw new SalonNotFoundException("Salon not found with id: " + id);
        }
        salonRepository.deleteById(id);
    }

    private SalonDto mapToDto(Salon salon) {
        return mapToDto(salon, null);
    }

    private SalonDto mapToDto(Salon salon, Double distanceKm) {
        List<String> safeImages = salon.getImages() == null
                ? new ArrayList<>()
                : new ArrayList<>(salon.getImages());

        return SalonDto.builder()
                .id(salon.getId())
                .name(salon.getName())
                .images(safeImages)
                .address(salon.getAddress())
                .latitude(salon.getLatitude())
                .longitude(salon.getLongitude())
                .phoneNumber(salon.getPhoneNumber())
                .email(salon.getEmail())
                .city(salon.getCity())
                .ownerId(salon.getOwnerId())
                .openTime(salon.getOpenTime())
                .closeTime(salon.getCloseTime())
                .distanceKm(distanceKm)
                .averageRating(salon.getRatingAvg() == null ? 0d : salon.getRatingAvg())
                .reviewCount(salon.getReviewCount() == null ? 0L : salon.getReviewCount().longValue())
                .serviceCount(salon.getServiceCount() == null ? 0L : salon.getServiceCount().longValue())
                .description(salon.getDescription())
                .minPrice(salon.getMinPrice())
                .createdAt(salon.getCreatedAt())
                .build();
    }

    private static String trimToLength(String value, int max) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.length() > max ? trimmed.substring(0, max) : trimmed;
    }

    private void validateCoordinates(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Latitude and longitude are required");
        }
        if (latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        if (longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
    }

    private void validateRadius(double radiusKm) {
        if (radiusKm <= 0 || radiusKm > 200) {
            throw new IllegalArgumentException("Radius must be between 0 and 200 km");
        }
    }

    private void validateOperatingHours(java.time.LocalTime openTime, java.time.LocalTime closeTime) {
        if (openTime == null || closeTime == null) {
            throw new IllegalArgumentException("Opening and closing times are required");
        }
        if (!closeTime.isAfter(openTime)) {
            throw new IllegalArgumentException("Closing time must be after opening time");
        }
    }

    private void validateSalonEmailAvailability(String normalizedEmail, Long ownerId, Long currentSalonId) {
        if (currentSalonId == null) {
            if (!salonRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                return;
            }
        } else if (!salonRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, currentSalonId)) {
            return;
        }

        Salon existingSalon = salonRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        if (existingSalon != null && ownerId != null && ownerId.equals(existingSalon.getOwnerId())) {
            throw new IllegalArgumentException("You already have a salon with this email. Please edit the existing salon.");
        }
        throw new IllegalArgumentException("This salon email is already in use. Use a different email.");
    }

    private IllegalArgumentException resolveDataIntegrityViolation(
            DataIntegrityViolationException ex,
            Long ownerId,
            String normalizedEmail,
            String normalizedPhone,
            Long currentSalonId
    ) {
        String rootMessage = rootCauseMessage(ex).toLowerCase();
        boolean duplicateLike = rootMessage.contains("duplicate")
                || rootMessage.contains("unique")
                || rootMessage.contains("constraint");

        if (duplicateLike && isEmailAlreadyUsed(normalizedEmail, currentSalonId)) {
            return new IllegalArgumentException("This salon email is already in use. Use a different email.");
        }

        if (duplicateLike && isPhoneAlreadyUsed(normalizedPhone, currentSalonId)) {
            return new IllegalArgumentException("This salon phone number is already in use. Use a different phone number.");
        }

        if (duplicateLike && (rootMessage.contains("owner_id") || rootMessage.contains("owner")) && ownerId != null) {
            return new IllegalArgumentException("Your account already has a salon profile. Edit the existing profile instead of creating a new one.");
        }

        if (duplicateLike && ownerId != null && salonRepository.existsByOwnerId(ownerId)) {
            return new IllegalArgumentException("Your account already has a salon profile. Edit the existing profile instead of creating a new one.");
        }

        if (duplicateLike && rootMessage.contains("email")) {
            return new IllegalArgumentException("This salon email is already in use. Use a different email.");
        }
        if (duplicateLike && rootMessage.contains("phone")) {
            return new IllegalArgumentException("This salon phone number is already in use. Use a different phone number.");
        }

        return new IllegalArgumentException("Unable to save salon right now. Please verify details and try again.");
    }

    private boolean isEmailAlreadyUsed(String normalizedEmail, Long currentSalonId) {
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            return false;
        }
        if (currentSalonId == null) {
            return salonRepository.existsByEmailIgnoreCase(normalizedEmail);
        }
        return salonRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, currentSalonId);
    }

    private boolean isPhoneAlreadyUsed(String normalizedPhone, Long currentSalonId) {
        if (normalizedPhone == null || normalizedPhone.isBlank()) {
            return false;
        }
        if (currentSalonId == null) {
            return salonRepository.existsByPhoneNumber(normalizedPhone);
        }
        return salonRepository.existsByPhoneNumberAndIdNot(normalizedPhone, currentSalonId);
    }

    private String rootCauseMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        return current.getMessage() == null ? "" : current.getMessage();
    }

    private void validatePhoneNumber(String rawPhoneNumber) {
        String phoneNumber = rawPhoneNumber == null ? "" : rawPhoneNumber.trim();
        if (phoneNumber.isEmpty()) {
            throw new IllegalArgumentException("Phone number is required");
        }

        if (phoneNumber.contains("@")) {
            throw new IllegalArgumentException("Phone number format is invalid. Enter a valid phone number, not an email.");
        }

        String digitsOnly = phoneNumber.replaceAll("\\D", "");
        if (digitsOnly.length() < 7 || digitsOnly.length() > 15) {
            throw new IllegalArgumentException("Phone number format is invalid. Enter a valid phone number with 7 to 15 digits.");
        }
    }

    private double haversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    private double roundDistance(double distanceKm) {
        return Math.round(distanceKm * 100.0) / 100.0;
    }

    private static class SalonDistance {
        private final Salon salon;
        private final double distanceKm;

        private SalonDistance(Salon salon, double distanceKm) {
            this.salon = salon;
            this.distanceKm = distanceKm;
        }
    }
}
