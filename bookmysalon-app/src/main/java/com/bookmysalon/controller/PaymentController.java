/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.PaymentOrderDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.dto.response.PaymentLinkResponse;
import com.bookmysalon.security.SecurityUtils;
import com.bookmysalon.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, Object>>> config() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("enabled", paymentService.isEnabled())));
    }

    @PostMapping("/checkout/{bookingId}")
    public ResponseEntity<ApiResponse<PaymentLinkResponse>> createCheckout(@PathVariable Long bookingId) {
        PaymentLinkResponse link = paymentService.createCheckoutSession(bookingId, SecurityUtils.currentUserId());
        return ResponseEntity.ok(ApiResponse.ok(link, "Checkout session created"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentOrderDto>> getPayment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getPaymentById(id)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<PaymentOrderDto>>> getUserPayments(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getPaymentsByUserId(userId)));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<List<PaymentOrderDto>>> getBookingPayments(@PathVariable Long bookingId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getPaymentsByBookingId(bookingId)));
    }

    /**
     * Stripe calls this directly. It is public (permitAll) but every payload is
     * verified against the webhook signing secret before it is trusted.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> stripeWebhook(@RequestBody String payload,
                                                @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
        paymentService.handleStripeWebhook(payload, signature);
        return ResponseEntity.ok("ok");
    }
}
