/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-03-05
 */
package com.bookmysalon.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuthExchangeRequest {
    @NotBlank(message = "OAuth code is required")
    private String code;
}
