/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.security;

import com.bookmysalon.entity.Role;
import com.bookmysalon.entity.User;
import com.bookmysalon.entity.UserRole;
import com.bookmysalon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + usernameOrEmail));

        return new CustomUserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                resolveAuthorities(user)
        );
    }

    private Collection<SimpleGrantedAuthority> resolveAuthorities(User user) {
        UserRole effectiveRole = resolveEffectiveRole(user);
        return Set.of(new SimpleGrantedAuthority("ROLE_" + effectiveRole.name()));
    }

    private UserRole resolveEffectiveRole(User user) {
        if (user.getRole() != null && user.getRole() != UserRole.USER) {
            return user.getRole();
        }

        if (user.getRoles() != null) {
            boolean hasAdmin = false;
            boolean hasSalonOwner = false;
            boolean hasCustomer = false;

            for (Role role : user.getRoles()) {
                if (role == null || role.getName() == null || role.getName() == UserRole.USER) {
                    continue;
                }
                if (role.getName() == UserRole.ADMIN) {
                    hasAdmin = true;
                    continue;
                }
                if (role.getName() == UserRole.SALON_OWNER) {
                    hasSalonOwner = true;
                    continue;
                }
                if (role.getName() == UserRole.CUSTOMER) {
                    hasCustomer = true;
                }
            }

            if (hasAdmin) {
                return UserRole.ADMIN;
            }
            if (hasSalonOwner) {
                return UserRole.SALON_OWNER;
            }
            if (hasCustomer) {
                return UserRole.CUSTOMER;
            }
        }

        return UserRole.CUSTOMER;
    }
}
