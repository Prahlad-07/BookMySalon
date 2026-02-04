package com.example.service;

import com.example.payload.dto.LoginDto;
import com.example.payload.dto.SignupDto;
import com.example.payload.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginDto loginDto);

    AuthResponse signup(SignupDto signupDto);

    AuthResponse getAccessTokenFromRefreshToken(String refreshToken);
}
