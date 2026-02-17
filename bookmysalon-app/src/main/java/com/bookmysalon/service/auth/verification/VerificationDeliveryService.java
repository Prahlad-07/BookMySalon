/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
package com.bookmysalon.service.auth.verification;

public interface VerificationDeliveryService {
    void sendEmailOtp(String email, String otp);
    void sendPhoneOtp(String phone, String otp);
}
