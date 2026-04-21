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
import com.bookmysalon.security.SecurityUtils;
import com.bookmysalon.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final SalonRepository salonRepository;

    @PostMapping("/me")
    public ResponseEntity<ApiResponse<BookingDto>> createMyBooking(@RequestBody BookingRequestDto bookingRequestDto) {
        try {
            if (!SecurityUtils.isCustomer() && !SecurityUtils.isAdmin()) {
                return forbidden("Only customers can create bookings");
            }
            Long currentUserId = SecurityUtils.currentUserId();
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

    @PostMapping("/{userId}")
    public ResponseEntity<ApiResponse<BookingDto>> createBooking(@PathVariable Long userId, @RequestBody BookingRequestDto bookingRequestDto) {
        try {
            Long currentUserId = SecurityUtils.currentUserId();
            Long targetUserId = currentUserId;
            if (isAdmin() && userId != null && userId > 0) {
                targetUserId = userId;
            } else if (!SecurityUtils.isCustomer()) {
                return forbidden("Only customers can create bookings");
            }
            BookingDto booking = bookingService.createBooking(bookingRequestDto, targetUserId);
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
            if (!SecurityUtils.currentUserId().equals(userId) && !isAdmin()) {
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
                if (salon == null || !SecurityUtils.currentUserId().equals(salon.getOwnerId())) {
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
            if (bookingDto == null) {
                throw new IllegalArgumentException("Booking update data cannot be null");
            }
            BookingDto existing = bookingService.getBookingById(id);
            boolean ownerOrAdmin = canManageSalonBooking(existing) || isAdmin();
            boolean customer = existing.getCustomerId() != null && existing.getCustomerId().equals(SecurityUtils.currentUserId());

            if (!customer && !ownerOrAdmin) {
                return forbidden("You are not allowed to update this booking");
            }

            BookingDto safeUpdate = bookingDto;
            if (!ownerOrAdmin) {
                safeUpdate = BookingDto.builder()
                        .startTime(bookingDto.getStartTime())
                        .endTime(bookingDto.getEndTime())
                        .build();
            }

            BookingDto updatedBooking = bookingService.updateBooking(id, safeUpdate);
            return ResponseEntity.ok(ApiResponse.<BookingDto>builder()
                    .success(true)
                    .message("Booking updated successfully")
                    .data(updatedBooking)
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.<BookingDto>builder()
                    .success(false)
                    .error(e.getMessage())
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

    private boolean isAdmin() {
        return SecurityUtils.isAdmin();
    }

    private boolean canAccessBooking(BookingDto booking) {
        Long currentUserId = SecurityUtils.currentUserId();
        if (booking.getCustomerId() != null && booking.getCustomerId().equals(currentUserId)) {
            return true;
        }
        return canManageSalonBooking(booking);
    }

    private boolean canManageSalonBooking(BookingDto booking) {
        Salon salon = salonRepository.findById(booking.getSalonId()).orElse(null);
        return salon != null && salon.getOwnerId() != null && salon.getOwnerId().equals(SecurityUtils.currentUserId());
    }

    private <T> ResponseEntity<ApiResponse<T>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.<T>builder()
                .success(false)
                .error(message)
                .build());
    }
}
