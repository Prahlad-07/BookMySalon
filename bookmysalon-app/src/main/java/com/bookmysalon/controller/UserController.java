/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.dto.response.CurrentUserResponse;
import com.bookmysalon.entity.Role;
import com.bookmysalon.entity.User;
import com.bookmysalon.entity.UserRole;
import com.bookmysalon.repository.UserRepository;
import com.bookmysalon.security.CustomUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

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

        User user = userRepository.findById(principal.getId()).orElse(null);
        String primaryRole = resolvePrimaryRole(user);
        Set<String> roles = Set.of("ROLE_" + primaryRole);

        String fullName = user != null && user.getFullName() != null && !user.getFullName().isBlank()
                ? user.getFullName()
                : principal.getUsername();

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

    private String resolvePrimaryRole(User user) {
        if (user == null) {
            return UserRole.CUSTOMER.name();
        }

        if (user.getRole() != null && user.getRole() != UserRole.USER) {
            return user.getRole().name();
        }

        if (user.getRoles() != null) {
            boolean hasAdmin = false;
            boolean hasSalonOwner = false;
            boolean hasCustomer = false;

            for (Role role : user.getRoles()) {
                if (role == null || role.getName() == null || role.getName() == UserRole.USER) {
                    continue;
                }
                if (role.getName() == UserRole.ADMIN) {
                    hasAdmin = true;
                    continue;
                }
                if (role.getName() == UserRole.SALON_OWNER) {
                    hasSalonOwner = true;
                    continue;
                }
                if (role.getName() == UserRole.CUSTOMER) {
                    hasCustomer = true;
                }
            }

            if (hasAdmin) {
                return UserRole.ADMIN.name();
            }
            if (hasSalonOwner) {
                return UserRole.SALON_OWNER.name();
            }
            if (hasCustomer) {
                return UserRole.CUSTOMER.name();
            }
        }

        return UserRole.CUSTOMER.name();
    }
}
