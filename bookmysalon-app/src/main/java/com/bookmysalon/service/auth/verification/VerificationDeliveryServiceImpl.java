/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
package com.bookmysalon.service.auth.verification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class VerificationDeliveryServiceImpl implements VerificationDeliveryService {

    @Override
    public void sendEmailOtp(String email, String otp) {
        log.info("Email OTP for {}: {}", email, otp);
    }

    @Override
    public void sendPhoneOtp(String phone, String otp) {
        log.info("Phone OTP for {}: {}", phone, otp);
    }
}
