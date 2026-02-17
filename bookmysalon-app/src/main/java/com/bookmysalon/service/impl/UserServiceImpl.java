/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.service.impl;

import com.bookmysalon.dto.UserDto;
import com.bookmysalon.dto.SignupDto;
import com.bookmysalon.dto.LoginDto;
import com.bookmysalon.dto.response.AuthResponse;
import com.bookmysalon.dto.response.UserInfoResponse;
import com.bookmysalon.entity.User;
import com.bookmysalon.entity.UserRole;
import com.bookmysalon.exception.UserNotFoundException;
import com.bookmysalon.repository.UserRepository;
import com.bookmysalon.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDto createUser(SignupDto signupDto) {
        if (signupDto == null) {
            throw new IllegalArgumentException("Signup data cannot be null");
        }

        String normalizedEmail = signupDto.getEmail() == null ? null : signupDto.getEmail().trim().toLowerCase();
        String normalizedName = signupDto.getName() == null ? null : signupDto.getName().trim();
        String normalizedPhone = signupDto.getPhone() == null ? null : signupDto.getPhone().trim();
        String password = signupDto.getPassword();
        UserRole role = signupDto.getRole() == null ? UserRole.CUSTOMER : signupDto.getRole();

        if (normalizedEmail == null || normalizedEmail.isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }
        if (normalizedName == null || normalizedName.isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        
        if (userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("User with this email already exists");
        }

        User user = new User();
        user.setFullName(normalizedName);
        user.setUsername(normalizedEmail.split("@")[0]);
        user.setEmail(normalizedEmail);
        user.setPhone(normalizedPhone);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(password));

        User savedUser = userRepository.save(user);
        return mapToDto(savedUser);
    }

    @Override
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
        return mapToDto(user);
    }

    @Override
    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
        return mapToDto(user);
    }

    @Override
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
        
        if (userDto.getFullName() != null) user.setFullName(userDto.getFullName());
        if (userDto.getPhone() != null) user.setPhone(userDto.getPhone());

        User updatedUser = userRepository.save(user);
        return mapToDto(updatedUser);
    }

    @Override
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    @Override
    public AuthResponse login(LoginDto loginDto) {
        if (loginDto == null) {
            throw new IllegalArgumentException("Login data cannot be null");
        }
        if (loginDto.getEmail() == null || loginDto.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (loginDto.getPassword() == null || loginDto.getPassword().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        String normalizedEmail = loginDto.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        
        if (!passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return AuthResponse.builder()
                .id(user.getId())
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole() == UserRole.USER ? UserRole.CUSTOMER.name() : user.getRole().toString())
                .token("jwt-token-" + user.getId())
                .message("Login successful")
                .build();
    }

    @Override
    public UserInfoResponse getUserInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        
        return UserInfoResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
