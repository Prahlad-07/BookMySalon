package com.example.service.client;

import com.example.domain.PaymentMethod;
import com.example.payload.response.PaymentLinkResponse;
import com.example.payload.dto.BookingDto;
import com.stripe.exception.StripeException;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "payment-service", path = "/api/payments")
public interface PaymentFeignClient {
    @PostMapping("/create")
    public ResponseEntity<PaymentLinkResponse> createPaymentLink(
            @RequestBody BookingDto booking,
            @RequestParam PaymentMethod paymentMethod,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken
    ) throws StripeException;
}
