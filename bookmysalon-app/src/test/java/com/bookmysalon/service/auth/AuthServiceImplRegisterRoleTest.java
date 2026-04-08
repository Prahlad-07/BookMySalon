package com.bookmysalon.service.auth;

import com.bookmysalon.dto.auth.RegisterRequest;
import com.bookmysalon.dto.response.AuthResponse;
import com.bookmysalon.entity.RefreshToken;
import com.bookmysalon.entity.Role;
import com.bookmysalon.entity.User;
import com.bookmysalon.entity.UserRole;
import com.bookmysalon.repository.PasswordResetTokenRepository;
import com.bookmysalon.repository.RoleRepository;
import com.bookmysalon.repository.SignupVerificationSessionRepository;
import com.bookmysalon.repository.UserRepository;
import com.bookmysalon.security.CustomUserPrincipal;
import com.bookmysalon.security.JwtService;
import com.bookmysalon.service.auth.verification.VerificationDeliveryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplRegisterRoleTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock
    private SignupVerificationSessionRepository signupVerificationSessionRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private VerificationDeliveryService verificationDeliveryService;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                userRepository,
                passwordResetTokenRepository,
                signupVerificationSessionRepository,
                roleRepository,
                passwordEncoder,
                authenticationManager,
                jwtService,
                refreshTokenService,
                verificationDeliveryService,
                new ObjectMapper()
        );
    }

    @Test
    void registerAcceptsHumanReadableSalonOwnerRole() {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Salon Owner")
                .email("owner@example.com")
                .password("Test@12345")
                .role("salon owner")
                .build();

        when(userRepository.existsByEmailIgnoreCase("owner@example.com")).thenReturn(false);
        when(userRepository.existsByUsernameIgnoreCase(anyString())).thenReturn(false);
        when(passwordEncoder.encode("Test@12345")).thenReturn("encoded-password");
        when(roleRepository.findByName(any(UserRole.class))).thenAnswer(invocation ->
                Optional.of(new Role(1L, invocation.getArgument(0))));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(42L);
            return user;
        });
        when(jwtService.generateAccessToken(any(CustomUserPrincipal.class))).thenReturn("access-token");
        when(jwtService.getAccessTokenExpirationMs()).thenReturn(7200000L);
        when(refreshTokenService.getRefreshTokenExpirationMs()).thenReturn(604800000L);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token");
        when(refreshTokenService.createRefreshToken(any(User.class))).thenReturn(refreshToken);

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("SALON_OWNER", response.getRole());

        ArgumentCaptor<User> savedUserCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUserCaptor.capture());
        User savedUser = savedUserCaptor.getValue();

        assertEquals(UserRole.SALON_OWNER, savedUser.getRole());
        assertTrue(savedUser.getRoles().stream().anyMatch(role -> role.getName() == UserRole.SALON_OWNER));
    }
}
