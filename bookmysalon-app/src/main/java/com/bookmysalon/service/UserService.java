/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 */
package com.bookmysalon.service;

import com.bookmysalon.dto.UserDto;

public interface UserService {
    UserDto getUserById(Long id);
    UserDto updateUser(Long id, UserDto userDto);
    void deleteUser(Long id);
    void changePassword(Long id, String currentPassword, String newPassword);
}
