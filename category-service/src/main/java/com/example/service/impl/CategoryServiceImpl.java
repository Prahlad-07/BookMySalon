package com.example.service.impl;

import com.example.exception.CategoryNotFoundException;
import com.example.payload.dto.SalonDto;
import com.example.model.Category;
import com.example.repository.CategoryRepository;
import com.example.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;

    @Override
    public Category saveCategory(Category category, SalonDto salonDto) {
        Category createdCategory = new Category();
        createdCategory.setName(category.getName());
        createdCategory.setImage(category.getImage());
        createdCategory.setSalonId(salonDto.getId());
        return categoryRepository.save(createdCategory);
    }

    @Override
    public Set<Category> getAllCategoriesBySalon(Long salonId) {
        return categoryRepository.findBySalonId(salonId);
    }

    @Override
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id).orElseThrow(
                () -> new CategoryNotFoundException("Category does not exists!")
        );
    }

    @Override
    public void deleteCategoryById(Long categoryId, Long salonId) {
        Category category = getCategoryById(categoryId);
        if (!category.getSalonId().equals(salonId)) {
            throw new RuntimeException("You don't have permission to delete this category!");
        }
        categoryRepository.deleteById(categoryId);
    }

    @Override
    public Category findByIdAndSalonId(Long id, Long salonId) {
        return categoryRepository.findByIdAndSalonId(id, salonId).orElseThrow(
                () -> new RuntimeException("Category was not found!")
        );
    }
}
