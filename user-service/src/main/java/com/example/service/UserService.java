package com.example.service;

import com.example.model.User;

import java.util.List;

public interface UserService {
    User createUser(User user);

    User getUserById(Long id);

    List<User> getAllUsers();

    void deleteUser(Long id);

    User updateUser(Long id, User user);

    User getUserByJwtToken(String jwtToken);
}
