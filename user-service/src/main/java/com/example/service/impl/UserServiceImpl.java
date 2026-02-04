package com.example.service.impl;

import com.example.exception.UserNotFoundException;
import com.example.model.User;
import com.example.payload.dto.KeycloakUserDto;
import com.example.repository.UserRepository;
import com.example.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final KeycloakService keycloakService;

    @Override
    public User createUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public User getUserById(Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            return user.get();
        }
        throw new UserNotFoundException("User not found!");
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public void deleteUser(Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isEmpty()) {
            throw new UserNotFoundException("User not found!");
        }
        userRepository.deleteById(user.get().getId());
    }

    @Override
    public User updateUser(Long id, User user) {
        Optional<User> fetchedUser = userRepository.findById(id);
        if (fetchedUser.isEmpty()) {
            throw new UserNotFoundException("User not found!");
        }
        User existingUser = fetchedUser.get();

        existingUser.setFullName(user.getFullName());
        existingUser.setEmail(user.getEmail());
        existingUser.setRole(user.getRole());
        existingUser.setPhone(user.getPhone());

        return userRepository.save(existingUser);
    }

    @Override
    public User getUserByJwtToken(String jwtToken) {
        KeycloakUserDto userDto = keycloakService.fetchUserByJwtToken(jwtToken);
        return userRepository.findByEmail(userDto.getEmail());
    }
}
