package com.example.service.impl;

import com.example.domain.PaymentMethod;
import com.example.domain.PaymentStatus;
import com.example.message.BookingEventProducer;
import com.example.message.NotificationEventProducer;
import com.example.model.PaymentOrder;
import com.example.payload.dto.BookingDto;
import com.example.payload.dto.UserDto;
import com.example.payload.response.PaymentLinkResponse;
import com.example.repository.PaymentOrderRepository;
import com.example.service.PaymentService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {
    private final PaymentOrderRepository paymentOrderRepository;
    private final BookingEventProducer bookingEventProducer;
    private final NotificationEventProducer notificationEventProducer;

    @Value("${stripe.api.key}")
    private String stripeSecretKey;

    @Override
    public PaymentLinkResponse createOrder(UserDto userDto,
                                           BookingDto bookingDto,
                                           PaymentMethod paymentMethod) throws StripeException {
        PaymentOrder paymentOrder = new PaymentOrder();
        paymentOrder.setAmount(bookingDto.getTotalPrice());
        paymentOrder.setPaymentMethod(paymentMethod);
        paymentOrder.setSalonId(bookingDto.getSalonId());
        paymentOrder.setBookingId(bookingDto.getId());
        paymentOrder.setUserId(bookingDto.getCustomerId());

        PaymentOrder savedOrder = paymentOrderRepository.save(paymentOrder);

        PaymentLinkResponse paymentLinkResponse = new PaymentLinkResponse();

        if (paymentMethod.equals(PaymentMethod.STRIPE)) {
            String paymentUrl = createStripePaymentLink(
                    userDto,
                    savedOrder.getAmount(),
                    savedOrder.getId());
            paymentLinkResponse.setPaymentLinkUrl(paymentUrl);
        }
        return paymentLinkResponse;
    }

    @Override
    public PaymentOrder getPaymentOrderById(Long id) {
        return paymentOrderRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Payment order was not found!")
        );
    }

    @Override
    public PaymentOrder getPaymentOrderByPaymentId(String paymentId) {
        return paymentOrderRepository.findByPaymentLinkId(paymentId);
    }

    @Override
    public String createStripePaymentLink(UserDto userDto,
                                          Double amount,
                                          Long orderId) throws StripeException {
        Stripe.apiKey = stripeSecretKey;

        SessionCreateParams params = SessionCreateParams.builder()
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl("http://localhost:3000/payment-success/" + orderId)
                .setCancelUrl("http://localhost:3000/payment-cancel")
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("usd")
                                .setUnitAmount((long) Math.ceil(amount * 100))
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("Salon Appointment Booking")
                                        .build()).build()).build()).build();

        Session session = Session.create(params);
        return session.getUrl();
    }

    @Override
    public boolean proceedPaymentStatus(PaymentOrder paymentOrder,
                                        String paymentId,
                                        String paymentLinkId) {
        if (paymentOrder.getStatus().equals(PaymentStatus.PENDING)) {
            bookingEventProducer.sendBookingUpdateEvent(paymentOrder);
            notificationEventProducer.sendNotificationCreateEvent(
                    paymentOrder.getBookingId(),
                    paymentOrder.getUserId(),
                    paymentOrder.getSalonId()
            );

            paymentOrder.setStatus(PaymentStatus.SUCCESS);
            paymentOrderRepository.save(paymentOrder);
            return true;
        }
        return false;
    }
}
