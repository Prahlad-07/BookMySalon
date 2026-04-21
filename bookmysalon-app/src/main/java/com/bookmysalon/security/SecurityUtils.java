package com.bookmysalon.security;

import com.bookmysalon.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static CustomUserPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserPrincipal principal)) {
            throw new UnauthorizedException("User authentication is required");
        }
        return principal;
    }

    public static Long currentUserId() {
        return currentPrincipal().getId();
    }

    public static boolean hasRole(String roleName) {
        String authority = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
                && authentication.getAuthorities().stream().anyMatch(a -> authority.equals(a.getAuthority()));
    }

    public static boolean isAdmin() {
        return hasRole("ADMIN");
    }

    public static boolean isSalonOwner() {
        return hasRole("SALON_OWNER");
    }

    public static boolean isCustomer() {
        return hasRole("CUSTOMER");
    }
}
