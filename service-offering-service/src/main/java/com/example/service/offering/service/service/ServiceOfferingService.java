package com.example.service.offering.service.service;

import com.example.service.offering.service.model.ServiceOffering;
import com.example.service.offering.service.payload.dto.CategoryDto;
import com.example.service.offering.service.payload.dto.SalonDto;

import java.util.Set;

public interface ServiceOfferingService {
    ServiceOffering createServiceOffering(SalonDto salonDto,
                                  ServiceOffering service,
                                  CategoryDto categoryDto);

    ServiceOffering updateServiceOffering(Long serviceOfferingId, ServiceOffering serviceOffering);

    Set<ServiceOffering> getAllServiceOfferingsBySalonId(Long salonId, Long categoryId);

    Set<ServiceOffering> getServiceOfferingsByIds(Set<Long> ids);

    ServiceOffering getServiceOfferingById(Long id);

}
