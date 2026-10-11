/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-08-31
 *
 * <p>Stores the in-flight {@link OAuth2AuthorizationRequest} in a short-lived,
 * http-only cookie instead of the HTTP session, so the OAuth2 login handshake
 * works while the rest of the API stays stateless (and survives instance
 * restarts / multiple instances).</p>
 */
package com.bookmysalon.security.oauth2;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;

@Component
@Slf4j
public class HttpCookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    static final String AUTH_REQUEST_COOKIE = "oauth2_auth_request";
    private static final int COOKIE_EXPIRE_SECONDS = 180;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return readCookie(request)
                .map(this::deserialize)
                .orElse(null);
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        if (authorizationRequest == null) {
            removeCookie(response, request);
            return;
        }
        String value = serialize(authorizationRequest);
        Cookie cookie = new Cookie(AUTH_REQUEST_COOKIE, value);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setSecure(isSecure(request));
        cookie.setMaxAge(COOKIE_EXPIRE_SECONDS);
        response.addCookie(cookie);
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                HttpServletResponse response) {
        OAuth2AuthorizationRequest loaded = loadAuthorizationRequest(request);
        removeCookie(response, request);
        return loaded;
    }

    private Optional<Cookie> readCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> AUTH_REQUEST_COOKIE.equals(c.getName()))
                .findFirst();
    }

    private void removeCookie(HttpServletResponse response, HttpServletRequest request) {
        Cookie cookie = new Cookie(AUTH_REQUEST_COOKIE, "");
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setSecure(isSecure(request));
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private boolean isSecure(HttpServletRequest request) {
        return request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
    }

    private String serialize(OAuth2AuthorizationRequest authorizationRequest) {
        try {
            return Base64.getUrlEncoder().encodeToString(
                    objectMapper.writeValueAsBytes(SerializableAuthorizationRequest.from(authorizationRequest)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to serialize OAuth2 authorization request", ex);
        }
    }

    private OAuth2AuthorizationRequest deserialize(Cookie cookie) {
        try {
            byte[] bytes = Base64.getUrlDecoder().decode(cookie.getValue());
            return objectMapper.readValue(bytes, SerializableAuthorizationRequest.class).toAuthorizationRequest();
        } catch (Exception ex) {
            log.warn("Discarding unreadable OAuth2 authorization request cookie");
            return null;
        }
    }

    /**
     * Minimal, JSON-friendly projection of the fields we actually need to
     * complete the authorization-code handshake.
     */
    private record SerializableAuthorizationRequest(
            String authorizationUri,
            String clientId,
            String redirectUri,
            java.util.Set<String> scopes,
            String state,
            java.util.Map<String, Object> additionalParameters,
            java.util.Map<String, Object> attributes,
            String authorizationRequestUri) {

        static SerializableAuthorizationRequest from(OAuth2AuthorizationRequest request) {
            return new SerializableAuthorizationRequest(
                    request.getAuthorizationUri(),
                    request.getClientId(),
                    request.getRedirectUri(),
                    request.getScopes(),
                    request.getState(),
                    request.getAdditionalParameters(),
                    request.getAttributes(),
                    request.getAuthorizationRequestUri());
        }

        OAuth2AuthorizationRequest toAuthorizationRequest() {
            return OAuth2AuthorizationRequest.authorizationCode()
                    .authorizationUri(authorizationUri)
                    .clientId(clientId)
                    .redirectUri(redirectUri)
                    .scopes(scopes)
                    .state(state)
                    .additionalParameters(additionalParameters)
                    .attributes(attributes)
                    .authorizationRequestUri(authorizationRequestUri)
                    .build();
        }
    }
}
