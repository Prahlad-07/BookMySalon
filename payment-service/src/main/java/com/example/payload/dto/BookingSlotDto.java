package com.example.payload.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @NoArgsConstructor
public class BookingSlotDto {
    private LocalDateTime startTime;

    private LocalDateTime endTime;
}
