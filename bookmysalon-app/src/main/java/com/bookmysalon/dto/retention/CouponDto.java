package com.bookmysalon.dto.retention;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CouponDto {
    private String code;
    private Integer discountPct;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
}
