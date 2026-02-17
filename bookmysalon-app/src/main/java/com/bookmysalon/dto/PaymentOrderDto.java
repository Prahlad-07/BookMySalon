/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.dto;

import com.bookmysalon.entity.PaymentMethod;
import com.bookmysalon.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentOrderDto {
    private Long id;
    private Double amount;
    private PaymentStatus status;
    private PaymentMethod paymentMethod;
    private String paymentLinkId;
    private Long userId;
    private Long bookingId;
    private LocalDateTime createdAt;
}
