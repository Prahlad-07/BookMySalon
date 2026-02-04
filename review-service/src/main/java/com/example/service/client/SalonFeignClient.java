package com.example.service.client;

import com.example.payload.dto.SalonDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "salon-service", path = "/api/salons")
public interface SalonFeignClient {
    @GetMapping("/owner")
    public ResponseEntity<SalonDto> getSalonByOwnerAccessToken(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken
    );

    @GetMapping("/{salonId}")
    public ResponseEntity<SalonDto> getSalonById(
            @PathVariable("salonId") Long salonId
    );
}
