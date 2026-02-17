/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
package com.bookmysalon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "signup_verification_sessions", indexes = {
        @Index(name = "idx_signup_session_token", columnList = "session_token"),
        @Index(name = "idx_signup_session_email", columnList = "email"),
        @Index(name = "idx_signup_session_phone", columnList = "phone")
})
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignupVerificationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_token", nullable = false, unique = true, length = 180)
    private String sessionToken;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone", nullable = false)
    private String phone;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "requested_role", nullable = false, length = 32)
    private String requestedRole;

    @Column(name = "email_otp_hash", nullable = false, length = 255)
    private String emailOtpHash;

    @Column(name = "phone_otp_hash", nullable = false, length = 255)
    private String phoneOtpHash;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
