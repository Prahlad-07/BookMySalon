/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.PaymentOrderDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.dto.response.PaymentLinkResponse;
import com.bookmysalon.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/{bookingId}/{userId}")
    public ResponseEntity<ApiResponse<PaymentLinkResponse>> createPaymentLink(@PathVariable Long bookingId, @PathVariable Long userId) {
        try {
            PaymentLinkResponse paymentLink = paymentService.createPaymentLink(bookingId, userId);
            return ResponseEntity.ok(ApiResponse.<PaymentLinkResponse>builder()
                    .success(true)
                    .message("Payment link created successfully")
                    .data(paymentLink)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<PaymentLinkResponse>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentOrderDto>> getPayment(@PathVariable Long id) {
        try {
            PaymentOrderDto payment = paymentService.getPaymentById(id);
            return ResponseEntity.ok(ApiResponse.<PaymentOrderDto>builder()
                    .success(true)
                    .data(payment)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<PaymentOrderDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<PaymentOrderDto>>> getUserPayments(@PathVariable Long userId) {
        try {
            List<PaymentOrderDto> payments = paymentService.getPaymentsByUserId(userId);
            return ResponseEntity.ok(ApiResponse.<List<PaymentOrderDto>>builder()
                    .success(true)
                    .data(payments)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<PaymentOrderDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<List<PaymentOrderDto>>> getBookingPayments(@PathVariable Long bookingId) {
        try {
            List<PaymentOrderDto> payments = paymentService.getPaymentsByBookingId(bookingId);
            return ResponseEntity.ok(ApiResponse.<List<PaymentOrderDto>>builder()
                    .success(true)
                    .data(payments)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<PaymentOrderDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/success/{paymentLinkId}")
    public ResponseEntity<ApiResponse<Void>> handlePaymentSuccess(@PathVariable String paymentLinkId) {
        try {
            paymentService.handlePaymentSuccess(paymentLinkId);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Payment completed successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<Void>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/failure/{paymentLinkId}")
    public ResponseEntity<ApiResponse<Void>> handlePaymentFailure(@PathVariable String paymentLinkId) {
        try {
            paymentService.handlePaymentFailure(paymentLinkId);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Payment failed")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<Void>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }
}
