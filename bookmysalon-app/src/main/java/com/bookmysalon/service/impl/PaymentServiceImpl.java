package com.bookmysalon.service.impl;

import com.bookmysalon.dto.PaymentOrderDto;
import com.bookmysalon.dto.response.PaymentLinkResponse;
import com.bookmysalon.entity.PaymentOrder;
import com.bookmysalon.entity.PaymentStatus;
import com.bookmysalon.exception.UserNotFoundException;
import com.bookmysalon.repository.BookingRepository;
import com.bookmysalon.repository.PaymentOrderRepository;
import com.bookmysalon.service.PaymentService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentLink;
import com.stripe.param.PaymentLinkCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentOrderRepository paymentOrderRepository;
    private final BookingRepository bookingRepository;

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Override
    public PaymentOrderDto createPayment(Long bookingId, Long userId) {
        // Validate input
        if (bookingId == null || bookingId <= 0) {
            throw new IllegalArgumentException("Booking ID is required and must be valid");
        }
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("User ID is required and must be valid");
        }

        var booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new UserNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getTotalPrice() == null || booking.getTotalPrice() <= 0) {
            throw new IllegalArgumentException("Booking amount must be greater than 0");
        }

        PaymentOrder paymentOrder = new PaymentOrder();
        paymentOrder.setUserId(userId);
        paymentOrder.setBookingId(bookingId);
        paymentOrder.setAmount(booking.getTotalPrice());
        paymentOrder.setStatus(PaymentStatus.PENDING);

        PaymentOrder savedPayment = paymentOrderRepository.save(paymentOrder);
        return mapToDto(savedPayment);
    }

    @Override
    public PaymentOrderDto getPaymentById(Long id) {
        PaymentOrder paymentOrder = paymentOrderRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Payment not found with id: " + id));
        return mapToDto(paymentOrder);
    }

    @Override
    public List<PaymentOrderDto> getAllPayments() {
        return paymentOrderRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<PaymentOrderDto> getPaymentsByUserId(Long userId) {
        return paymentOrderRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<PaymentOrderDto> getPaymentsByBookingId(Long bookingId) {
        return paymentOrderRepository.findByBookingId(bookingId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public PaymentLinkResponse createPaymentLink(Long bookingId, Long userId) {
        PaymentOrderDto paymentDto = createPayment(bookingId, userId);
        
        try {
            Stripe.apiKey = stripeApiKey;
            
            PaymentLinkCreateParams params = PaymentLinkCreateParams.builder()
                    .addLineItem(
                            PaymentLinkCreateParams.LineItem.builder()
                                    .setPrice("price_1234567890")
                                    .setQuantity(1L)
                                    .build()
                    )
                    .setAfterCompletion(
                            PaymentLinkCreateParams.AfterCompletion.builder()
                                    .setType(PaymentLinkCreateParams.AfterCompletion.Type.REDIRECT)
                                    .setRedirect(
                                            PaymentLinkCreateParams.AfterCompletion.Redirect.builder()
                                                    .setUrl("http://localhost:3000/payment/success?bookingId=" + bookingId)
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();
            
            PaymentLink paymentLink = PaymentLink.create(params);
            
            PaymentOrder paymentOrder = paymentOrderRepository.findById(paymentDto.getId()).get();
            paymentOrder.setPaymentLinkId(paymentLink.getId());
            paymentOrderRepository.save(paymentOrder);
            
            return PaymentLinkResponse.builder()
                    .paymentLink(paymentLink.getUrl())
                    .paymentLinkId(paymentLink.getId())
                    .bookingId(bookingId)
                    .build();
        } catch (StripeException e) {
            throw new RuntimeException("Error creating payment link: " + e.getMessage());
        }
    }

    @Override
    public void handlePaymentSuccess(String paymentLinkId) {
        PaymentOrder paymentOrder = paymentOrderRepository.findByPaymentLinkId(paymentLinkId)
                .orElseThrow(() -> new UserNotFoundException("Payment not found"));
        paymentOrder.setStatus(PaymentStatus.COMPLETED);
        paymentOrderRepository.save(paymentOrder);
    }

    @Override
    public void handlePaymentFailure(String paymentLinkId) {
        PaymentOrder paymentOrder = paymentOrderRepository.findByPaymentLinkId(paymentLinkId)
                .orElseThrow(() -> new UserNotFoundException("Payment not found"));
        paymentOrder.setStatus(PaymentStatus.FAILED);
        paymentOrderRepository.save(paymentOrder);
    }

    private PaymentOrderDto mapToDto(PaymentOrder paymentOrder) {
        return PaymentOrderDto.builder()
                .id(paymentOrder.getId())
                .amount(paymentOrder.getAmount())
                .status(paymentOrder.getStatus())
                .paymentMethod(paymentOrder.getPaymentMethod())
                .paymentLinkId(paymentOrder.getPaymentLinkId())
                .userId(paymentOrder.getUserId())
                .bookingId(paymentOrder.getBookingId())
                .createdAt(paymentOrder.getCreatedAt())
                .build();
    }
}
