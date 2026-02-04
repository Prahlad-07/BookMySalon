package com.example.service.impl;

import com.example.exception.SalonNotFoundException;
import com.example.exception.UnauthorizedActionException;
import com.example.model.Salon;
import com.example.payload.dto.SalonDto;
import com.example.payload.dto.UserDto;
import com.example.repository.SalonRepository;
import com.example.service.SalonService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SalonServiceImpl implements SalonService {
    private final SalonRepository salonRepository;

    @Override
    public Salon createSalon(SalonDto salonDto, UserDto userDto) {
        Salon createdSalon = new Salon();
        createdSalon.setName(salonDto.getName());
        createdSalon.setAddress(salonDto.getAddress());
        createdSalon.setEmail(salonDto.getEmail());
        createdSalon.setCity(salonDto.getCity());
        createdSalon.setImages(salonDto.getImages());
        createdSalon.setOwnerId(userDto.getId());
        createdSalon.setOpenTime(salonDto.getOpenTime());
        createdSalon.setCloseTime(salonDto.getCloseTime());
        createdSalon.setPhoneNumber(salonDto.getPhoneNumber());
        return salonRepository.save(createdSalon);
    }

    @Override
    public Salon updateSalon(SalonDto salonDto, UserDto userDto, Long salonId) {
        Salon existingSalon = salonRepository.findById(salonId).orElseThrow(
                () -> new SalonNotFoundException("Salon does not exists!")
        );
        if (salonDto.getOwnerId().equals(existingSalon.getOwnerId())) {
            existingSalon.setName(salonDto.getName());
            existingSalon.setCity(salonDto.getCity());
            existingSalon.setAddress(salonDto.getAddress());
            existingSalon.setEmail(salonDto.getEmail());
            existingSalon.setImages(salonDto.getImages());
            existingSalon.setOpenTime(salonDto.getOpenTime());
            existingSalon.setCloseTime(salonDto.getCloseTime());
            existingSalon.setPhoneNumber(salonDto.getPhoneNumber());
            existingSalon.setOwnerId(salonDto.getOwnerId());
            return salonRepository.save(existingSalon);
        }
        throw new UnauthorizedActionException("user is not authorized to make this change!");
    }

    @Override
    public List<Salon> getAllSalons() {
        return salonRepository.findAll();
    }

    @Override
    public Salon getSalonById(Long salonId) {
        return salonRepository.findById(salonId).orElseThrow(
                () -> new SalonNotFoundException("Salon does not exists!")
        );
    }

    @Override
    public Salon getSalonByOwnerId(Long ownerId) {
        return salonRepository.findByOwnerId(ownerId);
    }

    @Override
    public List<Salon> searchSalonByCityName(String city) {
        return salonRepository.searchSalons(city);
    }
}
