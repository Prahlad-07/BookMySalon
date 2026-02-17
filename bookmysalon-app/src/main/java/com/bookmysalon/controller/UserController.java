/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.dto.response.CurrentUserResponse;
import com.bookmysalon.entity.User;
import com.bookmysalon.repository.UserRepository;
import com.bookmysalon.security.CustomUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;

    @GetMapping("/public/ping")
    public ResponseEntity<ApiResponse<String>> ping() {
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Public endpoint")
                .data("pong")
                .build());
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();

        Set<String> roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        String primaryRole = resolvePrimaryRole(roles);

        String fullName = userRepository.findById(principal.getId())
                .map(User::getFullName)
                .orElse(principal.getUsername());

        CurrentUserResponse response = CurrentUserResponse.builder()
                .id(principal.getId())
                .fullName(fullName)
                .username(principal.getUsername())
                .email(principal.getEmail())
                .roles(roles)
                .role(primaryRole)
                .build();

        return ResponseEntity.ok(ApiResponse.<CurrentUserResponse>builder()
                .success(true)
                .message("Authenticated user details")
                .data(response)
                .build());
    }

    private String resolvePrimaryRole(Set<String> roles) {
        if (roles.contains("ROLE_ADMIN")) {
            return "ADMIN";
        }
        if (roles.contains("ROLE_SALON_OWNER")) {
            return "SALON_OWNER";
        }
        if (roles.contains("ROLE_CUSTOMER") || roles.contains("ROLE_USER")) {
            return "CUSTOMER";
        }
        return "CUSTOMER";
    }
}
