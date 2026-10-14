/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-14
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.BookingDto;
import com.bookmysalon.dto.BookingRequestDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.exception.UnauthorizedException;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.security.SecurityUtils;
import com.bookmysalon.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<ApiResponse<BookingDto>> createMyBooking(@Valid @RequestBody BookingRequestDto bookingRequestDto) {
        if (!SecurityUtils.isCustomer() && !SecurityUtils.isAdmin()) {
            throw new UnauthorizedException("Only customers can create bookings");
        }
        BookingDto booking = bookingService.createBooking(bookingRequestDto, SecurityUtils.currentUserId());
        return ResponseEntity.ok(ApiResponse.ok(booking, "Booking created successfully"));
    }

    @PostMapping("/{userId}")
    public ResponseEntity<ApiResponse<BookingDto>> createBooking(@PathVariable Long userId,
                                                                @Valid @RequestBody BookingRequestDto bookingRequestDto) {
        Long targetUserId = SecurityUtils.currentUserId();
        if (SecurityUtils.isAdmin() && userId != null && userId > 0) {
            targetUserId = userId;
        } else if (!SecurityUtils.isCustomer()) {
            throw new UnauthorizedException("Only customers can create bookings");
        }
        BookingDto booking = bookingService.createBooking(bookingRequestDto, targetUserId);
        return ResponseEntity.ok(ApiResponse.ok(booking, "Booking created successfully"));
    }

    /**
     * Public: which intervals of a salon's day are already taken, so the booking UI can
     * grey them out instead of failing on submit. Times only — no customer details.
     */
    @GetMapping("/salon/{salonId}/busy")
    public ResponseEntity<ApiResponse<java.util.List<com.bookmysalon.dto.BusySlotDto>>> busySlots(
            @PathVariable Long salonId,
            @RequestParam("date") @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        var busy = bookingService.getBusySlots(salonId, date);
        return ResponseEntity.ok(ApiResponse.ok(busy));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingDto>> getBooking(@PathVariable Long id) {
        BookingDto booking = bookingService.getBookingById(id);
        if (!canAccessBooking(booking) && !SecurityUtils.isAdmin()) {
            throw new UnauthorizedException("You are not allowed to view this booking");
        }
        return ResponseEntity.ok(ApiResponse.ok(booking));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingDto>>> getAllBookings() {
        if (!SecurityUtils.isAdmin()) {
            throw new UnauthorizedException("Only admin can view all bookings");
        }
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getAllBookings()));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getUserBookings(@PathVariable Long userId) {
        if (!SecurityUtils.currentUserId().equals(userId) && !SecurityUtils.isAdmin()) {
            throw new UnauthorizedException("You are not allowed to view this user's bookings");
        }
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getBookingsByCustomerId(userId)));
    }

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getSalonBookings(@PathVariable Long salonId) {
        if (!SecurityUtils.isAdmin()) {
            Salon salon = salonRepository.findById(salonId).orElse(null);
            if (salon == null || !SecurityUtils.currentUserId().equals(salon.getOwnerId())) {
                throw new UnauthorizedException("You are not allowed to view bookings for this salon");
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getBookingsBySalonId(salonId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingDto>> updateBooking(@PathVariable Long id, @RequestBody BookingDto bookingDto) {
        if (bookingDto == null) {
            throw new IllegalArgumentException("Booking update data cannot be null");
        }
        BookingDto existing = bookingService.getBookingById(id);
        boolean ownerOrAdmin = canManageSalonBooking(existing) || SecurityUtils.isAdmin();
        boolean customer = existing.getCustomerId() != null
                && existing.getCustomerId().equals(SecurityUtils.currentUserId());

        if (!customer && !ownerOrAdmin) {
            throw new UnauthorizedException("You are not allowed to update this booking");
        }

        BookingDto safeUpdate = bookingDto;
        if (!ownerOrAdmin) {
            // Customers may only reschedule, never change status or price.
            safeUpdate = BookingDto.builder()
                    .startTime(bookingDto.getStartTime())
                    .endTime(bookingDto.getEndTime())
                    .build();
        }

        BookingDto updatedBooking = bookingService.updateBooking(id, safeUpdate);
        return ResponseEntity.ok(ApiResponse.ok(updatedBooking, "Booking updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(@PathVariable Long id) {
        BookingDto existing = bookingService.getBookingById(id);
        if (!canAccessBooking(existing) && !SecurityUtils.isAdmin()) {
            throw new UnauthorizedException("You are not allowed to cancel this booking");
        }
        bookingService.cancelBooking(id);
        return ResponseEntity.ok(ApiResponse.message("Booking cancelled successfully"));
    }

    private boolean canAccessBooking(BookingDto booking) {
        Long currentUserId = SecurityUtils.currentUserId();
        if (booking.getCustomerId() != null && booking.getCustomerId().equals(currentUserId)) {
            return true;
        }
        return canManageSalonBooking(booking);
    }

    private boolean canManageSalonBooking(BookingDto booking) {
        if (booking.getSalonId() == null) {
            return false;
        }
        Salon salon = salonRepository.findById(booking.getSalonId()).orElse(null);
        return salon != null && salon.getOwnerId() != null
                && salon.getOwnerId().equals(SecurityUtils.currentUserId());
    }
}
