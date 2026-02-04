package com.example.controller;

import com.example.payload.dto.LoginDto;
import com.example.payload.dto.SignupDto;
import com.example.payload.response.ApiResponseBody;
import com.example.payload.response.AuthResponse;
import com.example.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponseBody<AuthResponse>> handleSignup(
            @RequestBody SignupDto signupDto
            ) {
        signupDto.setEmail(signupDto.getEmail().toLowerCase());
        AuthResponse response = authService.signup(signupDto);
        return new ResponseEntity<>(new ApiResponseBody<>(
                true,
                "User created",
                response
        ), HttpStatus.OK);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponseBody<AuthResponse>> handleLogin(
            @RequestBody LoginDto loginDto
    ) {
        loginDto.setEmail(loginDto.getEmail().toLowerCase());
        AuthResponse response = authService.login(loginDto);
        return new ResponseEntity<>(new ApiResponseBody<>(
                true,
                "User logged in",
                response
        ), HttpStatus.OK);
    }

    @GetMapping("/access-token/refresh-token/{refreshToken}")
    public ResponseEntity<ApiResponseBody<AuthResponse>> getAccessToken(
            @PathVariable("refreshToken") String refreshToken
    ) {
        AuthResponse response = authService.getAccessTokenFromRefreshToken(refreshToken);
        return new ResponseEntity<>(new ApiResponseBody<>(
                true,
                "refresh token received successfully",
                response
        ), HttpStatus.OK);
    }
}
