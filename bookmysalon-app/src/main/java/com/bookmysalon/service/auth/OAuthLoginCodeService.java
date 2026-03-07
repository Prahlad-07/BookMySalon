/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-03-05
 */
package com.bookmysalon.service.auth;

import com.bookmysalon.dto.response.AuthResponse;
import com.bookmysalon.exception.AuthException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OAuthLoginCodeService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int CODE_BYTES = 36;

    @Value("${app.oauth2.exchange-code-ttl-seconds:120}")
    private long exchangeCodeTtlSeconds;

    private final Map<String, IssuedCode> issuedCodes = new ConcurrentHashMap<>();

    public String issue(AuthResponse authResponse) {
        cleanupExpired();

        String code = generateCode();
        long expiresAt = Instant.now().toEpochMilli() + (Math.max(30, exchangeCodeTtlSeconds) * 1000);
        issuedCodes.put(code, new IssuedCode(authResponse, expiresAt));
        return code;
    }

    public AuthResponse consume(String code) {
        if (code == null || code.isBlank()) {
            throw new AuthException("OAuth code is required");
        }

        IssuedCode issued = issuedCodes.remove(code.trim());
        if (issued == null) {
            throw new AuthException("Invalid or expired OAuth code");
        }

        if (issued.expiresAtEpochMs < Instant.now().toEpochMilli()) {
            throw new AuthException("OAuth code expired. Please sign in again.");
        }

        return issued.authResponse;
    }

    private void cleanupExpired() {
        long now = Instant.now().toEpochMilli();
        issuedCodes.entrySet().removeIf(entry -> entry.getValue().expiresAtEpochMs < now);
    }

    private String generateCode() {
        byte[] bytes = new byte[CODE_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private record IssuedCode(AuthResponse authResponse, long expiresAtEpochMs) {
    }
}
