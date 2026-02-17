/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
package com.bookmysalon.dto.auth;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.bookmysalon.entity.UserRole;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @JsonAlias({"userName"})
    private String username;

    @JsonAlias({"name"})
    private String fullName;

    @Email
    private String email;

    private String phone;

    private String password;

    private Set<UserRole> roles;

    @JsonAlias({"role"})
    private String role;
}
