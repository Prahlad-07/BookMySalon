/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-03-02
 */
package com.bookmysalon.security.oauth2;

import com.bookmysalon.entity.RefreshToken;
import com.bookmysalon.entity.Role;
import com.bookmysalon.entity.User;
import com.bookmysalon.entity.UserRole;
import com.bookmysalon.repository.RoleRepository;
import com.bookmysalon.repository.UserRepository;
import com.bookmysalon.security.CustomUserPrincipal;
import com.bookmysalon.security.JwtService;
import com.bookmysalon.dto.response.AuthResponse;
import com.bookmysalon.service.auth.RefreshTokenService;
import com.bookmysalon.service.auth.OAuthLoginCodeService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${app.oauth2.redirect-uri:http://localhost:5173/oauth/callback}")
    private String oauth2RedirectUri;

    @Value("${app.oauth2.failure-uri:http://localhost:5173/login}")
    private String oauth2FailureUri;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final OAuthLoginCodeService oAuthLoginCodeService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        String email = valueAsString(oauthUser.getAttributes().get("email"));
        String fullName = valueAsString(oauthUser.getAttributes().get("name"));

        if (email == null || email.isBlank()) {
            log.error("Google OAuth success did not include email attribute");
            response.sendRedirect(buildFailureRedirect("Google account email is unavailable"));
            return;
        }

        String normalizedEmail = email.trim().toLowerCase();
        String resolvedName = (fullName == null || fullName.isBlank())
                ? normalizedEmail.split("@")[0]
                : fullName.trim();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseGet(() -> createGoogleUser(normalizedEmail, resolvedName));

        ensureCustomerRole(user);
        refreshTokenService.revokeAllUserTokens(user);

        CustomUserPrincipal principal = buildPrincipal(user);
        String accessToken = jwtService.generateAccessToken(principal);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        AuthResponse authResponse = buildAuthResponse(user, accessToken, refreshToken);
        String loginCode = oAuthLoginCodeService.issue(authResponse);

        String redirectUrl = UriComponentsBuilder
                .fromUriString(safeRedirectUri(oauth2RedirectUri, "http://localhost:5173/oauth/callback"))
                .queryParam("code", loginCode)
                .queryParam("oauth", "google")
                .build(true)
                .toUriString();

        response.sendRedirect(redirectUrl);
    }

    private User createGoogleUser(String email, String fullName) {
        String username = uniqueUsernameFromEmail(email);
        Role customerRole = roleRepository.findByName(UserRole.CUSTOMER)
                .orElseGet(() -> roleRepository.save(new Role(null, UserRole.CUSTOMER)));

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setUsername(username);
        user.setRole(UserRole.CUSTOMER);
        user.setRoles(new HashSet<>(Set.of(customerRole)));
        user.setPassword(passwordEncoder.encode(randomPassword()));
        return userRepository.save(user);
    }

    private void ensureCustomerRole(User user) {
        if (user.getRole() == null) {
            user.setRole(UserRole.CUSTOMER);
        }

        if (user.getRoles() == null) {
            user.setRoles(new HashSet<>());
        }

        if (user.getRoles().isEmpty()) {
            Role customerRole = roleRepository.findByName(UserRole.CUSTOMER)
                    .orElseGet(() -> roleRepository.save(new Role(null, UserRole.CUSTOMER)));
            user.getRoles().add(customerRole);
            userRepository.save(user);
        }
    }

    private String uniqueUsernameFromEmail(String email) {
        String base = Optional.ofNullable(email.split("@")[0]).orElse("user")
                .replaceAll("[^a-zA-Z0-9._-]", "")
                .toLowerCase();
        if (base.isBlank()) {
            base = "user";
        }

        String candidate = base;
        while (userRepository.existsByUsernameIgnoreCase(candidate)) {
            candidate = base + "_" + (1000 + SECURE_RANDOM.nextInt(9000));
        }
        return candidate;
    }

    private String randomPassword() {
        return "oauth2_" + System.currentTimeMillis() + "_" + SECURE_RANDOM.nextInt(99999);
    }

    private CustomUserPrincipal buildPrincipal(User user) {
        Set<SimpleGrantedAuthority> authorities = new HashSet<>();

        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            user.getRoles().forEach(role -> authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName().name())));
        } else if (user.getRole() != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        } else {
            authorities.add(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
        }

        return new CustomUserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                authorities
        );
    }

    private String summarizeRoles(User user) {
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            return user.getRoles().stream()
                    .map(role -> normalizeRole(role.getName()))
                    .sorted()
                    .collect(Collectors.joining(","));
        }
        return normalizeRole(user.getRole());
    }

    private String normalizeRole(UserRole role) {
        if (role == null || role == UserRole.USER) {
            return UserRole.CUSTOMER.name();
        }
        return role.name();
    }

    private String valueAsString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String buildFailureRedirect(String message) {
        return UriComponentsBuilder.fromUriString(safeRedirectUri(oauth2FailureUri, "http://localhost:5173/login"))
                .queryParam("error", message)
                .queryParam("oauth", "google")
                .queryParam("timestamp", LocalDateTime.now())
                .build(true)
                .toUriString();
    }

    private String safeRedirectUri(String uriValue, String fallback) {
        String trimmed = uriValue == null ? "" : uriValue.trim();
        try {
            URI uri = URI.create(trimmed);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (scheme == null || host == null) {
                return fallback;
            }

            boolean https = "https".equalsIgnoreCase(scheme);
            boolean localhost = "localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host);
            if (!https && !localhost) {
                return fallback;
            }
            return trimmed;
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, RefreshToken refreshToken) {
        String roleSummary = summarizeRoles(user);
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
                .message("OAuth login successful")
                .build();
    }
}
