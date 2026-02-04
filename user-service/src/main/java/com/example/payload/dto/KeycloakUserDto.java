package com.example.payload.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class KeycloakUserDto {
    private String id;

    private String firstName;

    private String lastName;

    private String email;

    private String username;
}
