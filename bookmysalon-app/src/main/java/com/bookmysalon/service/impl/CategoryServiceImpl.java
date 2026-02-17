/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.service.impl;

import com.bookmysalon.dto.CategoryDto;
import com.bookmysalon.entity.Category;
import com.bookmysalon.exception.CategoryNotFoundException;
import com.bookmysalon.repository.CategoryRepository;
import com.bookmysalon.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public CategoryDto createCategory(CategoryDto categoryDto) {
        if (categoryDto == null) {
            throw new IllegalArgumentException("Category data cannot be null");
        }
        if (categoryDto.getName() == null || categoryDto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Category name is required");
        }
        if (categoryDto.getSalonId() == null || categoryDto.getSalonId() <= 0) {
            throw new IllegalArgumentException("Salon ID is required and must be valid");
        }

        Category category = new Category();
        category.setName(categoryDto.getName().trim());
        category.setImage(categoryDto.getImage());
        category.setSalonId(categoryDto.getSalonId());

        Category savedCategory = categoryRepository.save(category);
        return mapToDto(savedCategory);
    }

    @Override
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));
        return mapToDto(category);
    }

    @Override
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryDto> getCategoriesBySalonId(Long salonId) {
        return categoryRepository.findBySalonId(salonId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryDto updateCategory(Long id, CategoryDto categoryDto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));

        if (categoryDto.getName() != null) category.setName(categoryDto.getName());
        if (categoryDto.getImage() != null) category.setImage(categoryDto.getImage());

        Category updatedCategory = categoryRepository.save(category);
        return mapToDto(updatedCategory);
    }

    @Override
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new CategoryNotFoundException("Category not found with id: " + id);
        }
        categoryRepository.deleteById(id);
    }

    private CategoryDto mapToDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .image(category.getImage())
                .salonId(category.getSalonId())
                .build();
    }
}
