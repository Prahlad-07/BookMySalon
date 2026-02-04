package com.example.service.offering.service.controller;

import com.example.service.offering.service.model.ServiceOffering;
import com.example.service.offering.service.service.ServiceOfferingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/service-offering")
@RequiredArgsConstructor
public class ServiceOfferingController {
    private final ServiceOfferingService serviceOfferingService;

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<Set<ServiceOffering>> getServiceOfferingsBySalonId(
            @PathVariable("salonId") Long salonId,
            @RequestParam(required = false) Long categoryId) {

        Set<ServiceOffering> serviceOfferings = serviceOfferingService.getAllServiceOfferingsBySalonId(salonId, categoryId);
        return new ResponseEntity<>(serviceOfferings, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceOffering> getServiceOfferingById(
            @PathVariable("id") Long id) {

        ServiceOffering serviceOffering = serviceOfferingService.getServiceOfferingById(id);
        return new ResponseEntity<>(serviceOffering, HttpStatus.OK);
    }

    @GetMapping("/list/{ids}")
    public ResponseEntity<Set<ServiceOffering>> getServiceOfferingsByIds(
            @PathVariable("ids") Set<Long> ids) {

        Set<ServiceOffering> serviceOfferings = serviceOfferingService.getServiceOfferingsByIds(ids);
        return new ResponseEntity<>(serviceOfferings, HttpStatus.OK);
    }

}
