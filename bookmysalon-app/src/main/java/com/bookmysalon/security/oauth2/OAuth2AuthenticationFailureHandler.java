/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-03-02
 */
package com.bookmysalon.security.oauth2;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2AuthenticationFailureHandler implements AuthenticationFailureHandler {

    @Value("${app.oauth2.failure-uri:http://localhost:5173/login}")
    private String oauth2FailureUri;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {
        String message = exception == null || exception.getMessage() == null
                ? "Google login failed"
                : exception.getMessage();

        String redirectUrl = UriComponentsBuilder.fromUriString(oauth2FailureUri)
                .queryParam("error", message)
                .queryParam("oauth", "google")
                .build(true)
                .toUriString();

        response.sendRedirect(redirectUrl);
    }
}
