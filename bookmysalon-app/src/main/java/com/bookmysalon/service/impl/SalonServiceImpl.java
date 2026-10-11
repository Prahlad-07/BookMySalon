/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
package com.bookmysalon.service.impl;

import com.bookmysalon.dto.SalonDto;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.exception.SalonNotFoundException;
import com.bookmysalon.repository.ReviewRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.repository.ServiceOfferingRepository;
import com.bookmysalon.service.SalonService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SalonServiceImpl implements SalonService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private final SalonRepository salonRepository;
    private final ReviewRepository reviewRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;

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
        double[] rating = ratingFor(id);
        return mapToDto(salon, null, rating[0], (long) rating[1], serviceOfferingRepository.countBySalonId(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalonDto> getAllSalons() {
        return withStats(salonRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalonDto> getSalonsByOwnerId(Long ownerId) {
        return withStats(salonRepository.findByOwnerId(ownerId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalonDto> getSalonsByCity(String city) {
        return withStats(salonRepository.findByCity(city));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalonDto> getSalonsNearLocation(double latitude, double longitude, double radiusKm) {
        validateCoordinates(latitude, longitude);
        validateRadius(radiusKm);

        List<SalonDistance> nearby = salonRepository.findByLatitudeIsNotNullAndLongitudeIsNotNull().stream()
                .map(salon -> new SalonDistance(salon,
                        haversineDistanceKm(latitude, longitude, salon.getLatitude(), salon.getLongitude())))
                .filter(salonDistance -> salonDistance.distanceKm <= radiusKm)
                .sorted(Comparator.comparingDouble(salonDistance -> salonDistance.distanceKm))
                .toList();

        Map<Long, double[]> ratings = ratingMap();
        Map<Long, Long> serviceCounts = serviceCountMap();
        return nearby.stream()
                .map(sd -> {
                    double[] r = ratings.getOrDefault(sd.salon.getId(), new double[]{0, 0});
                    return mapToDto(sd.salon, roundDistance(sd.distanceKm), r[0], (long) r[1],
                            serviceCounts.getOrDefault(sd.salon.getId(), 0L));
                })
                .collect(Collectors.toList());
    }

    private List<SalonDto> withStats(List<Salon> salons) {
        Map<Long, double[]> ratings = ratingMap();
        Map<Long, Long> serviceCounts = serviceCountMap();
        return salons.stream()
                .map(salon -> {
                    double[] r = ratings.getOrDefault(salon.getId(), new double[]{0, 0});
                    return mapToDto(salon, null, r[0], (long) r[1],
                            serviceCounts.getOrDefault(salon.getId(), 0L));
                })
                .collect(Collectors.toList());
    }

    private Map<Long, double[]> ratingMap() {
        Map<Long, double[]> map = new HashMap<>();
        for (Object[] row : reviewRepository.ratingSummaryBySalon()) {
            map.put(((Number) row[0]).longValue(),
                    new double[]{round1(((Number) row[1]).doubleValue()), ((Number) row[2]).doubleValue()});
        }
        return map;
    }

    private Map<Long, Long> serviceCountMap() {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : serviceOfferingRepository.countGroupBySalon()) {
            map.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return map;
    }

    private double[] ratingFor(Long salonId) {
        double avg = reviewRepository.averageRatingForSalon(salonId);
        long count = reviewRepository.countBySalonId(salonId);
        return new double[]{round1(avg), count};
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
        return mapToDto(salon, null, 0d, 0L, 0L);
    }

    private SalonDto mapToDto(Salon salon, Double distanceKm, double averageRating, long reviewCount, long serviceCount) {
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
                .averageRating(averageRating)
                .reviewCount(reviewCount)
                .serviceCount(serviceCount)
                .build();
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
