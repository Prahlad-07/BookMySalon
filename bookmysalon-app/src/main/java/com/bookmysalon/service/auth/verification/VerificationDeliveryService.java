/**
 * @author Prahlad Yadav
 * @version 1.1
 * @since 2026-02-16
 */
package com.bookmysalon.service.auth.verification;

public interface VerificationDeliveryService {
    void sendEmailOtp(String email, String otp);
    void sendPhoneOtp(String phone, String otp);

    /**
     * Sends a password reset link to the given email.
     *
     * @return {@code true} if a message was actually dispatched, {@code false}
     * when email delivery is disabled on this deployment (dev mode).
     */
    boolean sendPasswordResetEmail(String email, String resetLink, int expiryMinutes);
}
