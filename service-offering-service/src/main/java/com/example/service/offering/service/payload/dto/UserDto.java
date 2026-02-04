package com.example.service.offering.service.payload.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class UserDto {
    private Long id;

    private String fullName;

    private String email;
}
