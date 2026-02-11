package com.bookmysalon.service;

import com.bookmysalon.dto.ServiceOfferingDto;
import java.util.List;

public interface ServiceOfferingService {
    ServiceOfferingDto createServiceOffering(ServiceOfferingDto serviceOfferingDto);
    ServiceOfferingDto getServiceOfferingById(Long id);
    List<ServiceOfferingDto> getAllServiceOfferings();
    List<ServiceOfferingDto> getServiceOfferingsBySalonId(Long salonId);
    List<ServiceOfferingDto> getServiceOfferingsByCategoryId(Long categoryId);
    ServiceOfferingDto updateServiceOffering(Long id, ServiceOfferingDto serviceOfferingDto);
    void deleteServiceOffering(Long id);
}
