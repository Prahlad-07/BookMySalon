package com.example.mapper;

import com.example.model.Salon;
import com.example.payload.dto.SalonDto;

public class SalonMapper {
    public static SalonDto mapToSalonDto(Salon salon) {
        SalonDto salonDto = new SalonDto();

        salonDto.setId(salon.getId());
        salonDto.setEmail(salon.getEmail());
        salonDto.setCity(salon.getCity());
        salonDto.setImages(salon.getImages());
        salonDto.setOpenTime(salon.getOpenTime());
        salonDto.setCloseTime(salon.getCloseTime());
        salonDto.setOwnerId(salon.getOwnerId());
        salonDto.setPhoneNumber(salon.getPhoneNumber());
        salonDto.setAddress(salon.getAddress());
        return salonDto;
    }

}
