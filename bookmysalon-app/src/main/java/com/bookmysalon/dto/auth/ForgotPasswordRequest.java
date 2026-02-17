/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
package com.bookmysalon.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ForgotPasswordRequest {
    @NotBlank
    @Email
    private String email;
}
