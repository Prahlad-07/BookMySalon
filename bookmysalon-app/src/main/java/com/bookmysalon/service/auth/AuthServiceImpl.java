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
import com.bookmysalon.repository.*;
import com.bookmysalon.security.CustomUserPrincipal;
import com.bookmysalon.security.JwtService;
import com.bookmysalon.service.auth.verification.VerificationDeliveryService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.HashSet;
import java.util.Map;
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

    @Value("${app.otp.msg91.enabled:false}")
    private boolean msg91Enabled;

    @Value("${app.otp.msg91.authkey:}")
    private String msg91AuthKey;

    private static final String MSG91_VERIFY_URL = "https://control.msg91.com/api/v5/widget/verifyAccessToken";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SignupVerificationSessionRepository signupVerificationSessionRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final VerificationDeliveryService verificationDeliveryService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Override
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail() == null ? null : request.getEmail().trim().toLowerCase();
        String fullName = request.getFullName() == null ? null : request.getFullName().trim();
        String phone = request.getPhone() == null ? null : request.getPhone().trim();

        if (email == null || email.isBlank()) {
            throw new AuthException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new AuthException("Password is required");
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

        User savedUser = userRepository.save(user);
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
        session.setRequestedRole(request.getRole() == null || request.getRole().isBlank() ? "CUSTOMER" : request.getRole().trim().toUpperCase());

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

        User savedUser = userRepository.save(user);
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

        log.info("Password reset token for {}: {}", user.getEmail(), token.getToken());
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

        String normalized = roleValue.trim().toUpperCase();
        if ("SALON_OWNER".equals(normalized)) {
            return Set.of(UserRole.SALON_OWNER);
        }
        if ("USER".equals(normalized) || "CUSTOMER".equals(normalized)) {
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
        return UserRole.USER;
    }

    private CustomUserPrincipal buildPrincipal(User user) {
        Set<SimpleGrantedAuthority> authorities = new HashSet<>();
        Set<String> roleNames = resolveRoleNames(user);

        roleNames.forEach(roleName -> authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName)));

        return new CustomUserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                authorities
        );
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, RefreshToken refreshToken, String message) {
        String roleSummary = resolveRoleNames(user).stream()
                .map(this::normalizeRole)
                .sorted()
                .collect(Collectors.joining(","));

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
                .role(roleSummary)
                .message(message)
                .build();
    }

    private Set<String> resolveRoleNames(User user) {
        Set<String> roleNames = new HashSet<>();

        if (user.getRoles() != null) {
            user.getRoles().stream()
                    .map(Role::getName)
                    .filter(java.util.Objects::nonNull)
                    .map(Enum::name)
                    .forEach(roleNames::add);
        }

        if (user.getRole() != null) {
            roleNames.add(user.getRole().name());
        }

        if (roleNames.isEmpty() || roleNames.contains(UserRole.USER.name())) {
            roleNames.remove(UserRole.USER.name());
            roleNames.add(UserRole.CUSTOMER.name());
        }

        return roleNames;
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

    private String maskPhone(String phone) {
        if (phone.length() < 4) return "****";
        return "******" + phone.substring(phone.length() - 4);
    }

    private String normalizeRole(UserRole role) {
        if (role == null || role == UserRole.USER) {
            return UserRole.CUSTOMER.name();
        }
        return role.name();
    }

    private String normalizeRole(String roleName) {
        if (roleName == null || roleName.isBlank() || UserRole.USER.name().equals(roleName)) {
            return UserRole.CUSTOMER.name();
        }
        return roleName;
    }

    private boolean isPhoneVerificationValid(VerifySignupOtpRequest request, SignupVerificationSession session) {
        String msg91AccessToken = request.getMsg91AccessToken();
        if (msg91Enabled && msg91AccessToken != null && !msg91AccessToken.isBlank()) {
            return verifyPhoneWithMsg91(msg91AccessToken.trim(), session.getPhone());
        }

        String phoneOtp = request.getPhoneOtp();
        if (phoneOtp == null || phoneOtp.isBlank()) {
            return false;
        }
        return passwordEncoder.matches(phoneOtp.trim(), session.getPhoneOtpHash());
    }

    private boolean verifyPhoneWithMsg91(String accessToken, String sessionPhone) {
        if (msg91AuthKey == null || msg91AuthKey.isBlank()) {
            log.error("MSG91 is enabled but auth key is missing.");
            throw new AuthException("Phone verification provider is not configured");
        }

        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "authkey", msg91AuthKey.trim(),
                    "access-token", accessToken
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(MSG91_VERIFY_URL))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("MSG91 verification failed with status {}", response.statusCode());
                return false;
            }

            JsonNode root = objectMapper.readTree(response.body());
            if (!isMsg91Success(root)) {
                return false;
            }

            String verifiedIdentifier = extractVerifiedIdentifier(root);
            if (verifiedIdentifier == null || verifiedIdentifier.isBlank()) {
                return true;
            }
            return phoneNumbersMatch(sessionPhone, verifiedIdentifier);
        } catch (AuthException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("MSG91 verification request failed", ex);
            return false;
        }
    }

    private boolean isMsg91Success(JsonNode root) {
        String type = root.path("type").asText("");
        if ("success".equalsIgnoreCase(type)) {
            return true;
        }

        String message = root.path("message").asText("");
        if (message.toLowerCase().contains("success") || message.toLowerCase().contains("verified")) {
            return true;
        }

        return root.path("success").asBoolean(false) || root.path("status").asBoolean(false);
    }

    private String extractVerifiedIdentifier(JsonNode root) {
        String[] directKeys = {"mobile", "phone", "identifier", "mobile_number"};
        for (String key : directKeys) {
            String value = root.path(key).asText("");
            if (!value.isBlank()) {
                return value;
            }
        }

        JsonNode data = root.path("data");
        for (String key : directKeys) {
            String value = data.path(key).asText("");
            if (!value.isBlank()) {
                return value;
            }
        }

        return "";
    }

    private boolean phoneNumbersMatch(String expectedPhone, String verifiedPhone) {
        String expected = digitsOnly(expectedPhone);
        String actual = digitsOnly(verifiedPhone);
        if (expected.isBlank() || actual.isBlank()) {
            return false;
        }

        if (expected.equals(actual)) {
            return true;
        }

        if (expected.length() >= 10 && actual.length() >= 10) {
            String expectedLastTen = expected.substring(expected.length() - 10);
            String actualLastTen = actual.substring(actual.length() - 10);
            return expectedLastTen.equals(actualLastTen);
        }

        return false;
    }

    private String digitsOnly(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\D", "");
    }
}
