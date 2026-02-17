/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
package com.bookmysalon.service.auth;

import com.bookmysalon.dto.auth.LoginRequest;
import com.bookmysalon.dto.auth.ForgotPasswordRequest;
import com.bookmysalon.dto.auth.RefreshTokenRequest;
import com.bookmysalon.dto.auth.ResendSignupOtpRequest;
import com.bookmysalon.dto.auth.RegisterRequest;
import com.bookmysalon.dto.auth.ResetPasswordRequest;
import com.bookmysalon.dto.auth.SignupInitiateRequest;
import com.bookmysalon.dto.auth.SignupInitiateResponse;
import com.bookmysalon.dto.auth.VerifySignupOtpRequest;
import com.bookmysalon.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(RefreshTokenRequest request);
    SignupInitiateResponse initiateSignup(SignupInitiateRequest request);
    SignupInitiateResponse resendSignupOtp(ResendSignupOtpRequest request);
    AuthResponse verifySignupOtp(VerifySignupOtpRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
