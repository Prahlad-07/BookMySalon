package com.bookmysalon.dto;

import com.bookmysalon.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SignupDto {
    private String name;
    private String email;
    private String phone;
    private String password;
    private UserRole role;
}
