/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.CategoryDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.exception.UnauthorizedException;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.security.SecurityUtils;
import com.bookmysalon.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final SalonRepository salonRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(@RequestBody CategoryDto categoryDto) {
        ensureCanManageSalon(categoryDto.getSalonId());
        CategoryDto createdCategory = categoryService.createCategory(categoryDto);
        return ResponseEntity.ok(ApiResponse.ok(createdCategory, "Category created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDto>> getCategory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getCategoryById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getAllCategories()));
    }

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getSalonCategories(@PathVariable Long salonId) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getCategoriesBySalonId(salonId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(@PathVariable Long id, @RequestBody CategoryDto categoryDto) {
        CategoryDto existing = categoryService.getCategoryById(id);
        ensureCanManageSalon(existing.getSalonId());
        categoryDto.setSalonId(existing.getSalonId());
        CategoryDto updatedCategory = categoryService.updateCategory(id, categoryDto);
        return ResponseEntity.ok(ApiResponse.ok(updatedCategory, "Category updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        CategoryDto existing = categoryService.getCategoryById(id);
        ensureCanManageSalon(existing.getSalonId());
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.message("Category deleted successfully"));
    }

    private void ensureCanManageSalon(Long salonId) {
        if (salonId == null || salonId <= 0) {
            throw new IllegalArgumentException("Salon ID is required and must be valid");
        }
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new IllegalArgumentException("Salon not found with id: " + salonId));

        if (SecurityUtils.isAdmin()) {
            return;
        }
        if (!SecurityUtils.isSalonOwner() || salon.getOwnerId() == null
                || !salon.getOwnerId().equals(SecurityUtils.currentUserId())) {
            throw new UnauthorizedException("You are not allowed to manage categories for this salon");
        }
    }
}
