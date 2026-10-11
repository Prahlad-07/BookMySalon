/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 */
package com.bookmysalon.service.impl;

import com.bookmysalon.dto.UserDto;
import com.bookmysalon.entity.User;
import com.bookmysalon.exception.ConflictException;
import com.bookmysalon.exception.UserNotFoundException;
import com.bookmysalon.repository.PasswordResetTokenRepository;
import com.bookmysalon.repository.RefreshTokenRepository;
import com.bookmysalon.repository.SalonRepository;
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
    private final SalonRepository salonRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
        return mapToDto(user);
    }

    @Override
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

        if (userDto.getFullName() != null) {
            String normalizedName = userDto.getFullName().trim();
            if (normalizedName.isEmpty()) {
                throw new IllegalArgumentException("Name cannot be empty");
            }
            if (normalizedName.length() > 120) {
                throw new IllegalArgumentException("Name must be 120 characters or fewer");
            }
            user.setFullName(normalizedName);
        }
        if (userDto.getPhone() != null) {
            String normalizedPhone = userDto.getPhone().trim();
            if (!normalizedPhone.isBlank()) {
                String digitsOnly = normalizedPhone.replaceAll("\\D", "");
                if (digitsOnly.length() < 7 || digitsOnly.length() > 15) {
                    throw new IllegalArgumentException("Phone number format is invalid");
                }
            }
            user.setPhone(normalizedPhone.isBlank() ? null : normalizedPhone);
        }

        return mapToDto(userRepository.save(user));
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

        if (salonRepository.existsByOwnerId(id)) {
            throw new ConflictException(
                    "Delete or transfer your salon profile before closing your account.");
        }

        passwordResetTokenRepository.deleteByUser(user);
        refreshTokenRepository.deleteByUserId(id);
        userRepository.delete(user);
    }

    @Override
    public void changePassword(Long id, String currentPassword, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
        if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Your current password is incorrect");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters");
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("Choose a password you haven't used here before");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        // Sign out every other session; the caller re-authenticates with the new password.
        refreshTokenRepository.revokeAllForUser(id);
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
