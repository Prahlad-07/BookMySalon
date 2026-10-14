/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
package com.bookmysalon.service.impl;

import com.bookmysalon.dto.BookingDto;
import com.bookmysalon.dto.BookingRequestDto;
import com.bookmysalon.entity.Booking;
import com.bookmysalon.entity.BookingStatus;
import com.bookmysalon.entity.NotificationType;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.entity.ServiceOffering;
import com.bookmysalon.entity.User;
import com.bookmysalon.exception.BookingNotFoundException;
import com.bookmysalon.exception.ConflictException;
import com.bookmysalon.repository.BookingRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.repository.ServiceOfferingRepository;
import com.bookmysalon.repository.UserRepository;
import com.bookmysalon.service.BookingService;
import com.bookmysalon.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.Collections;
import java.util.Comparator;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements BookingService {
    private static final List<BookingStatus> ACTIVE_STATUSES = List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED);

    private final BookingRepository bookingRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final SalonRepository salonRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Override
    public BookingDto createBooking(BookingRequestDto bookingRequestDto, Long customerId) {
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
        if (!bookingRequestDto.getEndTime().isAfter(bookingRequestDto.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }
        if (!bookingRequestDto.getStartTime().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Start time must be in the future");
        }
        if (bookingRequestDto.getServiceOfferingIds() == null || bookingRequestDto.getServiceOfferingIds().isEmpty()) {
            throw new IllegalArgumentException("At least one service offering must be selected");
        }
        Salon salon = salonRepository.findById(bookingRequestDto.getSalonId())
                .orElseThrow(() -> new IllegalArgumentException("Salon not found with id: " + bookingRequestDto.getSalonId()));
        List<ServiceOffering> selectedServices = loadValidatedServiceOfferings(
                bookingRequestDto.getSalonId(),
                bookingRequestDto.getServiceOfferingIds()
        );
        validateWithinSalonHours(salon, bookingRequestDto.getStartTime(), bookingRequestDto.getEndTime());
        validateNoOverlap(bookingRequestDto.getSalonId(), bookingRequestDto.getStartTime(), bookingRequestDto.getEndTime(), null);

        Booking booking = new Booking();
        booking.setSalonId(bookingRequestDto.getSalonId());
        booking.setCustomerId(customerId);
        booking.setStartTime(bookingRequestDto.getStartTime());
        booking.setEndTime(bookingRequestDto.getEndTime());
        booking.setServiceOfferingIds(bookingRequestDto.getServiceOfferingIds());
        booking.setStatus(BookingStatus.PENDING);
        booking.setTotalPrice(calculateTotalPrice(selectedServices));

        Booking savedBooking = bookingRepository.save(booking);
        return mapToDto(savedBooking);
    }

    @Override
    public BookingDto getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));
        return enrich(List.of(booking)).get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingDto> getAllBookings() {
        return enrich(bookingRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingDto> getBookingsBySalonId(Long salonId) {
        return enrich(bookingRepository.findBySalonId(salonId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingDto> getBookingsByCustomerId(Long customerId) {
        return enrich(bookingRepository.findByCustomerId(customerId));
    }

    /**
     * Maps bookings and resolves display names (salon, customer, services) with
     * one batched lookup per entity type instead of a query per booking.
     */
    private List<BookingDto> enrich(List<Booking> bookings) {
        if (bookings.isEmpty()) {
            return List.of();
        }
        Set<Long> salonIds = bookings.stream().map(Booking::getSalonId).collect(Collectors.toSet());
        Set<Long> customerIds = bookings.stream().map(Booking::getCustomerId).collect(Collectors.toSet());
        Set<Long> serviceIds = bookings.stream()
                .filter(b -> b.getServiceOfferingIds() != null)
                .flatMap(b -> b.getServiceOfferingIds().stream())
                .collect(Collectors.toSet());

        Map<Long, Salon> salons = salonRepository.findAllById(salonIds).stream()
                .collect(Collectors.toMap(Salon::getId, s -> s));
        Map<Long, String> customers = userRepository.findAllById(customerIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u.getFullName() == null ? u.getUsername() : u.getFullName()));
        Map<Long, String> services = serviceOfferingRepository.findAllById(serviceIds).stream()
                .collect(Collectors.toMap(ServiceOffering::getId, ServiceOffering::getName));

        return bookings.stream()
                .sorted(Comparator.comparing(Booking::getStartTime, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(booking -> {
                    BookingDto dto = mapToDto(booking);
                    Salon salon = salons.get(booking.getSalonId());
                    if (salon != null) {
                        dto.setSalonName(salon.getName());
                        dto.setSalonCity(salon.getCity());
                        dto.setSalonOwnerId(salon.getOwnerId());
                    }
                    dto.setCustomerName(customers.get(booking.getCustomerId()));
                    dto.setServiceNames(dto.getServiceOfferingIds().stream()
                            .map(services::get)
                            .filter(Objects::nonNull)
                            .toList());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public BookingDto updateBooking(Long id, BookingDto bookingDto) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));
        BookingStatus previousStatus = booking.getStatus();

        boolean isRescheduling = bookingDto.getStartTime() != null || bookingDto.getEndTime() != null;
        boolean isStatusChange = bookingDto.getStatus() != null && bookingDto.getStatus() != previousStatus;

        if ((isRescheduling || isStatusChange) && isTerminal(previousStatus)) {
            throw new ConflictException("This booking is " + previousStatus.name().toLowerCase()
                    + " and can no longer be modified");
        }

        LocalDateTime updatedStart = bookingDto.getStartTime() != null ? bookingDto.getStartTime() : booking.getStartTime();
        LocalDateTime updatedEnd = bookingDto.getEndTime() != null ? bookingDto.getEndTime() : booking.getEndTime();

        if (!updatedEnd.isAfter(updatedStart)) {
            throw new IllegalArgumentException("End time must be after start time");
        }
        if (isRescheduling) {
            if (!updatedStart.isAfter(LocalDateTime.now())) {
                throw new IllegalArgumentException("Start time must be in the future");
            }
            Salon salon = salonRepository.findById(booking.getSalonId())
                    .orElseThrow(() -> new IllegalArgumentException("Salon not found with id: " + booking.getSalonId()));
            validateWithinSalonHours(salon, updatedStart, updatedEnd);
            validateNoOverlap(booking.getSalonId(), updatedStart, updatedEnd, booking.getId());
        }
        if (isStatusChange) {
            assertTransitionAllowed(previousStatus, bookingDto.getStatus());
        }

        if (bookingDto.getStartTime() != null) booking.setStartTime(updatedStart);
        if (bookingDto.getEndTime() != null) booking.setEndTime(updatedEnd);
        if (isStatusChange) booking.setStatus(bookingDto.getStatus());

        Booking updatedBooking = bookingRepository.save(booking);
        notifyOnStatusChange(updatedBooking, previousStatus);
        return mapToDto(updatedBooking);
    }

    @Override
    public void cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));
        BookingStatus previousStatus = booking.getStatus();
        if (previousStatus == BookingStatus.CANCELLED) {
            return; // idempotent
        }
        if (previousStatus == BookingStatus.COMPLETED) {
            throw new ConflictException("A completed booking cannot be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        Booking updatedBooking = bookingRepository.save(booking);
        notifyOnStatusChange(updatedBooking, previousStatus);
    }

    private boolean isTerminal(BookingStatus status) {
        return status == BookingStatus.CANCELLED || status == BookingStatus.COMPLETED;
    }

    private void assertTransitionAllowed(BookingStatus from, BookingStatus to) {
        boolean allowed = switch (from) {
            case PENDING -> to == BookingStatus.CONFIRMED || to == BookingStatus.CANCELLED || to == BookingStatus.COMPLETED;
            case CONFIRMED -> to == BookingStatus.COMPLETED || to == BookingStatus.CANCELLED;
            case CANCELLED, COMPLETED -> false;
        };
        if (!allowed) {
            throw new ConflictException("Cannot change booking status from " + from + " to " + to);
        }
    }

    @Override
    public Double calculateTotalPrice(Long salonId, Set<Long> serviceOfferingIds) {
        return calculateTotalPrice(loadValidatedServiceOfferings(salonId, serviceOfferingIds));
    }

    private BookingDto mapToDto(Booking booking) {
        Set<Long> safeServiceOfferingIds = booking.getServiceOfferingIds() == null
                ? Collections.emptySet()
                : new LinkedHashSet<>(booking.getServiceOfferingIds());

        return BookingDto.builder()
                .id(booking.getId())
                .salonId(booking.getSalonId())
                .customerId(booking.getCustomerId())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .serviceOfferingIds(safeServiceOfferingIds)
                .status(booking.getStatus())
                .totalPrice(booking.getTotalPrice())
                .createdAt(booking.getCreatedAt())
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

    private void validateNoOverlap(Long salonId, LocalDateTime startTime, LocalDateTime endTime, Long excludeBookingId) {
        boolean hasOverlap = excludeBookingId == null
                ? bookingRepository.existsBySalonIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                salonId, ACTIVE_STATUSES, endTime, startTime
        )
                : bookingRepository.existsBySalonIdAndIdNotAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                salonId, excludeBookingId, ACTIVE_STATUSES, endTime, startTime
        );

        if (hasOverlap) {
            throw new IllegalArgumentException("Selected slot is already booked for this salon");
        }
    }

    private List<ServiceOffering> loadValidatedServiceOfferings(Long salonId, Set<Long> serviceOfferingIds) {
        if (serviceOfferingIds == null || serviceOfferingIds.isEmpty()) {
            throw new IllegalArgumentException("At least one service offering must be selected");
        }

        List<ServiceOffering> selectedServices = new ArrayList<>();
        for (Long serviceOfferingId : serviceOfferingIds) {
            if (serviceOfferingId == null || serviceOfferingId <= 0) {
                throw new IllegalArgumentException("Selected service offering is invalid");
            }
            ServiceOffering serviceOffering = serviceOfferingRepository.findById(serviceOfferingId)
                    .orElseThrow(() -> new IllegalArgumentException("Service offering not found with id: " + serviceOfferingId));
            if (!salonId.equals(serviceOffering.getSalonId())) {
                throw new IllegalArgumentException("Selected services must belong to the selected salon");
            }
            selectedServices.add(serviceOffering);
        }

        return selectedServices;
    }

    private Double calculateTotalPrice(List<ServiceOffering> serviceOfferings) {
        return serviceOfferings.stream()
                .mapToDouble(ServiceOffering::getPrice)
                .sum();
    }

    private void validateWithinSalonHours(Salon salon, LocalDateTime startTime, LocalDateTime endTime) {
        if (salon.getOpenTime() == null || salon.getCloseTime() == null) {
            return;
        }
        if (!startTime.toLocalDate().equals(endTime.toLocalDate())) {
            throw new IllegalArgumentException("Booking must start and end on the same day");
        }

        LocalTime openTime = salon.getOpenTime();
        LocalTime closeTime = salon.getCloseTime();
        if (!closeTime.isAfter(openTime)) {
            throw new IllegalArgumentException("Salon operating hours are not configured correctly");
        }

        LocalTime requestedStart = startTime.toLocalTime();
        LocalTime requestedEnd = endTime.toLocalTime();
        if (requestedStart.isBefore(openTime) || requestedEnd.isAfter(closeTime)) {
            throw new IllegalArgumentException("Selected slot is outside salon operating hours");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.bookmysalon.dto.BusySlotDto> getBusySlots(Long salonId, java.time.LocalDate date) {
        LocalDateTime from = date.atStartOfDay();
        return bookingRepository
                .findBySalonIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThanOrderByStartTime(
                        salonId, List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED), from.plusDays(1), from)
                .stream()
                .map(b -> new com.bookmysalon.dto.BusySlotDto(b.getStartTime(), b.getEndTime()))
                .toList();
    }
}
