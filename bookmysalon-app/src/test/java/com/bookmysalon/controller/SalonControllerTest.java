package com.bookmysalon.controller;

import com.bookmysalon.dto.SalonDto;
import com.bookmysalon.dto.response.ApiResponse;
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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SalonControllerTest {

    @Mock
    private SalonService salonService;

    private SalonController salonController;

    @BeforeEach
    void setUp() {
        salonController = new SalonController(salonService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentOwnerSalonsReturnsExistingSalonsForSalonOwner() {
        long userId = 42L;

        CustomUserPrincipal principal = new CustomUserPrincipal(
                userId,
                "owner42",
                "owner42@example.com",
                "secret",
                List.of(new SimpleGrantedAuthority("ROLE_SALON_OWNER"))
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );

        SalonDto existingSalon = SalonDto.builder()
                .id(7L)
                .ownerId(userId)
                .name("Existing Salon")
                .build();

        when(salonService.getSalonsByOwnerId(userId)).thenReturn(List.of(existingSalon));

        ResponseEntity<ApiResponse<List<SalonDto>>> response = salonController.getCurrentOwnerSalons();

        assertTrue(response.getStatusCode().is2xxSuccessful());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("Existing Salon", response.getBody().getData().get(0).getName());
        verify(salonService).getSalonsByOwnerId(userId);
    }

    @Test
    void getCurrentOwnerSalonsRejectsCustomerRole() {
        long userId = 42L;

        CustomUserPrincipal principal = new CustomUserPrincipal(
                userId,
                "customer42",
                "customer42@example.com",
                "secret",
                List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );

        ResponseEntity<ApiResponse<List<SalonDto>>> response = salonController.getCurrentOwnerSalons();

        assertEquals(403, response.getStatusCode().value());
        verify(salonService, never()).getSalonsByOwnerId(userId);
    }
}
