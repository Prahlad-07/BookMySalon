package com.example.payload.dto;

import lombok.Data;

@Data
public class SalonReportDto {
    private Long salonId;

    private String salonName;

    private Double totalEarnings;

    private Integer totalBookings;

    private Integer totalCancelledBookings;

    private Double totalRefund;
}
