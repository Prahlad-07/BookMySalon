package com.bookmysalon.service.impl;

import com.bookmysalon.dto.BookingDto;
import com.bookmysalon.entity.Booking;
import com.bookmysalon.entity.BookingStatus;
import com.bookmysalon.exception.ConflictException;
import com.bookmysalon.repository.BookingRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.repository.ServiceOfferingRepository;
import com.bookmysalon.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplStateMachineTest {

    @Mock BookingRepository bookingRepository;
    @Mock ServiceOfferingRepository serviceOfferingRepository;
    @Mock SalonRepository salonRepository;
    @Mock NotificationService notificationService;
    @Mock com.bookmysalon.repository.UserRepository userRepository;

    @InjectMocks BookingServiceImpl service;

    private Booking booking(BookingStatus status) {
        Booking b = new Booking();
        b.setId(1L);
        b.setSalonId(5L);
        b.setCustomerId(9L);
        b.setStatus(status);
        b.setStartTime(LocalDateTime.now().plusDays(1));
        b.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));
        b.setTotalPrice(40.0);
        return b;
    }

    @Test
    void confirmingAPendingBookingIsAllowed() {
        Booking pending = booking(BookingStatus.PENDING);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(pending));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        BookingDto result = service.updateBooking(1L, BookingDto.builder().status(BookingStatus.CONFIRMED).build());

        assertEquals(BookingStatus.CONFIRMED, result.getStatus());
    }

    @Test
    void movingCompletedBackToPendingIsRejected() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking(BookingStatus.COMPLETED)));

        assertThrows(ConflictException.class,
                () -> service.updateBooking(1L, BookingDto.builder().status(BookingStatus.PENDING).build()));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void reschedulingACancelledBookingIsRejected() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking(BookingStatus.CANCELLED)));

        assertThrows(ConflictException.class, () -> service.updateBooking(1L,
                BookingDto.builder().startTime(LocalDateTime.now().plusDays(3)).build()));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancellingACompletedBookingIsRejected() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking(BookingStatus.COMPLETED)));

        assertThrows(ConflictException.class, () -> service.cancelBooking(1L));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancellingAnAlreadyCancelledBookingIsIdempotent() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking(BookingStatus.CANCELLED)));

        service.cancelBooking(1L);

        verify(bookingRepository, never()).save(any());
    }

    @Test
    void confirmedBookingCanBeCompleted() {
        Booking confirmed = booking(BookingStatus.CONFIRMED);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(confirmed));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));
        lenient().when(salonRepository.findById(any())).thenReturn(Optional.empty());

        BookingDto result = service.updateBooking(1L, BookingDto.builder().status(BookingStatus.COMPLETED).build());

        assertEquals(BookingStatus.COMPLETED, result.getStatus());
    }
}
