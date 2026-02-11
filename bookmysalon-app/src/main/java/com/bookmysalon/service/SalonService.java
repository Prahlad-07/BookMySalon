package com.bookmysalon.service;

import com.bookmysalon.dto.SalonDto;
import java.util.List;

public interface SalonService {
    SalonDto createSalon(SalonDto salonDto);
    SalonDto getSalonById(Long id);
    List<SalonDto> getAllSalons();
    List<SalonDto> getSalonsByOwnerId(Long ownerId);
    List<SalonDto> getSalonsByCity(String city);
    SalonDto updateSalon(Long id, SalonDto salonDto);
    void deleteSalon(Long id);
}
