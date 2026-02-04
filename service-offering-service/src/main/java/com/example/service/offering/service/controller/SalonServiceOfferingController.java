package com.example.service.offering.service.controller;

import com.example.service.offering.service.model.ServiceOffering;
import com.example.service.offering.service.payload.dto.CategoryDto;
import com.example.service.offering.service.payload.dto.SalonDto;
import com.example.service.offering.service.service.ServiceOfferingService;
import com.example.service.offering.service.service.client.CategoryFeignClient;
import com.example.service.offering.service.service.client.SalonFeignClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/service-offering/salon-owner")
@RequiredArgsConstructor
public class SalonServiceOfferingController {
    private final ServiceOfferingService serviceOfferingService;
    private final SalonFeignClient salonFeignClient;
    private final CategoryFeignClient categoryFeignClient;

    @PostMapping
    public ResponseEntity<ServiceOffering> createServiceOffering(
            @RequestBody ServiceOffering serviceOffering,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken) {

        SalonDto salonDto = salonFeignClient.getSalonByOwnerAccessToken(jwtToken).getBody();
        CategoryDto categoryDto = categoryFeignClient.getCategoryByIdAndSalon(
                salonDto.getId(),
                serviceOffering.getCategoryId()).getBody();

        ServiceOffering createdServiceOffering = serviceOfferingService.createServiceOffering(salonDto, serviceOffering, categoryDto);
        return new ResponseEntity<>(createdServiceOffering, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceOffering> updateServiceOffering(
            @PathVariable("id") Long id,
            @RequestBody ServiceOffering serviceOffering) {

        ServiceOffering updatedServiceOffering = serviceOfferingService.updateServiceOffering(id, serviceOffering);
        return new ResponseEntity<>(updatedServiceOffering, HttpStatus.OK);
    }
}
