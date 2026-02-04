package com.example.service;

import com.example.payload.dto.SalonDto;
import com.example.model.Category;

import java.util.Set;

public interface CategoryService {
    Category saveCategory(Category category, SalonDto salonDto);

    Set<Category> getAllCategoriesBySalon(Long salonId);

    Category getCategoryById(Long id);

    void deleteCategoryById(Long categoryId, Long salonId);

    Category findByIdAndSalonId(Long id, Long salonId);
}
