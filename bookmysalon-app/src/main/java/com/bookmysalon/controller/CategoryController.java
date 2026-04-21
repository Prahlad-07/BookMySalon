/**
 * @author Prahlad Yadav
 * @version 1.0
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
import org.springframework.http.HttpStatus;
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
        try {
            ensureCanManageSalon(categoryDto.getSalonId());
            CategoryDto createdCategory = categoryService.createCategory(categoryDto);
            return ResponseEntity.ok(ApiResponse.<CategoryDto>builder()
                    .success(true)
                    .message("Category created successfully")
                    .data(createdCategory)
                    .build());
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.<CategoryDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<CategoryDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDto>> getCategory(@PathVariable Long id) {
        try {
            CategoryDto category = categoryService.getCategoryById(id);
            return ResponseEntity.ok(ApiResponse.<CategoryDto>builder()
                    .success(true)
                    .data(category)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<CategoryDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getAllCategories() {
        try {
            List<CategoryDto> categories = categoryService.getAllCategories();
            return ResponseEntity.ok(ApiResponse.<List<CategoryDto>>builder()
                    .success(true)
                    .data(categories)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<CategoryDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getSalonCategories(@PathVariable Long salonId) {
        try {
            List<CategoryDto> categories = categoryService.getCategoriesBySalonId(salonId);
            return ResponseEntity.ok(ApiResponse.<List<CategoryDto>>builder()
                    .success(true)
                    .data(categories)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<CategoryDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(@PathVariable Long id, @RequestBody CategoryDto categoryDto) {
        try {
            CategoryDto existing = categoryService.getCategoryById(id);
            ensureCanManageSalon(existing.getSalonId());
            categoryDto.setSalonId(existing.getSalonId());
            CategoryDto updatedCategory = categoryService.updateCategory(id, categoryDto);
            return ResponseEntity.ok(ApiResponse.<CategoryDto>builder()
                    .success(true)
                    .message("Category updated successfully")
                    .data(updatedCategory)
                    .build());
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.<CategoryDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.<CategoryDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<CategoryDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        try {
            CategoryDto existing = categoryService.getCategoryById(id);
            ensureCanManageSalon(existing.getSalonId());
            categoryService.deleteCategory(id);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Category deleted successfully")
                    .build());
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.<Void>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<Void>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
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
        if (!SecurityUtils.isSalonOwner() || salon.getOwnerId() == null || !salon.getOwnerId().equals(SecurityUtils.currentUserId())) {
            throw new UnauthorizedException("You are not allowed to manage categories for this salon");
        }
    }
}
