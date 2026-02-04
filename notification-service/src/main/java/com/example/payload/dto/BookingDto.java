package com.example.payload.dto;

import com.example.domain.BookingStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data @NoArgsConstructor
public class BookingDto {
    private Long id;

    private Long salonId;

    private Long customerId;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Set<Long> serviceOfferingIds;

    private BookingStatus status = BookingStatus.PENDING;

    private Double totalPrice;
}
