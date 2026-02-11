package com.bookmysalon.service;

import com.bookmysalon.dto.PaymentOrderDto;
import com.bookmysalon.dto.response.PaymentLinkResponse;
import java.util.List;

public interface PaymentService {
    PaymentOrderDto createPayment(Long bookingId, Long userId);
    PaymentOrderDto getPaymentById(Long id);
    List<PaymentOrderDto> getAllPayments();
    List<PaymentOrderDto> getPaymentsByUserId(Long userId);
    List<PaymentOrderDto> getPaymentsByBookingId(Long bookingId);
    PaymentLinkResponse createPaymentLink(Long bookingId, Long userId);
    void handlePaymentSuccess(String paymentLinkId);
    void handlePaymentFailure(String paymentLinkId);
}
