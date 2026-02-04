package com.example.service;

import com.example.model.Salon;
import com.example.payload.dto.SalonDto;
import com.example.payload.dto.UserDto;

import java.util.List;

public interface SalonService {
    Salon createSalon(SalonDto salonDto, UserDto userDto);

    Salon updateSalon(SalonDto salonDto, UserDto userDto, Long salonId);

    List<Salon> getAllSalons();

    Salon getSalonById(Long salonId);

    Salon getSalonByOwnerId(Long ownerId);

    List<Salon> searchSalonByCityName(String city);
}
