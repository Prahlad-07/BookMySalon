package com.example.service.impl;

import com.example.domain.BookingStatus;
import com.example.model.Booking;
import com.example.payload.dto.*;
import com.example.repository.BookingRepository;
import com.example.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {
    private final BookingRepository bookingRepository;

    @Override
    public Booking createBooking(BookingRequestDto booking,
                                 UserDto userDto,
                                 SalonDto salonDto,
                                 Set<ServiceOfferingDto> serviceOfferingDtoSet) {
        int totalDuration = serviceOfferingDtoSet.stream()
                .mapToInt(ServiceOfferingDto::getDuration)
                .sum();
        LocalDateTime bookingStartTime = booking.getStartTime();
        LocalDateTime bookingEndTime = bookingStartTime.plusMinutes(totalDuration);

        booking.setEndTime(bookingEndTime);

        boolean isSlotAvailable = isTimeSlotAvailable(salonDto, bookingStartTime, bookingEndTime);

        if (!isSlotAvailable) {
            throw new RuntimeException("Time slot is not available!");
        }

        double totalPrice = serviceOfferingDtoSet.stream()
                .mapToDouble(ServiceOfferingDto::getPrice)
                .sum();

        Set<Long> idList = serviceOfferingDtoSet.stream()
                .map(ServiceOfferingDto::getId)
                .collect(Collectors.toSet());

        Booking createdBooking = new Booking();
        createdBooking.setCustomerId(userDto.getId());
        createdBooking.setSalonId(salonDto.getId());
        createdBooking.setServiceOfferingIds(idList);
        createdBooking.setStatus(BookingStatus.PENDING);
        createdBooking.setStartTime(booking.getStartTime());
        createdBooking.setEndTime(booking.getEndTime());
        createdBooking.setTotalPrice(totalPrice);

        return bookingRepository.save(createdBooking);
    }

    public boolean isTimeSlotAvailable(SalonDto salonDto,
                                       LocalDateTime bookingStartTime,
                                       LocalDateTime bookingEndTime) {
        LocalDateTime salonOpenTime = salonDto.getOpenTime().atDate(bookingStartTime.toLocalDate());
        LocalDateTime salonCloseTime = salonDto.getCloseTime().atDate(bookingStartTime.toLocalDate());

        if (bookingStartTime.isBefore(salonOpenTime)
                || bookingEndTime.isAfter(salonCloseTime)) {
            throw new RuntimeException("Booking time must be within salon's working hours!");
        }

        Set<Booking> existingBookings = getBookingsBySalon(salonDto.getId());

        for (Booking booking : existingBookings) {
            LocalDateTime existingBookingStartTime = booking.getStartTime();
            LocalDateTime existingBookingEndTime = booking.getEndTime();

            if (bookingStartTime.isBefore(existingBookingEndTime)
                    && bookingEndTime.isAfter(existingBookingStartTime)) {
                return false;
            }
            if (bookingStartTime.isEqual(existingBookingStartTime)
                    || bookingEndTime.isEqual(existingBookingEndTime)) {
                return false;
            }
        }
        return true;
    }

    @Override
    public Set<Booking> getBookingsByCustomer(Long customerId) {
        return bookingRepository.findByCustomerId(customerId);
    }

    @Override
    public Set<Booking> getBookingsBySalon(Long salonId) {
        return bookingRepository.findBySalonId(salonId);
    }

    @Override
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Booking was not found!")
        );
    }

    @Override
    public Booking updateBookingStatus(Long bookingId, BookingStatus status) {
        Booking existingBooking = getBookingById(bookingId);
        existingBooking.setStatus(status);
        return bookingRepository.save(existingBooking);
    }

    @Override
    public Set<Booking> getBookingsByDate(LocalDate date, Long salonId) {
        Set<Booking> allBookings = getBookingsBySalon(salonId);
        if (date == null) {
            return null;
        }
        return allBookings.stream()
                .filter(booking -> booking.getStartTime().toLocalDate().isEqual(date))
                .collect(Collectors.toSet());
    }

    @Override
    public SalonReportDto getSalonReport(Long salonId) {
        Set<Booking> bookings = getBookingsBySalon(salonId);
        double totalEarnings = bookings.stream()
                .mapToDouble(Booking::getTotalPrice)
                .sum();
        Set<Booking> cancelledBookings = bookings.stream()
                .filter(booking -> booking.getStatus().equals(BookingStatus.CANCELLED))
                .collect(Collectors.toSet());
        double totalRefund = cancelledBookings.stream()
                .mapToDouble(Booking::getTotalPrice)
                .sum();
        SalonReportDto report = new SalonReportDto();
        report.setSalonId(salonId);
        report.setTotalRefund(totalRefund);
        report.setTotalEarnings(totalEarnings);
        report.setTotalCancelledBookings(cancelledBookings.size());
        report.setTotalBookings(bookings.size());
        return report;
    }

    @Override
    public Booking markBookingConfirmed(PaymentOrder paymentOrder) {
        return updateBookingStatus(paymentOrder.getBookingId(), BookingStatus.CONFIRMED);
    }
}
