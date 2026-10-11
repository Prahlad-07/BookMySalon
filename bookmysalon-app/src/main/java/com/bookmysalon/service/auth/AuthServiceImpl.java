/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
package com.bookmysalon.service.auth;

import com.bookmysalon.dto.auth.*;
import com.bookmysalon.dto.response.AuthResponse;
import com.bookmysalon.entity.*;
import com.bookmysalon.exception.AuthException;
import com.bookmysalon.exception.ConflictException;
import com.bookmysalon.repository.*;
import com.bookmysalon.security.CustomUserPrincipal;
import com.bookmysalon.security.JwtService;
import com.bookmysalon.service.auth.verification.VerificationDeliveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthServiceImpl implements AuthService {
    private static final int RESET_TOKEN_MINUTES = 30;
    private static final int SIGNUP_OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${app.otp.dev-mode:true}")
    private boolean otpDevMode;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SignupVerificationSessionRepository signupVerificationSessionRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final VerificationDeliveryService verificationDeliveryService;

    @Override
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail() == null ? null : request.getEmail().trim().toLowerCase();
        String fullName = request.getFullName() == null ? null : request.getFullName().trim();
        String phone = request.getPhone() == null ? null : request.getPhone().trim();

        if (email == null || email.isBlank()) {
            throw new AuthException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().trim().length() < 8) {
            throw new AuthException("Password must be at least 8 characters");
        }
        if (fullName == null || fullName.isBlank()) {
            throw new AuthException("Full name is required");
        }
        if (phone != null && !phone.isBlank()) {
            validatePhoneNumber(phone);
        }
        String username = resolveAvailableUsername(request.getUsername(), email);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new AuthException("Email already exists");
        }

        Set<UserRole> roleNames = resolveRequestedRoles(request);
        Set<Role> roles = roleNames.stream().map(this::getOrCreateRole).collect(Collectors.toSet());

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(fullName == null || fullName.isBlank() ? username : fullName);
        user.setPhone(phone);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRoles(roles);
        user.setRole(resolvePrimaryRole(roleNames));

        User savedUser = persistNewUser(user);
        CustomUserPrincipal principal = buildPrincipal(savedUser);
        String accessToken = jwtService.generateAccessToken(principal);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser);

        return buildAuthResponse(savedUser, accessToken, refreshToken, "Registration successful");
    }

    @Override
    public SignupInitiateResponse initiateSignup(SignupInitiateRequest request) {
        String email = request.getEmail() == null ? null : request.getEmail().trim().toLowerCase();
        String fullName = request.getFullName() == null ? null : request.getFullName().trim();
        String providedPhone = request.getPhone() == null ? null : request.getPhone().trim();

        if (email == null || email.isBlank()) {
            throw new AuthException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().trim().length() < 8) {
            throw new AuthException("Password must be at least 8 characters");
        }
        String username = resolveAvailableUsername(request.getUsername(), email);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new AuthException("Email already exists");
        }

        signupVerificationSessionRepository.deleteByEmailIgnoreCase(email);
        if (providedPhone != null && !providedPhone.isBlank()) {
            signupVerificationSessionRepository.deleteByPhone(providedPhone);
        }
        signupVerificationSessionRepository.deleteByExpiresAtBefore(LocalDateTime.now());

        SignupVerificationSession session = new SignupVerificationSession();
        session.setSessionToken(generateToken());
        session.setUsername(username);
        session.setFullName(fullName == null || fullName.isBlank() ? username : fullName);
        session.setEmail(email);
        String sessionPhone = (providedPhone == null || providedPhone.isBlank())
                ? "EMAIL_ONLY_" + Math.abs(email.hashCode())
                : providedPhone;
        session.setPhone(sessionPhone);
        session.setPasswordHash(passwordEncoder.encode(request.getPassword().trim()));
        Set<UserRole> requestedRoles = resolveRequestedRoles(request.getRole());
        session.setRequestedRole(resolvePrimaryRole(requestedRoles).name());

        return issueAndSendOtp(session);
    }

    @Override
    public SignupInitiateResponse resendSignupOtp(ResendSignupOtpRequest request) {
        SignupVerificationSession session = signupVerificationSessionRepository.findBySessionToken(request.getSessionToken())
                .orElseThrow(() -> new AuthException("Invalid signup session"));

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            signupVerificationSessionRepository.delete(session);
            throw new AuthException("Signup session expired. Please restart signup.");
        }

        return issueAndSendOtp(session);
    }

    @Override
    public AuthResponse verifySignupOtp(VerifySignupOtpRequest request) {
        if (request.getSessionToken() == null || request.getSessionToken().isBlank()) {
            throw new AuthException("Session token is required");
        }
        if (request.getEmailOtp() == null || request.getEmailOtp().isBlank()) {
            throw new AuthException("Email OTP is required");
        }

        SignupVerificationSession session = signupVerificationSessionRepository.findBySessionToken(request.getSessionToken())
                .orElseThrow(() -> new AuthException("Invalid signup session"));

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            signupVerificationSessionRepository.delete(session);
            throw new AuthException("OTP expired. Please request a new OTP.");
        }

        boolean emailOtpValid = passwordEncoder.matches(request.getEmailOtp().trim(), session.getEmailOtpHash());
        if (!emailOtpValid) {
            session.setAttemptCount(session.getAttemptCount() + 1);
            if (session.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
                signupVerificationSessionRepository.delete(session);
                throw new AuthException("Too many invalid attempts. Please signup again.");
            }
            signupVerificationSessionRepository.save(session);
            throw new AuthException("Invalid email OTP.");
        }

        if (userRepository.existsByEmailIgnoreCase(session.getEmail())) {
            signupVerificationSessionRepository.delete(session);
            throw new AuthException("Email already exists");
        }
        String username = resolveAvailableUsername(session.getUsername(), session.getEmail());

        Set<UserRole> roleNames = resolveRequestedRoles(session.getRequestedRole());
        Set<Role> roles = roleNames.stream().map(this::getOrCreateRole).collect(Collectors.toSet());

        User user = new User();
        user.setUsername(username);
        user.setEmail(session.getEmail());
        user.setPhone(session.getPhone());
        user.setFullName(session.getFullName());
        user.setPassword(session.getPasswordHash());
        user.setRoles(roles);
        user.setRole(resolvePrimaryRole(roleNames));

        User savedUser = persistNewUser(user);
        signupVerificationSessionRepository.delete(session);

        CustomUserPrincipal principal = buildPrincipal(savedUser);
        String accessToken = jwtService.generateAccessToken(principal);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser);

        return buildAuthResponse(savedUser, accessToken, refreshToken, "Signup verification successful");
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            String usernameOrEmail = request.resolvedUsernameOrEmail();
            if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
                throw new AuthException("Email/username is required");
            }
            if (request.getPassword() == null || request.getPassword().isBlank()) {
                throw new AuthException("Password is required");
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(usernameOrEmail, request.getPassword())
            );

            CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
            User user = userRepository.findById(principal.getId())
                    .orElseThrow(() -> new AuthException("Authenticated user not found"));

            refreshTokenService.revokeAllUserTokens(user);

            String accessToken = jwtService.generateAccessToken(principal);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

            return buildAuthResponse(user, accessToken, refreshToken, "Login successful");
        } catch (BadCredentialsException ex) {
            throw new AuthException("Invalid username/email or password");
        }
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken existingToken = refreshTokenService.validateToken(request.getRefreshToken());
        User user = existingToken.getUser();

        CustomUserPrincipal principal = buildPrincipal(user);
        String newAccessToken = jwtService.generateAccessToken(principal);
        RefreshToken rotatedToken = refreshTokenService.rotateToken(existingToken);

        return buildAuthResponse(user, newAccessToken, rotatedToken, "Access token refreshed");
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail() == null ? null : request.getEmail().trim().toLowerCase();
        if (email == null || email.isBlank()) {
            return;
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            return;
        }

        passwordResetTokenRepository.deleteByUser(user);
        passwordResetTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());

        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(generateToken());
        token.setExpiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_MINUTES));
        token.setUsed(false);
        passwordResetTokenRepository.save(token);

        String resetLink = UriComponentsBuilder
                .fromUriString(trimTrailingSlash(frontendBaseUrl) + "/reset-password")
                .queryParam("token", token.getToken())
                .build()
                .toUriString();

        try {
            verificationDeliveryService.sendPasswordResetEmail(user.getEmail(), resetLink, RESET_TOKEN_MINUTES);
        } catch (RuntimeException ex) {
            // Do not surface mailer state to the caller (avoids account enumeration / info leak).
            log.error("Unable to deliver password reset email for {}", user.getEmail(), ex);
        }
    }

    private String trimTrailingSlash(String value) {
        String base = value == null ? "" : value.trim();
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    private User persistNewUser(User user) {
        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("An account with this email or username already exists");
        }
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 8) {
            throw new AuthException("New password must be at least 8 characters");
        }

        PasswordResetToken token = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new AuthException("Invalid or expired reset token"));

        if (token.isUsed() || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AuthException("Invalid or expired reset token");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);
        refreshTokenService.revokeAllUserTokens(user);
    }

    private SignupInitiateResponse issueAndSendOtp(SignupVerificationSession session) {
        String emailOtp = generateSixDigitOtp();

        session.setEmailOtpHash(passwordEncoder.encode(emailOtp));
        session.setPhoneOtpHash(passwordEncoder.encode(generateToken()));
        session.setAttemptCount(0);
        session.setExpiresAt(LocalDateTime.now().plusMinutes(SIGNUP_OTP_EXPIRY_MINUTES));

        SignupVerificationSession saved = signupVerificationSessionRepository.save(session);

        verificationDeliveryService.sendEmailOtp(saved.getEmail(), emailOtp);

        SignupInitiateResponse.SignupInitiateResponseBuilder builder = SignupInitiateResponse.builder()
                .sessionToken(saved.getSessionToken())
                .expiresAtEpochMs(saved.getExpiresAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())
                .maskedEmail(maskEmail(saved.getEmail()));

        if (otpDevMode) {
            builder.devEmailOtp(emailOtp);
        }

        return builder.build();
    }

    private Set<UserRole> resolveRequestedRoles(RegisterRequest request) {
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            Set<UserRole> requested = request.getRoles().stream()
                    .filter(java.util.Objects::nonNull)
                    .map(role -> role == UserRole.USER ? UserRole.CUSTOMER : role)
                    .collect(Collectors.toSet());

            if (requested.contains(UserRole.ADMIN)) {
                throw new AuthException("Invalid role selected. Choose CUSTOMER or SALON_OWNER.");
            }

            if (requested.contains(UserRole.SALON_OWNER)) {
                return Set.of(UserRole.SALON_OWNER);
            }
            if (requested.contains(UserRole.CUSTOMER)) {
                return Set.of(UserRole.CUSTOMER);
            }
            throw new AuthException("Invalid role selected. Choose CUSTOMER or SALON_OWNER.");
        }
        return resolveRequestedRoles(request.getRole());
    }

    private Set<UserRole> resolveRequestedRoles(String roleValue) {
        if (roleValue == null || roleValue.isBlank()) {
            return Set.of(UserRole.CUSTOMER);
        }

        String normalized = roleValue.trim()
                .toUpperCase(Locale.ROOT)
                .replace("ROLE_", "")
                .replace('-', '_')
                .replace(' ', '_')
                .replaceAll("[^A-Z_]", "");

        if ("SALON_OWNER".equals(normalized)
                || "SALONOWNER".equals(normalized)
                || "OWNER".equals(normalized)
                || (normalized.contains("SALON") && normalized.contains("OWNER"))) {
            return Set.of(UserRole.SALON_OWNER);
        }
        if ("USER".equals(normalized)
                || "CUSTOMER".equals(normalized)
                || "CLIENT".equals(normalized)
                || normalized.contains("CUSTOMER")) {
            return Set.of(UserRole.CUSTOMER);
        }
        throw new AuthException("Invalid role selected. Choose CUSTOMER or SALON_OWNER.");
    }

    private Role getOrCreateRole(UserRole roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(null, roleName)));
    }

    private UserRole resolvePrimaryRole(Set<UserRole> roles) {
        if (roles.contains(UserRole.ADMIN)) {
            return UserRole.ADMIN;
        }
        if (roles.contains(UserRole.SALON_OWNER)) {
            return UserRole.SALON_OWNER;
        }
        if (roles.contains(UserRole.CUSTOMER)) {
            return UserRole.CUSTOMER;
        }
        return UserRole.CUSTOMER;
    }

    private CustomUserPrincipal buildPrincipal(User user) {
        UserRole effectiveRole = resolveEffectiveRole(user);
        Set<SimpleGrantedAuthority> authorities = Set.of(
                new SimpleGrantedAuthority("ROLE_" + effectiveRole.name())
        );

        return new CustomUserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                authorities
        );
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, RefreshToken refreshToken, String message) {
        String resolvedRole = resolveEffectiveRole(user).name();

        long now = System.currentTimeMillis();

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken.getToken())
                .accessTokenExpiresAt(now + jwtService.getAccessTokenExpirationMs())
                .refreshTokenExpiresAt(now + refreshTokenService.getRefreshTokenExpirationMs())
                .id(user.getId())
                .name(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(resolvedRole)
                .message(message)
                .build();
    }

    private UserRole resolveEffectiveRole(User user) {
        if (user != null) {
            UserRole normalizedPrimaryRole = normalizeRole(user.getRole());
            if (normalizedPrimaryRole != null) {
                return normalizedPrimaryRole;
            }

            if (user.getRoles() != null) {
                boolean hasAdmin = false;
                boolean hasSalonOwner = false;
                boolean hasCustomer = false;

                for (Role role : user.getRoles()) {
                    if (role == null) {
                        continue;
                    }
                    UserRole normalizedRole = normalizeRole(role.getName());
                    if (normalizedRole == UserRole.ADMIN) {
                        hasAdmin = true;
                        continue;
                    }
                    if (normalizedRole == UserRole.SALON_OWNER) {
                        hasSalonOwner = true;
                        continue;
                    }
                    if (normalizedRole == UserRole.CUSTOMER) {
                        hasCustomer = true;
                    }
                }

                if (hasAdmin) {
                    return UserRole.ADMIN;
                }
                if (hasSalonOwner) {
                    return UserRole.SALON_OWNER;
                }
                if (hasCustomer) {
                    return UserRole.CUSTOMER;
                }
            }
        }

        return UserRole.CUSTOMER;
    }

    private String resolveAvailableUsername(String requestedUsername, String email) {
        String base = sanitizeUsername(requestedUsername);
        if (base.isBlank()) {
            base = deriveUsernameFromEmail(email);
        }

        String candidate = base;
        while (userRepository.existsByUsernameIgnoreCase(candidate)) {
            candidate = base + "_" + (1000 + SECURE_RANDOM.nextInt(9000));
        }
        return candidate;
    }

    private String deriveUsernameFromEmail(String email) {
        if (email == null || email.isBlank()) {
            return "user";
        }

        String localPart = email.trim().toLowerCase();
        int atIndex = localPart.indexOf('@');
        if (atIndex > 0) {
            localPart = localPart.substring(0, atIndex);
        }

        String sanitized = sanitizeUsername(localPart);
        return sanitized.isBlank() ? "user" : sanitized;
    }

    private String sanitizeUsername(String rawUsername) {
        if (rawUsername == null) {
            return "";
        }
        return rawUsername.trim().replaceAll("[^a-zA-Z0-9._-]", "");
    }

    private String generateToken() {
        byte[] randomBytes = new byte[48];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String generateSixDigitOtp() {
        return String.valueOf(SECURE_RANDOM.nextInt(900000) + 100000);
    }

    private String maskEmail(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex <= 1) return email;
        return email.charAt(0) + "*****" + email.substring(atIndex - 1);
    }

    private UserRole normalizeRole(UserRole role) {
        if (role == null || role == UserRole.USER) {
            return null;
        }
        return role;
    }

    private void validatePhoneNumber(String phone) {
        if (phone.contains("@")) {
            throw new AuthException("Phone number format is invalid");
        }
        String digitsOnly = phone.replaceAll("\\D", "");
        if (digitsOnly.length() < 7 || digitsOnly.length() > 15) {
            throw new AuthException("Phone number format is invalid");
        }
    }
}
