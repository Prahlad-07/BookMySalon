/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
package com.bookmysalon.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignupInitiateResponse {
    private String sessionToken;
    private long expiresAtEpochMs;
    private String maskedEmail;
    private String maskedPhone;
    private String devEmailOtp;
    private String devPhoneOtp;
}
