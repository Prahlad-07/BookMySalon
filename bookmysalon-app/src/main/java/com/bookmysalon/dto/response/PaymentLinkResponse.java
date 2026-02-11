package com.bookmysalon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentLinkResponse {
    private String paymentLink;
    private String paymentLinkId;
    private Long bookingId;
}
