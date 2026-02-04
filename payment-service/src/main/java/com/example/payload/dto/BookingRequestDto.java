package com.example.payload.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
public class BookingRequestDto {
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Set<Long> serviceOfferingIds;
}
