package com.bookmysalon.service.impl;

import com.bookmysalon.dto.SalonDto;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.repository.SalonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SalonServiceImplTest {

    @Mock
    private SalonRepository salonRepository;

    private SalonServiceImpl salonService;

    @BeforeEach
    void setUp() {
        salonService = new SalonServiceImpl(salonRepository);
    }

    @Test
    void createSalonReturnsPhoneDuplicateMessageWhenPhoneConstraintFails() {
        SalonDto request = validCreateRequest();

        when(salonRepository.existsByEmailIgnoreCase("salon.one@example.com")).thenReturn(false);
        when(salonRepository.save(any(Salon.class)))
                .thenThrow(new DataIntegrityViolationException("Duplicate entry for key 'salons.phone_number'"));
        when(salonRepository.existsByPhoneNumber("+919999999999")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> salonService.createSalon(request));

        assertEquals("This salon phone number is already in use. Use a different phone number.", exception.getMessage());
    }

    @Test
    void createSalonReturnsOwnerProfileMessageWhenOwnerConstraintFails() {
        SalonDto request = validCreateRequest();

        when(salonRepository.existsByEmailIgnoreCase("salon.one@example.com")).thenReturn(false);
        when(salonRepository.save(any(Salon.class)))
                .thenThrow(new DataIntegrityViolationException("Duplicate entry '5' for key 'salons.owner_id'"));
        when(salonRepository.existsByPhoneNumber("+919999999999")).thenReturn(false);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> salonService.createSalon(request));

        assertEquals(
                "Your account already has a salon profile. Edit the existing profile instead of creating a new one.",
                exception.getMessage()
        );
    }

    @Test
    void createSalonReturnsOwnerProfileMessageWhenGenericDuplicateAndOwnerAlreadyExists() {
        SalonDto request = validCreateRequest();

        when(salonRepository.existsByEmailIgnoreCase("salon.one@example.com")).thenReturn(false);
        when(salonRepository.save(any(Salon.class)))
                .thenThrow(new DataIntegrityViolationException("Unique constraint violation"));
        when(salonRepository.existsByPhoneNumber("+919999999999")).thenReturn(false);
        when(salonRepository.existsByOwnerId(5L)).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> salonService.createSalon(request));

        assertEquals(
                "Your account already has a salon profile. Edit the existing profile instead of creating a new one.",
                exception.getMessage()
        );
    }

    @Test
    void createSalonRejectsPhoneFieldWhenEmailIsEntered() {
        SalonDto request = validCreateRequest();
        request.setPhoneNumber("owner@example.com");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> salonService.createSalon(request));

        assertEquals("Phone number format is invalid. Enter a valid phone number, not an email.", exception.getMessage());
    }

    private SalonDto validCreateRequest() {
        return SalonDto.builder()
                .name("River View")
                .address("River View Colony")
                .city("Bilaspur")
                .phoneNumber("+919999999999")
                .email("salon.one@example.com")
                .ownerId(5L)
                .latitude(22.129178)
                .longitude(82.124986)
                .openTime(LocalTime.of(9, 0))
                .closeTime(LocalTime.of(18, 0))
                .build();
    }
}
