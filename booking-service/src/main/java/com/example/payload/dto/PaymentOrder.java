package com.example.payload.dto;

import com.example.domain.PaymentMethod;
import com.example.domain.PaymentStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class PaymentOrder {

    private Long id;

    private Double amount;

    private PaymentStatus status = PaymentStatus.PENDING;

    private PaymentMethod paymentMethod;

    private String paymentLinkId;

    private Long userId;

    private Long bookingId;

    private Long salonId;
}
