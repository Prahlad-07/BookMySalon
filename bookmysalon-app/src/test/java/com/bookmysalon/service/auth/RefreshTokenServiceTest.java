package com.bookmysalon.service.auth;

import com.bookmysalon.entity.RefreshToken;
import com.bookmysalon.entity.User;
import com.bookmysalon.exception.InvalidTokenException;
import com.bookmysalon.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock RefreshTokenRepository repository;
    RefreshTokenService service;

    @BeforeEach
    void setUp() {
        service = new RefreshTokenService(repository);
        ReflectionTestUtils.setField(service, "refreshTokenExpirationMs", 604_800_000L);
    }

    private User user() {
        User u = new User();
        u.setId(3L);
        return u;
    }

    private RefreshToken token(boolean revoked, LocalDateTime expiresAt) {
        RefreshToken t = new RefreshToken();
        t.setId(100L);
        t.setToken("abc");
        t.setUser(user());
        t.setRevoked(revoked);
        t.setExpiresAt(expiresAt);
        return t;
    }

    @Test
    void reuseOfRevokedTokenRevokesEntireFamily() {
        when(repository.findByToken("abc")).thenReturn(Optional.of(token(true, LocalDateTime.now().plusDays(1))));

        assertThrows(InvalidTokenException.class, () -> service.validateToken("abc"));
        verify(repository).revokeAllForUser(3L);
    }

    @Test
    void expiredTokenIsRejected() {
        when(repository.findByToken("abc")).thenReturn(Optional.of(token(false, LocalDateTime.now().minusMinutes(1))));
        assertThrows(InvalidTokenException.class, () -> service.validateToken("abc"));
    }

    @Test
    void rotationFailsWhenTokenAlreadyConsumed() {
        RefreshToken current = token(false, LocalDateTime.now().plusDays(1));
        when(repository.revokeIfActive(100L)).thenReturn(0);

        assertThrows(InvalidTokenException.class, () -> service.rotateToken(current));
    }

    @Test
    void rotationIssuesFreshTokenWhenActive() {
        RefreshToken current = token(false, LocalDateTime.now().plusDays(1));
        when(repository.revokeIfActive(100L)).thenReturn(1);
        when(repository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        RefreshToken rotated = service.rotateToken(current);

        assertNotNull(rotated.getToken());
    }
}
