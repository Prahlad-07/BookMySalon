package com.example.service;

import com.example.domain.PaymentMethod;
import com.example.model.PaymentOrder;
import com.example.payload.dto.BookingDto;
import com.example.payload.dto.UserDto;
import com.example.payload.response.PaymentLinkResponse;
import com.stripe.exception.StripeException;

public interface PaymentService {
    PaymentLinkResponse createOrder(UserDto userDto,
                                    BookingDto bookingDto,
                                    PaymentMethod paymentMethod) throws StripeException;

    PaymentOrder getPaymentOrderById(Long id);

    PaymentOrder getPaymentOrderByPaymentId(String paymentId);

    String createStripePaymentLink(UserDto userDto,
                                   Double amount,
                                   Long orderId) throws StripeException;

    boolean proceedPaymentStatus(PaymentOrder paymentOrder,
                                 String paymentId,
                                 String paymentLinkId);
}
