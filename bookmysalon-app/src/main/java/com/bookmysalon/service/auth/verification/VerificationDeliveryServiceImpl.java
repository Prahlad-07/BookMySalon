/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
package com.bookmysalon.service.auth.verification;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class VerificationDeliveryServiceImpl implements VerificationDeliveryService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.otp.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.otp.email.from:}")
    private String emailFrom;

    @Value("${app.otp.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${app.otp.sms.default-country-code:+91}")
    private String defaultCountryCode;

    @Value("${app.otp.sms.twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${app.otp.sms.twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${app.otp.sms.twilio.from-number:}")
    private String twilioFromNumber;

    @Override
    public void sendEmailOtp(String email, String otp) {
        if (!emailEnabled) {
            log.info("Email delivery disabled. Email OTP for {}: {}", email, otp);
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || isBlank(emailFrom)) {
            log.error("Email is enabled but SMTP/from config is missing.");
            throw new IllegalStateException("Email provider is not configured");
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(emailFrom.trim());
            message.setTo(email);
            message.setSubject("BookMySalon OTP Verification");
            message.setText("Your BookMySalon OTP is " + otp + ". It is valid for 10 minutes.");
            mailSender.send(message);
            log.info("Email OTP sent successfully to {}", email);
        } catch (Exception ex) {
            log.error("Failed to send OTP email to {}", email, ex);
            throw new IllegalStateException("Failed to send OTP email");
        }
    }

    @Override
    public void sendPhoneOtp(String phone, String otp) {
        String maskedPhone = maskPhone(phone);
        String normalizedPhone = normalizePhoneNumber(phone);

        if (!smsEnabled) {
            log.info("SMS delivery disabled. Phone OTP for {}: {}", maskedPhone, otp);
            return;
        }

        if (isBlank(twilioAccountSid) || isBlank(twilioAuthToken) || isBlank(twilioFromNumber)) {
            log.error("SMS is enabled but Twilio config is missing. Check app.otp.sms.twilio.* properties.");
            throw new IllegalStateException("SMS provider is not configured");
        }

        String messageBody = "Your BookMySalon OTP is " + otp + ". It is valid for 10 minutes.";

        try {
            Twilio.init(twilioAccountSid.trim(), twilioAuthToken.trim());
            Message.creator(
                    new PhoneNumber(normalizedPhone),
                    new PhoneNumber(twilioFromNumber.trim()),
                    messageBody
            ).create();
            log.info("Phone OTP sent successfully to {}", maskedPhone);
        } catch (Exception ex) {
            log.error("Failed to send OTP SMS to {}", maskedPhone, ex);
            throw new IllegalStateException("Failed to send OTP SMS");
        }
    }

    private String normalizePhoneNumber(String phone) {
        if (phone == null) {
            throw new IllegalArgumentException("Phone cannot be null");
        }

        String trimmed = phone.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("Phone cannot be empty");
        }

        if (trimmed.startsWith("+")) {
            return trimmed;
        }
        return defaultCountryCode.trim() + trimmed;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "****";
        }
        return "******" + phone.substring(phone.length() - 4);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
