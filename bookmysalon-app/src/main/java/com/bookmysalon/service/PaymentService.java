/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 */
package com.bookmysalon.service;

import com.bookmysalon.dto.PaymentOrderDto;
import com.bookmysalon.dto.response.PaymentLinkResponse;

import java.util.List;

public interface PaymentService {

    /** Whether online payments are configured on this deployment. */
    boolean isEnabled();

    /** Creates (or reuses) a Stripe Checkout Session for a booking the caller owns. */
    PaymentLinkResponse createCheckoutSession(Long bookingId, Long callerUserId);

    PaymentOrderDto getPaymentById(Long id);

    List<PaymentOrderDto> getPaymentsByUserId(Long userId);

    List<PaymentOrderDto> getPaymentsByBookingId(Long bookingId);

    /** Processes a verified Stripe webhook payload. */
    void handleStripeWebhook(String payload, String signatureHeader);
}
