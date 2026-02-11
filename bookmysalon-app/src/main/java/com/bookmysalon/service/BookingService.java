package com.bookmysalon.service;

import com.bookmysalon.dto.BookingDto;
import com.bookmysalon.dto.BookingRequestDto;
import java.util.List;

public interface BookingService {
    BookingDto createBooking(BookingRequestDto bookingRequestDto, Long customerId);
    BookingDto getBookingById(Long id);
    List<BookingDto> getAllBookings();
    List<BookingDto> getBookingsBySalonId(Long salonId);
    List<BookingDto> getBookingsByCustomerId(Long customerId);
    BookingDto updateBooking(Long id, BookingDto bookingDto);
    void cancelBooking(Long id);
    Double calculateTotalPrice(Long salonId, java.util.Set<Long> serviceOfferingIds);
}
