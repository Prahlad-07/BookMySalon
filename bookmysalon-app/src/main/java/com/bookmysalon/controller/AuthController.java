package com.bookmysalon.controller;

import com.bookmysalon.dto.SignupDto;
import com.bookmysalon.dto.LoginDto;
import com.bookmysalon.dto.UserDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.dto.response.AuthResponse;
import com.bookmysalon.dto.response.UserInfoResponse;
import com.bookmysalon.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Backend is healthy")
                .data("OK")
                .build());
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserDto>> signup(@RequestBody SignupDto signupDto) {
        try {
            // Validate input
            if (signupDto == null) {
                return ResponseEntity.status(400).body(ApiResponse.<UserDto>builder()
                        .success(false)
                        .message("Signup data is required")
                        .build());
            }

            UserDto userDto = userService.createUser(signupDto);
            return ResponseEntity.ok(ApiResponse.<UserDto>builder()
                    .success(true)
                    .message("User registered successfully")
                    .data(userDto)
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(ApiResponse.<UserDto>builder()
                    .success(false)
                    .message("Validation failed")
                    .error(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<UserDto>builder()
                    .success(false)
                    .message("Registration failed")
                    .error(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginDto loginDto) {
        try {
            // Validate input
            if (loginDto == null || loginDto.getEmail() == null || loginDto.getPassword() == null) {
                return ResponseEntity.status(400).body(ApiResponse.<AuthResponse>builder()
                        .success(false)
                        .message("Email and password are required")
                        .build());
            }

            AuthResponse authResponse = userService.login(loginDto);
            return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                    .success(true)
                    .message("Login successful")
                    .data(authResponse)
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(ApiResponse.<AuthResponse>builder()
                    .success(false)
                    .message("Invalid credentials")
                    .error(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(401).body(ApiResponse.<AuthResponse>builder()
                    .success(false)
                    .message("Login failed")
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<ApiResponse<UserInfoResponse>> getUserInfo(@PathVariable Long id) {
        try {
            UserInfoResponse userInfo = userService.getUserInfo(id);
            return ResponseEntity.ok(ApiResponse.<UserInfoResponse>builder()
                    .success(true)
                    .message("User info retrieved successfully")
                    .data(userInfo)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<UserInfoResponse>builder()
                    .success(false)
                    .message("User not found")
                    .error(e.getMessage())
                    .build());
        }
    }
}
