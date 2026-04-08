package com.bookmysalon.controller;

import com.bookmysalon.dto.SalonDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.entity.Role;
import com.bookmysalon.entity.User;
import com.bookmysalon.entity.UserRole;
import com.bookmysalon.repository.RoleRepository;
import com.bookmysalon.repository.UserRepository;
import com.bookmysalon.security.CustomUserPrincipal;
import com.bookmysalon.service.SalonService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SalonControllerTest {

    @Mock
    private SalonService salonService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;

    private SalonController salonController;

    @BeforeEach
    void setUp() {
        salonController = new SalonController(salonService, userRepository, roleRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentOwnerSalonsReturnsExistingSalonsAndPromotesRoleWhenNeeded() {
        long userId = 42L;

        CustomUserPrincipal principal = new CustomUserPrincipal(
                userId,
                "owner42",
                "owner42@example.com",
                "secret",
                List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );

        User user = new User();
        user.setId(userId);
        user.setRole(UserRole.CUSTOMER);
        user.setRoles(new HashSet<>());

        SalonDto existingSalon = SalonDto.builder()
                .id(7L)
                .ownerId(userId)
                .name("Existing Salon")
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(salonService.getSalonsByOwnerId(userId)).thenReturn(List.of(existingSalon));
        when(roleRepository.findByName(UserRole.SALON_OWNER)).thenReturn(Optional.of(new Role(11L, UserRole.SALON_OWNER)));

        ResponseEntity<ApiResponse<List<SalonDto>>> response = salonController.getCurrentOwnerSalons();

        assertTrue(response.getStatusCode().is2xxSuccessful());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("Existing Salon", response.getBody().getData().get(0).getName());
        verify(userRepository).save(any(User.class));
    }
}
