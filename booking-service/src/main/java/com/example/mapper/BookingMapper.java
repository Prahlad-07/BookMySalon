package com.example.mapper;

import com.example.model.Booking;
import com.example.payload.dto.BookingDto;

import java.util.Set;
import java.util.stream.Collectors;

public class BookingMapper {
    public static BookingDto mapToBookingDto(Booking booking) {
        BookingDto bookingDto = new BookingDto();
        bookingDto.setId(booking.getId());
        bookingDto.setStatus(booking.getStatus());
        bookingDto.setCustomerId(booking.getCustomerId());
        bookingDto.setSalonId(booking.getSalonId());
        bookingDto.setTotalPrice(booking.getTotalPrice());
        bookingDto.setStartTime(booking.getStartTime());
        bookingDto.setEndTime(booking.getEndTime());
        bookingDto.setServiceOfferingIds(booking.getServiceOfferingIds());
        return bookingDto;
    }

    public static Set<BookingDto> mapToBookingDtoSet(Set<Booking> bookings) {
        return bookings.stream()
                .map(BookingMapper::mapToBookingDto)
                .collect(Collectors.toSet());
    }
}
