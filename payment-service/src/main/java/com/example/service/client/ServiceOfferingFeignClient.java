package com.example.service.client;

import com.example.payload.dto.ServiceOfferingDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Set;

@FeignClient(name = "service-offering", path = "/api/service-offering")
public interface ServiceOfferingFeignClient {
    @GetMapping("/list/{ids}")
    public ResponseEntity<Set<ServiceOfferingDto>> getServiceOfferingsByIds(
            @PathVariable("ids") Set<Long> ids
    );


}
