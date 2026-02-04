package com.example.service.offering.service.payload.dto;

import lombok.Data;

@Data
public class ServiceOfferingDto {
    private Long id;
    private String name;
    private String description;
    private Double price;
    private Integer duration;
    private String image;
    private Long categoryId;
}
