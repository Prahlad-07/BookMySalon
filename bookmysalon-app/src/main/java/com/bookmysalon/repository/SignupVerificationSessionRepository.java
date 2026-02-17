/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
package com.bookmysalon.repository;

import com.bookmysalon.entity.SignupVerificationSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface SignupVerificationSessionRepository extends JpaRepository<SignupVerificationSession, Long> {
    Optional<SignupVerificationSession> findBySessionToken(String sessionToken);
    void deleteByEmailIgnoreCase(String email);
    void deleteByPhone(String phone);
    void deleteByExpiresAtBefore(LocalDateTime now);
}
