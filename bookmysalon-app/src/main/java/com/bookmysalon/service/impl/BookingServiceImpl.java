package com.bookmysalon.service.impl;

import com.bookmysalon.dto.BookingDto;
import com.bookmysalon.dto.BookingRequestDto;
import com.bookmysalon.entity.Booking;
import com.bookmysalon.entity.BookingStatus;
import com.bookmysalon.entity.NotificationType;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.entity.ServiceOffering;
import com.bookmysalon.exception.BookingNotFoundException;
import com.bookmysalon.repository.BookingRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.repository.ServiceOfferingRepository;
import com.bookmysalon.service.BookingService;
import com.bookmysalon.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final SalonRepository salonRepository;
    private final NotificationService notificationService;

    @Override
    public BookingDto createBooking(BookingRequestDto bookingRequestDto, Long customerId) {
        // Validate input
        if (bookingRequestDto == null) {
            throw new IllegalArgumentException("Booking request cannot be null");
        }
        if (bookingRequestDto.getSalonId() == null || bookingRequestDto.getSalonId() <= 0) {
            throw new IllegalArgumentException("Salon ID is required and must be valid");
        }
        if (customerId == null || customerId <= 0) {
            throw new IllegalArgumentException("Customer ID is required and must be valid");
        }
        if (bookingRequestDto.getStartTime() == null) {
            throw new IllegalArgumentException("Start time is required");
        }
        if (bookingRequestDto.getEndTime() == null) {
            throw new IllegalArgumentException("End time is required");
        }
        if (bookingRequestDto.getEndTime().isBefore(bookingRequestDto.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }
        if (bookingRequestDto.getServiceOfferingIds() == null || bookingRequestDto.getServiceOfferingIds().isEmpty()) {
            throw new IllegalArgumentException("At least one service offering must be selected");
        }

        Booking booking = new Booking();
        booking.setSalonId(bookingRequestDto.getSalonId());
        booking.setCustomerId(customerId);
        booking.setStartTime(bookingRequestDto.getStartTime());
        booking.setEndTime(bookingRequestDto.getEndTime());
        booking.setServiceOfferingIds(bookingRequestDto.getServiceOfferingIds());
        booking.setStatus(BookingStatus.PENDING);
        booking.setTotalPrice(calculateTotalPrice(bookingRequestDto.getSalonId(), bookingRequestDto.getServiceOfferingIds()));

        Booking savedBooking = bookingRepository.save(booking);
        return mapToDto(savedBooking);
    }

    @Override
    public BookingDto getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));
        return mapToDto(booking);
    }

    @Override
    public List<BookingDto> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingDto> getBookingsBySalonId(Long salonId) {
        return bookingRepository.findBySalonId(salonId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingDto> getBookingsByCustomerId(Long customerId) {
        return bookingRepository.findByCustomerId(customerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public BookingDto updateBooking(Long id, BookingDto bookingDto) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));
        BookingStatus previousStatus = booking.getStatus();

        if (bookingDto.getStartTime() != null) booking.setStartTime(bookingDto.getStartTime());
        if (bookingDto.getEndTime() != null) booking.setEndTime(bookingDto.getEndTime());
        if (bookingDto.getStatus() != null) booking.setStatus(bookingDto.getStatus());

        Booking updatedBooking = bookingRepository.save(booking);
        notifyOnStatusChange(updatedBooking, previousStatus);
        return mapToDto(updatedBooking);
    }

    @Override
    public void cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));
        BookingStatus previousStatus = booking.getStatus();
        booking.setStatus(BookingStatus.CANCELLED);
        Booking updatedBooking = bookingRepository.save(booking);
        notifyOnStatusChange(updatedBooking, previousStatus);
    }

    @Override
    public Double calculateTotalPrice(Long salonId, Set<Long> serviceOfferingIds) {
        return serviceOfferingIds.stream()
                .map(serviceOfferingRepository::findById)
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .mapToDouble(ServiceOffering::getPrice)
                .sum();
    }

    private BookingDto mapToDto(Booking booking) {
        return BookingDto.builder()
                .id(booking.getId())
                .salonId(booking.getSalonId())
                .customerId(booking.getCustomerId())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .serviceOfferingIds(booking.getServiceOfferingIds())
                .status(booking.getStatus())
                .totalPrice(booking.getTotalPrice())
                .build();
    }

    private void notifyOnStatusChange(Booking booking, BookingStatus previousStatus) {
        if (booking.getStatus() == previousStatus) {
            return;
        }

        NotificationType type;
        String description;

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            type = NotificationType.BOOKING_CONFIRMATION;
            description = "Booking #" + booking.getId() + " has been confirmed";
        } else if (booking.getStatus() == BookingStatus.CANCELLED) {
            type = NotificationType.BOOKING_CANCELLATION;
            description = "Booking #" + booking.getId() + " has been cancelled";
        } else {
            return;
        }

        notificationService.createAndPushNotification(
                booking.getCustomerId(),
                type,
                description,
                booking.getId(),
                null,
                null
        );

        Salon salon = salonRepository.findById(booking.getSalonId()).orElse(null);
        if (salon != null && salon.getOwnerId() != null && !salon.getOwnerId().equals(booking.getCustomerId())) {
            notificationService.createAndPushNotification(
                    salon.getOwnerId(),
                    type,
                    description,
                    booking.getId(),
                    null,
                    null
            );
        }
    }
}
