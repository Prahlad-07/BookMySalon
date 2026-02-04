package com.example.service.client;

import com.example.payload.dto.CategoryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "category-service", path = "/api/categories")
public interface CategoryFeignClient {
    @GetMapping("/salon/{salonId}/category/{categoryId}")
    public ResponseEntity<CategoryDto> getCategoryByIdAndSalon(
            @PathVariable("salonId") Long salonId,
            @PathVariable("categoryId") Long categoryId
    );
}
