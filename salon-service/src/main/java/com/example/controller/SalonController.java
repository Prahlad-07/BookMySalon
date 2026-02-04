package com.example.controller;

import com.example.mapper.SalonMapper;
import com.example.model.Salon;
import com.example.payload.dto.SalonDto;
import com.example.payload.dto.UserDto;
import com.example.service.SalonService;
import com.example.service.client.UserFeignClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/salons")
@RequiredArgsConstructor
public class SalonController {
    private final SalonService salonService;
    private final UserFeignClient userFeignClient;

    @PostMapping
    public ResponseEntity<SalonDto> createSalon(
            @RequestBody SalonDto salonDto,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken) {

        UserDto userDto = userFeignClient.getUserProfile(jwtToken).getBody();
        Salon salon = salonService.createSalon(salonDto, userDto);
        SalonDto createdSalonDto = SalonMapper.mapToSalonDto(salon);

        return new ResponseEntity<>(createdSalonDto, HttpStatus.OK);
    }

    @PatchMapping("/{salonId}")
    public ResponseEntity<SalonDto> updateSalon(
            @RequestBody SalonDto salonDto,
            @PathVariable("salonId") Long salonId,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken) {

        UserDto userDto = userFeignClient.getUserProfile(jwtToken).getBody();
        Salon salon = salonService.updateSalon(salonDto, userDto, salonId);
        SalonDto updatedSalonDto = SalonMapper.mapToSalonDto(salon);

        return new ResponseEntity<>(updatedSalonDto, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<SalonDto>> getAllSalons() {
        List<SalonDto> salonDtoList = salonService.getAllSalons()
                .stream()
                .map(SalonMapper::mapToSalonDto)
                .toList();
        return new ResponseEntity<>(salonDtoList, HttpStatus.OK);
    }

    @GetMapping("/{salonId}")
    public ResponseEntity<SalonDto> getSalonById(@PathVariable("salonId") Long salonId) {
        Salon salon = salonService.getSalonById(salonId);
        SalonDto salonDto = SalonMapper.mapToSalonDto(salon);
        return new ResponseEntity<>(salonDto, HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<List<SalonDto>> searchSalons(@RequestParam("city") String city) {
        List<SalonDto> salonDtoList = salonService.searchSalonByCityName(city)
                .stream()
                .map(SalonMapper::mapToSalonDto)
                .toList();
        return new ResponseEntity<>(salonDtoList, HttpStatus.OK);
    }

    @GetMapping("/owner")
    public ResponseEntity<SalonDto> getSalonByOwnerAccessToken(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken
    ) {
        UserDto userDto = userFeignClient.getUserProfile(jwtToken).getBody();
        if (userDto == null) {
            throw new RuntimeException("User not found with the given access token!");
        }
        Salon salon = salonService.getSalonByOwnerId(userDto.getId());
        SalonDto salonDto = SalonMapper.mapToSalonDto(salon);
        return new ResponseEntity<>(salonDto, HttpStatus.OK);
    }
}
