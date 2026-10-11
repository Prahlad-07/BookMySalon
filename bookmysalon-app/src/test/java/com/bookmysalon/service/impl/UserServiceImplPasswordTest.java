package com.bookmysalon.service.impl;

import com.bookmysalon.entity.User;
import com.bookmysalon.repository.PasswordResetTokenRepository;
import com.bookmysalon.repository.RefreshTokenRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplPasswordTest {

    @Mock UserRepository userRepository;
    @Mock SalonRepository salonRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private UserServiceImpl service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new UserServiceImpl(userRepository, salonRepository, refreshTokenRepository,
                passwordResetTokenRepository, encoder);
        user = new User();
        user.setId(9L);
        user.setPassword(encoder.encode("OldPass#123"));
        when(userRepository.findById(9L)).thenReturn(Optional.of(user));
    }

    @Test
    void changesPasswordAndRevokesOtherSessions() {
        service.changePassword(9L, "OldPass#123", "NewPass#456");

        assertTrue(encoder.matches("NewPass#456", user.getPassword()));
        verify(userRepository).save(user);
        verify(refreshTokenRepository).revokeAllForUser(9L);
    }

    @Test
    void rejectsWrongCurrentPassword() {
        assertThrows(IllegalArgumentException.class, () -> service.changePassword(9L, "wrong", "NewPass#456"));
        verify(userRepository, never()).save(any());
    }

    @Test
    void rejectsShortNewPassword() {
        assertThrows(IllegalArgumentException.class, () -> service.changePassword(9L, "OldPass#123", "short"));
        verify(refreshTokenRepository, never()).revokeAllForUser(any());
    }

    @Test
    void rejectsReusingCurrentPassword() {
        assertThrows(IllegalArgumentException.class, () -> service.changePassword(9L, "OldPass#123", "OldPass#123"));
    }
}
