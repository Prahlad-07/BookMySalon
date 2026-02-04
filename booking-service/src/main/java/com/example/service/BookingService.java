package com.example.service;

import com.example.domain.BookingStatus;
import com.example.model.Booking;
import com.example.payload.dto.*;

import java.time.LocalDate;
import java.util.Set;

public interface BookingService {
    Booking createBooking(BookingRequestDto booking,
                          UserDto userDto,
                          SalonDto salonDto,
                          Set<ServiceOfferingDto> serviceOfferingDtoSet);

    Set<Booking> getBookingsByCustomer(Long customerId);

    Set<Booking> getBookingsBySalon(Long salonId);

    Booking getBookingById(Long id);

    Booking updateBookingStatus(Long bookingId, BookingStatus status);

    Set<Booking> getBookingsByDate(LocalDate date, Long salonId);

    SalonReportDto getSalonReport(Long salonId);

    Booking markBookingConfirmed(PaymentOrder paymentOrder);
}
