package com.example.payload.response;

import com.example.domain.UserRole;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class AuthResponse {
    private String jwt;

    @JsonProperty("refresh_token")
    private String refreshToken;

    private String message;

    private String title;

    private UserRole role;
}
