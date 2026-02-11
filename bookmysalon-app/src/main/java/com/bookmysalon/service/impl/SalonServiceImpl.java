package com.bookmysalon.service.impl;

import com.bookmysalon.dto.SalonDto;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.exception.SalonNotFoundException;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.service.SalonService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SalonServiceImpl implements SalonService {

    private final SalonRepository salonRepository;

    @Override
    public SalonDto createSalon(SalonDto salonDto) {
        // Validate input
        if (salonDto == null) {
            throw new IllegalArgumentException("Salon data cannot be null");
        }
        if (salonDto.getName() == null || salonDto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Salon name is required");
        }
        if (salonDto.getOwnerId() == null || salonDto.getOwnerId() <= 0) {
            throw new IllegalArgumentException("Owner ID is required and must be valid");
        }
        if (salonDto.getAddress() == null || salonDto.getAddress().trim().isEmpty()) {
            throw new IllegalArgumentException("Address is required");
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

        Salon salon = new Salon();
        salon.setName(salonDto.getName().trim());
        salon.setImages(salonDto.getImages());
        salon.setAddress(salonDto.getAddress().trim());
        salon.setPhoneNumber(salonDto.getPhoneNumber().trim());
        salon.setEmail(salonDto.getEmail().trim());
        salon.setCity(salonDto.getCity().trim());
        salon.setOwnerId(salonDto.getOwnerId());
        salon.setOpenTime(salonDto.getOpenTime());
        salon.setCloseTime(salonDto.getCloseTime());

        Salon savedSalon = salonRepository.save(salon);
        return mapToDto(savedSalon);
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
    public SalonDto updateSalon(Long id, SalonDto salonDto) {
        Salon salon = salonRepository.findById(id)
                .orElseThrow(() -> new SalonNotFoundException("Salon not found with id: " + id));

        if (salonDto.getName() != null) salon.setName(salonDto.getName());
        if (salonDto.getImages() != null) salon.setImages(salonDto.getImages());
        if (salonDto.getAddress() != null) salon.setAddress(salonDto.getAddress());
        if (salonDto.getPhoneNumber() != null) salon.setPhoneNumber(salonDto.getPhoneNumber());
        if (salonDto.getEmail() != null) salon.setEmail(salonDto.getEmail());
        if (salonDto.getCity() != null) salon.setCity(salonDto.getCity());
        if (salonDto.getOpenTime() != null) salon.setOpenTime(salonDto.getOpenTime());
        if (salonDto.getCloseTime() != null) salon.setCloseTime(salonDto.getCloseTime());

        Salon updatedSalon = salonRepository.save(salon);
        return mapToDto(updatedSalon);
    }

    @Override
    public void deleteSalon(Long id) {
        if (!salonRepository.existsById(id)) {
            throw new SalonNotFoundException("Salon not found with id: " + id);
        }
        salonRepository.deleteById(id);
    }

    private SalonDto mapToDto(Salon salon) {
        return SalonDto.builder()
                .id(salon.getId())
                .name(salon.getName())
                .images(salon.getImages())
                .address(salon.getAddress())
                .phoneNumber(salon.getPhoneNumber())
                .email(salon.getEmail())
                .city(salon.getCity())
                .ownerId(salon.getOwnerId())
                .openTime(salon.getOpenTime())
                .closeTime(salon.getCloseTime())
                .build();
    }
}
