/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 *
 * <p>Stripe Checkout integration. The client only ever receives a hosted
 * checkout URL; payment state is confirmed exclusively through the
 * signature-verified webhook, never by a client callback.</p>
 */
package com.bookmysalon.service.impl;

import com.bookmysalon.dto.PaymentOrderDto;
import com.bookmysalon.dto.response.PaymentLinkResponse;
import com.bookmysalon.entity.Booking;
import com.bookmysalon.entity.BookingStatus;
import com.bookmysalon.entity.PaymentOrder;
import com.bookmysalon.entity.PaymentStatus;
import com.bookmysalon.exception.ConflictException;
import com.bookmysalon.exception.PaymentProcessingException;
import com.bookmysalon.exception.ResourceNotFoundException;
import com.bookmysalon.exception.ServiceUnavailableException;
import com.bookmysalon.exception.UnauthorizedException;
import com.bookmysalon.repository.BookingRepository;
import com.bookmysalon.repository.PaymentOrderRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.security.SecurityUtils;
import com.bookmysalon.service.PaymentService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentOrderRepository paymentOrderRepository;
    private final BookingRepository bookingRepository;
    private final SalonRepository salonRepository;

    private final String stripeApiKey;
    private final String webhookSecret;
    private final String successUrl;
    private final String cancelUrl;
    private final String currency;

    public PaymentServiceImpl(PaymentOrderRepository paymentOrderRepository,
                              BookingRepository bookingRepository,
                              SalonRepository salonRepository,
                              @Value("${stripe.api.key:}") String stripeApiKey,
                              @Value("${stripe.webhook.secret:}") String webhookSecret,
                              @Value("${stripe.success-url:http://localhost:3000/payment/success}") String successUrl,
                              @Value("${stripe.cancel-url:http://localhost:3000/payment/cancel}") String cancelUrl,
                              @Value("${stripe.currency:inr}") String currency) {
        this.paymentOrderRepository = paymentOrderRepository;
        this.bookingRepository = bookingRepository;
        this.salonRepository = salonRepository;
        this.stripeApiKey = stripeApiKey == null ? "" : stripeApiKey.trim();
        this.webhookSecret = webhookSecret == null ? "" : webhookSecret.trim();
        this.successUrl = successUrl;
        this.cancelUrl = cancelUrl;
        this.currency = (currency == null || currency.isBlank()) ? "inr" : currency.trim().toLowerCase();
    }

    @Override
    public boolean isEnabled() {
        return !stripeApiKey.isEmpty();
    }

    @Override
    public PaymentLinkResponse createCheckoutSession(Long bookingId, Long callerUserId) {
        if (!isEnabled()) {
            throw new ServiceUnavailableException("Online payments are not enabled on this deployment");
        }
        if (bookingId == null || bookingId <= 0) {
            throw new IllegalArgumentException("A valid booking id is required");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (!booking.getCustomerId().equals(callerUserId) && !SecurityUtils.isAdmin()) {
            throw new UnauthorizedException("You can only pay for your own bookings");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException("This booking has been cancelled and cannot be paid");
        }
        if (booking.getTotalPrice() == null || booking.getTotalPrice() <= 0) {
            throw new ConflictException("This booking has no payable amount");
        }
        if (paymentOrderRepository.existsByBookingIdAndStatus(bookingId, PaymentStatus.COMPLETED)) {
            throw new ConflictException("This booking has already been paid");
        }

        PaymentOrder order = paymentOrderRepository
                .findFirstByBookingIdAndStatusOrderByCreatedAtDesc(bookingId, PaymentStatus.PENDING)
                .orElseGet(PaymentOrder::new);
        order.setUserId(booking.getCustomerId());
        order.setBookingId(bookingId);
        order.setAmount(booking.getTotalPrice());
        order.setCurrency(currency);
        order.setStatus(PaymentStatus.PENDING);
        order = paymentOrderRepository.save(order);

        long amountMinor = Math.round(booking.getTotalPrice() * 100.0);

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(appendParam(successUrl, "session_id={CHECKOUT_SESSION_ID}"))
                .setCancelUrl(appendParam(cancelUrl, "bookingId=" + bookingId))
                .setClientReferenceId(String.valueOf(bookingId))
                .putMetadata("bookingId", String.valueOf(bookingId))
                .putMetadata("paymentOrderId", String.valueOf(order.getId()))
                .putMetadata("userId", String.valueOf(booking.getCustomerId()))
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(currency)
                                .setUnitAmount(amountMinor)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("BookMySalon booking #" + bookingId)
                                        .build())
                                .build())
                        .build())
                .build();

        try {
            RequestOptions options = RequestOptions.builder().setApiKey(stripeApiKey).build();
            Session session = Session.create(params, options);
            order.setPaymentLinkId(session.getId());
            paymentOrderRepository.save(order);

            return PaymentLinkResponse.builder()
                    .paymentLink(session.getUrl())
                    .paymentLinkId(session.getId())
                    .bookingId(bookingId)
                    .build();
        } catch (StripeException ex) {
            log.error("Stripe checkout session creation failed for booking {}", bookingId, ex);
            throw new PaymentProcessingException("Could not start checkout. Please try again.", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentOrderDto getPaymentById(Long id) {
        PaymentOrder order = paymentOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
        ensureCanViewPayment(order.getUserId(), order.getBookingId());
        return mapToDto(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentOrderDto> getPaymentsByUserId(Long userId) {
        if (!SecurityUtils.isAdmin() && !SecurityUtils.currentUserId().equals(userId)) {
            throw new UnauthorizedException("You are not allowed to view these payments");
        }
        return paymentOrderRepository.findByUserId(userId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentOrderDto> getPaymentsByBookingId(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));
        ensureCanViewPayment(booking.getCustomerId(), bookingId);
        return paymentOrderRepository.findByBookingId(bookingId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public void handleStripeWebhook(String payload, String signatureHeader) {
        if (webhookSecret.isEmpty()) {
            log.error("Received a Stripe webhook but stripe.webhook.secret is not configured");
            throw new ServiceUnavailableException("Payment webhooks are not configured");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, webhookSecret);
        } catch (SignatureVerificationException ex) {
            log.warn("Rejected Stripe webhook with invalid signature");
            throw new UnauthorizedException("Invalid webhook signature");
        }

        switch (event.getType()) {
            case "checkout.session.completed" -> onCheckoutCompleted(extractSession(event));
            case "checkout.session.expired", "checkout.session.async_payment_failed" ->
                    onCheckoutFailed(extractSession(event));
            default -> log.debug("Ignoring unhandled Stripe event type {}", event.getType());
        }
    }

    private void onCheckoutCompleted(Session session) {
        if (session == null) {
            return;
        }
        PaymentOrder order = resolveOrder(session);
        if (order == null) {
            log.warn("checkout.session.completed for unknown order (session {})", session.getId());
            return;
        }
        if (order.getStatus() == PaymentStatus.COMPLETED) {
            return; // idempotent
        }

        order.setStatus(PaymentStatus.COMPLETED);
        order.setPaidAt(LocalDateTime.now());
        order.setPaymentLinkId(session.getId());
        paymentOrderRepository.save(order);

        bookingRepository.findById(order.getBookingId()).ifPresent(booking -> {
            if (booking.getStatus() == BookingStatus.PENDING) {
                booking.setStatus(BookingStatus.CONFIRMED);
                bookingRepository.save(booking);
            }
        });
        log.info("Payment completed for booking {} (order {})", order.getBookingId(), order.getId());
    }

    private void onCheckoutFailed(Session session) {
        if (session == null) {
            return;
        }
        PaymentOrder order = resolveOrder(session);
        if (order != null && order.getStatus() == PaymentStatus.PENDING) {
            order.setStatus(PaymentStatus.FAILED);
            paymentOrderRepository.save(order);
        }
    }

    private PaymentOrder resolveOrder(Session session) {
        Map<String, String> metadata = session.getMetadata();
        if (metadata != null && metadata.get("paymentOrderId") != null) {
            try {
                Optional<PaymentOrder> byId = paymentOrderRepository.findById(Long.parseLong(metadata.get("paymentOrderId")));
                if (byId.isPresent()) {
                    return byId.get();
                }
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        return paymentOrderRepository.findByPaymentLinkId(session.getId()).orElse(null);
    }

    private Session extractSession(Event event) {
        StripeObject raw = event.getDataObjectDeserializer().getObject().orElse(null);
        if (raw instanceof Session session) {
            return session;
        }
        log.warn("Could not deserialize Stripe session from event {} (type {})", event.getId(), event.getType());
        return null;
    }

    private void ensureCanViewPayment(Long ownerUserId, Long bookingId) {
        if (SecurityUtils.isAdmin()) {
            return;
        }
        Long current = SecurityUtils.currentUserId();
        if (ownerUserId != null && ownerUserId.equals(current)) {
            return;
        }
        boolean isSalonOwnerForBooking = bookingId != null && bookingRepository.findById(bookingId)
                .map(Booking::getSalonId)
                .flatMap(salonRepository::findById)
                .map(salon -> current.equals(salon.getOwnerId()))
                .orElse(false);
        if (!isSalonOwnerForBooking) {
            throw new UnauthorizedException("You are not allowed to view this payment");
        }
    }

    private String appendParam(String url, String param) {
        String separator = url.contains("?") ? "&" : "?";
        return url + separator + param;
    }

    private PaymentOrderDto mapToDto(PaymentOrder order) {
        return PaymentOrderDto.builder()
                .id(order.getId())
                .amount(order.getAmount())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentLinkId(order.getPaymentLinkId())
                .userId(order.getUserId())
                .bookingId(order.getBookingId())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
