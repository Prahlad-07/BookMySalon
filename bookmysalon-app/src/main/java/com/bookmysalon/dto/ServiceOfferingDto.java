package com.bookmysalon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ServiceOfferingDto {
    private Long id;
    private String name;
    private String description;
    private Double price;
    private Integer duration;
    private Long salonId;
    private Long categoryId;
}
