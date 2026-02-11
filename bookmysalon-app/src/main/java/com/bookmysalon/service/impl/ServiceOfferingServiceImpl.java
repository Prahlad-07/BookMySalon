package com.bookmysalon.service.impl;

import com.bookmysalon.dto.ServiceOfferingDto;
import com.bookmysalon.entity.ServiceOffering;
import com.bookmysalon.exception.CategoryNotFoundException;
import com.bookmysalon.repository.ServiceOfferingRepository;
import com.bookmysalon.service.ServiceOfferingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ServiceOfferingServiceImpl implements ServiceOfferingService {

    private final ServiceOfferingRepository serviceOfferingRepository;

    @Override
    public ServiceOfferingDto createServiceOffering(ServiceOfferingDto serviceOfferingDto) {
        // Validate input
        if (serviceOfferingDto == null) {
            throw new IllegalArgumentException("Service offering data cannot be null");
        }
        if (serviceOfferingDto.getName() == null || serviceOfferingDto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Service name is required");
        }
        if (serviceOfferingDto.getPrice() == null || serviceOfferingDto.getPrice() <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }
        if (serviceOfferingDto.getDuration() == null || serviceOfferingDto.getDuration() <= 0) {
            throw new IllegalArgumentException("Duration must be greater than 0");
        }
        if (serviceOfferingDto.getSalonId() == null || serviceOfferingDto.getSalonId() <= 0) {
            throw new IllegalArgumentException("Salon ID is required and must be valid");
        }
        if (serviceOfferingDto.getCategoryId() == null || serviceOfferingDto.getCategoryId() <= 0) {
            throw new IllegalArgumentException("Category ID is required and must be valid");
        }

        ServiceOffering serviceOffering = new ServiceOffering();
        serviceOffering.setName(serviceOfferingDto.getName().trim());
        serviceOffering.setDescription(serviceOfferingDto.getDescription());
        serviceOffering.setPrice(serviceOfferingDto.getPrice());
        serviceOffering.setDuration(serviceOfferingDto.getDuration());
        serviceOffering.setSalonId(serviceOfferingDto.getSalonId());
        serviceOffering.setCategoryId(serviceOfferingDto.getCategoryId());

        ServiceOffering savedServiceOffering = serviceOfferingRepository.save(serviceOffering);
        return mapToDto(savedServiceOffering);
    }

    @Override
    public ServiceOfferingDto getServiceOfferingById(Long id) {
        ServiceOffering serviceOffering = serviceOfferingRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Service offering not found with id: " + id));
        return mapToDto(serviceOffering);
    }

    @Override
    public List<ServiceOfferingDto> getAllServiceOfferings() {
        return serviceOfferingRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ServiceOfferingDto> getServiceOfferingsBySalonId(Long salonId) {
        return serviceOfferingRepository.findBySalonId(salonId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ServiceOfferingDto> getServiceOfferingsByCategoryId(Long categoryId) {
        return serviceOfferingRepository.findByCategoryId(categoryId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public ServiceOfferingDto updateServiceOffering(Long id, ServiceOfferingDto serviceOfferingDto) {
        ServiceOffering serviceOffering = serviceOfferingRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Service offering not found with id: " + id));

        if (serviceOfferingDto.getName() != null) serviceOffering.setName(serviceOfferingDto.getName());
        if (serviceOfferingDto.getDescription() != null) serviceOffering.setDescription(serviceOfferingDto.getDescription());
        if (serviceOfferingDto.getPrice() != null) serviceOffering.setPrice(serviceOfferingDto.getPrice());
        if (serviceOfferingDto.getDuration() != null) serviceOffering.setDuration(serviceOfferingDto.getDuration());

        ServiceOffering updatedServiceOffering = serviceOfferingRepository.save(serviceOffering);
        return mapToDto(updatedServiceOffering);
    }

    @Override
    public void deleteServiceOffering(Long id) {
        if (!serviceOfferingRepository.existsById(id)) {
            throw new CategoryNotFoundException("Service offering not found with id: " + id);
        }
        serviceOfferingRepository.deleteById(id);
    }

    private ServiceOfferingDto mapToDto(ServiceOffering serviceOffering) {
        return ServiceOfferingDto.builder()
                .id(serviceOffering.getId())
                .name(serviceOffering.getName())
                .description(serviceOffering.getDescription())
                .price(serviceOffering.getPrice())
                .duration(serviceOffering.getDuration())
                .salonId(serviceOffering.getSalonId())
                .categoryId(serviceOffering.getCategoryId())
                .build();
    }
}
