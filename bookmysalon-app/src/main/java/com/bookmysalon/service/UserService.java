package com.bookmysalon.service;

import com.bookmysalon.dto.UserDto;
import com.bookmysalon.dto.SignupDto;
import com.bookmysalon.dto.LoginDto;
import com.bookmysalon.dto.response.AuthResponse;
import com.bookmysalon.dto.response.UserInfoResponse;

public interface UserService {
    UserDto createUser(SignupDto signupDto);
    UserDto getUserById(Long id);
    UserDto getUserByEmail(String email);
    UserDto updateUser(Long id, UserDto userDto);
    void deleteUser(Long id);
    AuthResponse login(LoginDto loginDto);
    UserInfoResponse getUserInfo(Long userId);
}
