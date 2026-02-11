package com.bookmysalon.controller;

import com.bookmysalon.dto.BookingDto;
import com.bookmysalon.dto.BookingRequestDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/{userId}")
    public ResponseEntity<ApiResponse<BookingDto>> createBooking(@PathVariable Long userId, @RequestBody BookingRequestDto bookingRequestDto) {
        try {
            BookingDto booking = bookingService.createBooking(bookingRequestDto, userId);
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
}
