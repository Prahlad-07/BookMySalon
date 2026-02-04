package com.example.controller;

import com.example.model.Category;
import com.example.payload.dto.SalonDto;
import com.example.service.CategoryService;
import com.example.service.client.SalonFeignClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories/salon-owner")
@RequiredArgsConstructor
public class SalonCategoryController {
    private final CategoryService categoryService;
    private final SalonFeignClient salonFeignClient;

    @PostMapping
    public ResponseEntity<Category> createCategory(
            @RequestBody Category category,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken) {

        SalonDto salonDto = salonFeignClient.getSalonByOwnerAccessToken(jwtToken).getBody();
        Category createdCategory = categoryService.saveCategory(category, salonDto);
        return new ResponseEntity<>(createdCategory, HttpStatus.OK);
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<String> deleteCategory(
            @PathVariable("categoryId") Long categoryId,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken) {

        SalonDto salonDto = salonFeignClient.getSalonByOwnerAccessToken(jwtToken).getBody();

        categoryService.deleteCategoryById(categoryId, salonDto.getId());
        return new ResponseEntity<>("Category Deleted!", HttpStatus.ACCEPTED);
    }

    @GetMapping("/salon/{salonId}/category/{categoryId}")
    public ResponseEntity<Category> getCategoryByIdAndSalon(
            @PathVariable("salonId") Long salonId,
            @PathVariable("categoryId") Long categoryId
    ) {
        Category category = categoryService.findByIdAndSalonId(categoryId, salonId);
        return new ResponseEntity<>(category, HttpStatus.OK);
    }
}
