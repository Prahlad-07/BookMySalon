package com.example.payload.dto;

import lombok.Data;

@Data
public class ServiceOfferingDto {
    private Long id;

    private String name;

    private String description;

    private Double price;

    private Integer duration;

    private String image;

}
