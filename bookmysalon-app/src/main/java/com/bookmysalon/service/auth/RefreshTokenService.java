/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-16
 */
package com.bookmysalon.service.auth;

import com.bookmysalon.entity.RefreshToken;
import com.bookmysalon.entity.User;
import com.bookmysalon.exception.InvalidTokenException;
import com.bookmysalon.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RefreshTokenService {

    @Value("${security.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000));
        refreshToken.setRevoked(false);
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public RefreshToken validateToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Refresh token not found"));

        if (refreshToken.isRevoked()) {
            // A revoked token being presented again means it was already rotated or
            // stolen. Revoke the whole family so an attacker cannot keep using a leaked token.
            log.warn("Reuse of a revoked refresh token detected for user {}. Revoking all sessions.",
                    refreshToken.getUser() != null ? refreshToken.getUser().getId() : null);
            if (refreshToken.getUser() != null) {
                refreshTokenRepository.revokeAllForUser(refreshToken.getUser().getId());
            }
            throw new InvalidTokenException("Refresh token is no longer valid. Please sign in again.");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Refresh token expired");
        }

        return refreshToken;
    }

    /**
     * Rotates a validated token. The revoke is a conditional UPDATE so that two
     * concurrent refreshes with the same token cannot both succeed.
     */
    public RefreshToken rotateToken(RefreshToken currentToken) {
        int revoked = refreshTokenRepository.revokeIfActive(currentToken.getId());
        if (revoked == 0) {
            throw new InvalidTokenException("Refresh token was already used. Please sign in again.");
        }
        return createRefreshToken(currentToken.getUser());
    }

    public void revokeAllUserTokens(User user) {
        if (user != null && user.getId() != null) {
            refreshTokenRepository.revokeAllForUser(user.getId());
        }
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }
}
