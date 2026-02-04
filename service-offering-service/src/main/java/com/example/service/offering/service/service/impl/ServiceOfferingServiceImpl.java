package com.example.service.offering.service.service.impl;

import com.example.service.offering.service.model.ServiceOffering;
import com.example.service.offering.service.payload.dto.CategoryDto;
import com.example.service.offering.service.payload.dto.SalonDto;
import com.example.service.offering.service.repository.ServiceOfferingRepository;
import com.example.service.offering.service.service.ServiceOfferingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceOfferingServiceImpl implements ServiceOfferingService {
    private final ServiceOfferingRepository serviceOfferingRepository;

    @Override
    public ServiceOffering createServiceOffering(SalonDto salonDto,
                                                 ServiceOffering service,
                                                 CategoryDto categoryDto) {

        ServiceOffering serviceOffering = new ServiceOffering();
        serviceOffering.setName(service.getName());
        serviceOffering.setDescription(service.getDescription());
        serviceOffering.setImage(service.getImage());
        serviceOffering.setPrice(service.getPrice());
        serviceOffering.setDuration(service.getDuration());
        serviceOffering.setCategoryId(categoryDto.getId());
        serviceOffering.setSalonId(salonDto.getId());

        return serviceOfferingRepository.save(serviceOffering);
    }

    @Override
    public ServiceOffering updateServiceOffering(Long serviceOfferingId,
                                                 ServiceOffering serviceOffering) {
        ServiceOffering existingServiceOffering = serviceOfferingRepository.findById(serviceOfferingId)
                .orElseThrow(() -> new RuntimeException("Service offering does not exists!"));

        existingServiceOffering.setName(serviceOffering.getName());
        existingServiceOffering.setDescription(serviceOffering.getDescription());
        existingServiceOffering.setImage(serviceOffering.getImage());
        existingServiceOffering.setPrice(serviceOffering.getPrice());
        existingServiceOffering.setDuration(serviceOffering.getDuration());

        return serviceOfferingRepository.save(existingServiceOffering);
    }

    @Override
    public Set<ServiceOffering> getAllServiceOfferingsBySalonId(Long salonId, Long categoryId) {
        Set<ServiceOffering> services = serviceOfferingRepository.findBySalonId(salonId);
        if (categoryId != null) {
            services = services.stream()
                    .filter(s -> s.getCategoryId() != null && s.getCategoryId().equals(categoryId))
                    .collect(Collectors.toSet());
        }
        return services;
    }

    @Override
    public Set<ServiceOffering> getServiceOfferingsByIds(Set<Long> ids) {
        return new HashSet<>(serviceOfferingRepository.findAllById(ids));
    }

    @Override
    public ServiceOffering getServiceOfferingById(Long id) {
        return serviceOfferingRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Service offering does not exists!")
        );
    }
}
