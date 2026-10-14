package com.bookmysalon.dto;

import java.time.LocalDateTime;

/** A taken interval in a salon's calendar. Deliberately carries no customer data. */
public record BusySlotDto(LocalDateTime start, LocalDateTime end) {
}
