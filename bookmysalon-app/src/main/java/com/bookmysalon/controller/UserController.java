/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.UserDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.dto.response.CurrentUserResponse;
import com.bookmysalon.entity.Role;
import com.bookmysalon.entity.User;
import com.bookmysalon.entity.UserRole;
import com.bookmysalon.exception.UnauthorizedException;
import com.bookmysalon.repository.UserRepository;
import com.bookmysalon.security.CustomUserPrincipal;
import com.bookmysalon.security.SecurityUtils;
import com.bookmysalon.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;


@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final UserService userService;

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
        CustomUserPrincipal principal = SecurityUtils.currentPrincipal();

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
                .phone(user == null ? "" : user.getPhone())
                .roles(roles)
                .role(primaryRole)
                .build();

        return ResponseEntity.ok(ApiResponse.<CurrentUserResponse>builder()
                .success(true)
                .message("Authenticated user details")
                .data(response)
                .build());
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateCurrentUser(@RequestBody UserDto userDto) {
        UserDto updated = userService.updateUser(SecurityUtils.currentUserId(), userDto);
        return ResponseEntity.ok(ApiResponse.<UserDto>builder()
                .success(true)
                .message("User updated successfully")
                .data(updated)
                .build());
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteCurrentUser() {
        userService.deleteUser(SecurityUtils.currentUserId());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("User deleted successfully")
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUser(@PathVariable Long id) {
        ensureSelfOrAdmin(id);
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.<UserDto>builder()
                .success(true)
                .data(user)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(@PathVariable Long id, @RequestBody UserDto userDto) {
        ensureSelfOrAdmin(id);
        UserDto updated = userService.updateUser(id, userDto);
        return ResponseEntity.ok(ApiResponse.<UserDto>builder()
                .success(true)
                .message("User updated successfully")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        ensureSelfOrAdmin(id);
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("User deleted successfully")
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

    private void ensureSelfOrAdmin(Long userId) {
        if (SecurityUtils.isAdmin() || SecurityUtils.currentUserId().equals(userId)) {
            return;
        }
        throw new UnauthorizedException("You are not allowed to manage this user");
    }
}
