package com.example.payload.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDto {
    private Long id;

    private String type;

    private String description;

    private Boolean wasRead = false;

    private Long userId;

    private Long bookingId;

    private Long salonId;

    private LocalDateTime createdAt;

    private BookingDto booking;
}
