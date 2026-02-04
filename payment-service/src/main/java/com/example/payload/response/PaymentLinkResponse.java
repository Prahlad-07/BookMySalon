package com.example.payload.response;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class PaymentLinkResponse {
    private String paymentLinkUrl;

    private String paymentLinkId;
}
