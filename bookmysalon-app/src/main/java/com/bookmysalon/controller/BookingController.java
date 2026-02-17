/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.BookingDto;
import com.bookmysalon.dto.BookingRequestDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.security.CustomUserPrincipal;
import com.bookmysalon.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final SalonRepository salonRepository;

    @PostMapping("/{userId}")
    public ResponseEntity<ApiResponse<BookingDto>> createBooking(@PathVariable Long userId, @RequestBody BookingRequestDto bookingRequestDto) {
        try {
            Long currentUserId = currentUserId();
            if (!currentUserId.equals(userId) && !isAdmin()) {
                return forbidden("You are not allowed to create booking for another user");
            }
            BookingDto booking = bookingService.createBooking(bookingRequestDto, currentUserId);
            return ResponseEntity.ok(ApiResponse.<BookingDto>builder()
                    .success(true)
                    .message("Booking created successfully")
                    .data(booking)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<BookingDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingDto>> getBooking(@PathVariable Long id) {
        try {
            BookingDto booking = bookingService.getBookingById(id);
            if (!canAccessBooking(booking) && !isAdmin()) {
                return forbidden("You are not allowed to view this booking");
            }
            return ResponseEntity.ok(ApiResponse.<BookingDto>builder()
                    .success(true)
                    .data(booking)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<BookingDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingDto>>> getAllBookings() {
        try {
            if (!isAdmin()) {
                return forbidden("Only admin can view all bookings");
            }
            List<BookingDto> bookings = bookingService.getAllBookings();
            return ResponseEntity.ok(ApiResponse.<List<BookingDto>>builder()
                    .success(true)
                    .data(bookings)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<BookingDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getUserBookings(@PathVariable Long userId) {
        try {
            if (!currentUserId().equals(userId) && !isAdmin()) {
                return forbidden("You are not allowed to view this user's bookings");
            }
            List<BookingDto> bookings = bookingService.getBookingsByCustomerId(userId);
            return ResponseEntity.ok(ApiResponse.<List<BookingDto>>builder()
                    .success(true)
                    .data(bookings)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<BookingDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getSalonBookings(@PathVariable Long salonId) {
        try {
            if (!isAdmin()) {
                Salon salon = salonRepository.findById(salonId).orElse(null);
                if (salon == null || !currentUserId().equals(salon.getOwnerId())) {
                    return forbidden("You are not allowed to view bookings for this salon");
                }
            }
            List<BookingDto> bookings = bookingService.getBookingsBySalonId(salonId);
            return ResponseEntity.ok(ApiResponse.<List<BookingDto>>builder()
                    .success(true)
                    .data(bookings)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<BookingDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingDto>> updateBooking(@PathVariable Long id, @RequestBody BookingDto bookingDto) {
        try {
            BookingDto existing = bookingService.getBookingById(id);
            if (!canAccessBooking(existing) && !isAdmin()) {
                return forbidden("You are not allowed to update this booking");
            }
            BookingDto updatedBooking = bookingService.updateBooking(id, bookingDto);
            return ResponseEntity.ok(ApiResponse.<BookingDto>builder()
                    .success(true)
                    .message("Booking updated successfully")
                    .data(updatedBooking)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<BookingDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(@PathVariable Long id) {
        try {
            BookingDto existing = bookingService.getBookingById(id);
            if (!canAccessBooking(existing) && !isAdmin()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.<Void>builder()
                        .success(false)
                        .error("You are not allowed to cancel this booking")
                        .build());
            }
            bookingService.cancelBooking(id);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Booking cancelled successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<Void>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return principal.getId();
    }

    private boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private boolean canAccessBooking(BookingDto booking) {
        Long currentUserId = currentUserId();
        if (booking.getCustomerId() != null && booking.getCustomerId().equals(currentUserId)) {
            return true;
        }
        Salon salon = salonRepository.findById(booking.getSalonId()).orElse(null);
        return salon != null && salon.getOwnerId() != null && salon.getOwnerId().equals(currentUserId);
    }

    private <T> ResponseEntity<ApiResponse<T>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.<T>builder()
                .success(false)
                .error(message)
                .build());
    }
}
