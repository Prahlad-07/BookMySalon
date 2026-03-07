/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-03-05
 */
package com.bookmysalon.config;

import com.bookmysalon.entity.Role;
import com.bookmysalon.entity.User;
import com.bookmysalon.entity.UserRole;
import com.bookmysalon.repository.RoleRepository;
import com.bookmysalon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DemoUserSeeder implements CommandLineRunner {

    @Value("${app.demo.seed-users:false}")
    private boolean seedUsers;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!seedUsers) {
            return;
        }

        upsertDemoUser(
                "Customer Test",
                "customer.test@gmail.com",
                "testcustomer",
                "Test@12345",
                UserRole.CUSTOMER
        );

        upsertDemoUser(
                "Owner Test",
                "owner.test@gmail.com",
                "testowner",
                "Test@12345",
                UserRole.SALON_OWNER
        );

        log.info("Demo users are ready: customer.test@gmail.com and owner.test@gmail.com");
    }

    private void upsertDemoUser(String fullName, String email, String username, String rawPassword, UserRole roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(null, roleName)));

        Optional<User> byEmail = userRepository.findByEmailIgnoreCase(email);
        Optional<User> byUsername = userRepository.findByUsernameIgnoreCase(username);
        User user = byEmail.or(() -> byUsername).orElseGet(User::new);
        user.setFullName(fullName);
        user.setEmail(email.toLowerCase());
        user.setUsername(username);
        user.setPhone(null);
        user.setRole(roleName);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRoles(new HashSet<>(Set.of(role)));

        userRepository.save(user);
    }
}
