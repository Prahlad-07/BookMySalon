/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.auth.LoginRequest;
import com.bookmysalon.dto.auth.ForgotPasswordRequest;
import com.bookmysalon.dto.auth.RefreshTokenRequest;
import com.bookmysalon.dto.auth.ResendSignupOtpRequest;
import com.bookmysalon.dto.auth.RegisterRequest;
import com.bookmysalon.dto.auth.ResetPasswordRequest;
import com.bookmysalon.dto.auth.SignupInitiateRequest;
import com.bookmysalon.dto.auth.SignupInitiateResponse;
import com.bookmysalon.dto.auth.VerifySignupOtpRequest;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.dto.response.AuthResponse;
import com.bookmysalon.service.auth.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Backend is healthy")
                .data("OK")
                .build());
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("User registered successfully")
                .data(response)
                .build());
    }

    @PostMapping("/signup/initiate")
    public ResponseEntity<ApiResponse<SignupInitiateResponse>> initiateSignup(@Valid @RequestBody SignupInitiateRequest request) {
        SignupInitiateResponse response = authService.initiateSignup(request);
        return ResponseEntity.ok(ApiResponse.<SignupInitiateResponse>builder()
                .success(true)
                .message("OTP sent to email and phone")
                .data(response)
                .build());
    }

    @PostMapping("/signup/resend-otp")
    public ResponseEntity<ApiResponse<SignupInitiateResponse>> resendSignupOtp(@Valid @RequestBody ResendSignupOtpRequest request) {
        SignupInitiateResponse response = authService.resendSignupOtp(request);
        return ResponseEntity.ok(ApiResponse.<SignupInitiateResponse>builder()
                .success(true)
                .message("OTP resent to email and phone")
                .data(response)
                .build());
    }

    @PostMapping("/signup/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifySignupOtp(@Valid @RequestBody VerifySignupOtpRequest request) {
        AuthResponse response = authService.verifySignupOtp(request);
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Signup verified successfully")
                .data(response)
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Login successful")
                .data(response)
                .build());
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Token refreshed")
                .data(response)
                .build());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("If that email exists, a password reset link has been sent")
                .data("If that email exists, a password reset link has been sent")
                .build());
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Password reset successful")
                .data("Password reset successful")
                .build());
    }
}
