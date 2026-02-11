package com.bookmysalon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDto {
    private Long id;
    private String type;
    private String description;
    private Boolean wasRead;
    private Long userId;
    private Long bookingId;
    private Long salonId;
    private LocalDateTime createdAt;
}
