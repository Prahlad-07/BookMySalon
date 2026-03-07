/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
package com.bookmysalon.service.impl;

import com.bookmysalon.dto.SalonDto;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.exception.SalonNotFoundException;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.service.SalonService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SalonServiceImpl implements SalonService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private final SalonRepository salonRepository;

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
        if (salonDto.getEmail() == null || !salonDto.getEmail().contains("@")) {
            throw new IllegalArgumentException("Valid email is required");
        }
        if (salonDto.getCity() == null || salonDto.getCity().trim().isEmpty()) {
            throw new IllegalArgumentException("City is required");
        }
        validateCoordinates(salonDto.getLatitude(), salonDto.getLongitude());

        String normalizedEmail = salonDto.getEmail().trim().toLowerCase();
        validateSalonEmailAvailability(normalizedEmail, salonDto.getOwnerId(), null);
        String normalizedAddress = salonDto.getAddress() == null ? "" : salonDto.getAddress().trim();

        Salon salon = new Salon();
        salon.setName(salonDto.getName().trim());
        salon.setImages(salonDto.getImages());
        salon.setAddress(normalizedAddress);
        salon.setLatitude(salonDto.getLatitude());
        salon.setLongitude(salonDto.getLongitude());
        salon.setPhoneNumber(salonDto.getPhoneNumber().trim());
        salon.setEmail(normalizedEmail);
        salon.setCity(salonDto.getCity().trim());
        salon.setOwnerId(salonDto.getOwnerId());
        salon.setOpenTime(salonDto.getOpenTime());
        salon.setCloseTime(salonDto.getCloseTime());

        try {
            Salon savedSalon = salonRepository.save(salon);
            return mapToDto(savedSalon);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("This salon email is already in use. Use a different email.");
        }
    }

    @Override
    public SalonDto getSalonById(Long id) {
        Salon salon = salonRepository.findById(id)
                .orElseThrow(() -> new SalonNotFoundException("Salon not found with id: " + id));
        return mapToDto(salon);
    }

    @Override
    public List<SalonDto> getAllSalons() {
        return salonRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<SalonDto> getSalonsByOwnerId(Long ownerId) {
        return salonRepository.findByOwnerId(ownerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<SalonDto> getSalonsByCity(String city) {
        return salonRepository.findByCity(city).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<SalonDto> getSalonsNearLocation(double latitude, double longitude, double radiusKm) {
        validateCoordinates(latitude, longitude);
        validateRadius(radiusKm);

        return salonRepository.findByLatitudeIsNotNullAndLongitudeIsNotNull().stream()
                .map(salon -> new SalonDistance(salon, haversineDistanceKm(latitude, longitude, salon.getLatitude(), salon.getLongitude())))
                .filter(salonDistance -> salonDistance.distanceKm <= radiusKm)
                .sorted(Comparator.comparingDouble(salonDistance -> salonDistance.distanceKm))
                .map(salonDistance -> mapToDto(salonDistance.salon, roundDistance(salonDistance.distanceKm)))
                .collect(Collectors.toList());
    }

    @Override
    public SalonDto updateSalon(Long id, SalonDto salonDto) {
        Salon salon = salonRepository.findById(id)
                .orElseThrow(() -> new SalonNotFoundException("Salon not found with id: " + id));

        if (salonDto.getName() != null) salon.setName(salonDto.getName().trim());
        if (salonDto.getImages() != null) salon.setImages(salonDto.getImages());
        if (salonDto.getAddress() != null) salon.setAddress(salonDto.getAddress().trim());
        if (salonDto.getPhoneNumber() != null) salon.setPhoneNumber(salonDto.getPhoneNumber().trim());
        if (salonDto.getEmail() != null) {
            String normalizedEmail = salonDto.getEmail().trim().toLowerCase();
            if (!normalizedEmail.contains("@")) {
                throw new IllegalArgumentException("Valid email is required");
            }
            validateSalonEmailAvailability(normalizedEmail, salon.getOwnerId(), id);
            salon.setEmail(normalizedEmail);
        }
        if (salonDto.getCity() != null) salon.setCity(salonDto.getCity().trim());
        if (salonDto.getOpenTime() != null) salon.setOpenTime(salonDto.getOpenTime());
        if (salonDto.getCloseTime() != null) salon.setCloseTime(salonDto.getCloseTime());

        Double nextLatitude = salonDto.getLatitude() != null ? salonDto.getLatitude() : salon.getLatitude();
        Double nextLongitude = salonDto.getLongitude() != null ? salonDto.getLongitude() : salon.getLongitude();
        validateCoordinates(nextLatitude, nextLongitude);
        salon.setLatitude(nextLatitude);
        salon.setLongitude(nextLongitude);

        try {
            Salon updatedSalon = salonRepository.save(salon);
            return mapToDto(updatedSalon);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("This salon email is already in use. Use a different email.");
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
