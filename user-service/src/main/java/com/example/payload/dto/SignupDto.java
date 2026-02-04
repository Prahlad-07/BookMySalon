package com.example.payload.dto;

import com.example.domain.UserRole;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class SignupDto {
    private String firstName;

    private String lastName;

    private String email;

    private String password;

    private UserRole role;
}
