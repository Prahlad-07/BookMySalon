package com.example.service.offering.service.service.client;

import com.example.service.offering.service.payload.dto.CategoryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "category-service", path = "/api/categories")
public interface CategoryFeignClient {
    @GetMapping("salon-owner/salon/{salonId}/category/{categoryId}")
    public ResponseEntity<CategoryDto> getCategoryByIdAndSalon(
            @PathVariable("salonId") Long salonId,
            @PathVariable("categoryId") Long categoryId
    );
}
