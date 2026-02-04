package com.example.controller;

import com.example.domain.BookingStatus;
import com.example.domain.PaymentMethod;
import com.example.mapper.BookingMapper;
import com.example.model.Booking;
import com.example.payload.dto.*;
import com.example.payload.response.PaymentLinkResponse;
import com.example.service.BookingService;
import com.example.service.client.PaymentFeignClient;
import com.example.service.client.SalonFeignClient;
import com.example.service.client.ServiceOfferingFeignClient;
import com.example.service.client.UserFeignClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;
    private final SalonFeignClient salonFeignClient;
    private final UserFeignClient userFeignClient;
    private final ServiceOfferingFeignClient serviceOfferingFeignClient;
    private final PaymentFeignClient paymentFeignClient;

    @PostMapping
    public ResponseEntity<PaymentLinkResponse> createBooking(
            @RequestParam Long salonId,
            @RequestParam PaymentMethod paymentMethod,
            @RequestBody BookingRequestDto bookingRequestDto,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken) {

        UserDto userDto = userFeignClient.getUserProfile(jwtToken).getBody();
        SalonDto salonDto = salonFeignClient.getSalonById(salonId).getBody();

        Set<ServiceOfferingDto> serviceOfferingDtoSet = serviceOfferingFeignClient
                .getServiceOfferingsByIds(bookingRequestDto.getServiceOfferingIds()).getBody();

        Booking createdBooking = bookingService.createBooking(
                bookingRequestDto,
                userDto,
                salonDto,
                serviceOfferingDtoSet);

        BookingDto bookingDto = BookingMapper.mapToBookingDto(createdBooking);
        PaymentLinkResponse paymentLinkResponse = null;

        try {
            paymentLinkResponse = paymentFeignClient.createPaymentLink(
                    bookingDto,
                    paymentMethod,
                    jwtToken).getBody();
        } catch (Exception exp) {
            throw new RuntimeException("Could not create payment link!");
        }
        return new ResponseEntity<>(paymentLinkResponse, HttpStatus.OK);
    }

    @GetMapping("/customer")
    public ResponseEntity<Set<BookingDto>> getBookingsByCustomer(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken
    ) {
        UserDto userDto = userFeignClient.getUserProfile(jwtToken).getBody();
        Set<Booking> bookingSet = bookingService.getBookingsByCustomer(userDto.getId());
        return new ResponseEntity<>(BookingMapper.mapToBookingDtoSet(bookingSet), HttpStatus.OK);
    }

    @GetMapping("/salon")
    public ResponseEntity<Set<BookingDto>> getBookingsBySalon(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken
    ) {
        SalonDto salonDto = salonFeignClient.getSalonByOwnerAccessToken(jwtToken).getBody();
        Set<Booking> bookingSet = bookingService.getBookingsBySalon(salonDto.getId());
        return new ResponseEntity<>(BookingMapper.mapToBookingDtoSet(bookingSet), HttpStatus.OK);
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingDto> getBookingById(
            @PathVariable("bookingId") Long bookingId
    ) {
        Booking booking = bookingService.getBookingById(bookingId);
        return new ResponseEntity<>(BookingMapper.mapToBookingDto(booking), HttpStatus.OK);
    }

    @PatchMapping("/{bookingId}/status")
    public ResponseEntity<BookingDto> updateBookingStatus(
            @PathVariable("bookingId") Long bookingId,
            @RequestParam("status") BookingStatus status
            ) {
        UserDto userDto = new UserDto();
        userDto.setId(1L);

        Booking updatedBooking = bookingService.updateBookingStatus(bookingId, status);
        return new ResponseEntity<>(BookingMapper.mapToBookingDto(updatedBooking), HttpStatus.OK);
    }

    @GetMapping("/slots/salon/{salonId}/date/{date}")
    public ResponseEntity<Set<BookingSlotDto>> getBookedSlots(
            @PathVariable("salonId") Long salonId,
            @PathVariable("date") LocalDate date
    ) {
        Set<Booking> bookings = bookingService.getBookingsByDate(date, salonId);
        Set<BookingSlotDto> slotDtoSet = bookings.stream()
                .map(booking -> {
                    BookingSlotDto slot = new BookingSlotDto();
                    slot.setStartTime(booking.getStartTime());
                    slot.setEndTime(booking.getEndTime());
                    return slot;
                })
                .collect(Collectors.toSet());

        return new ResponseEntity<>(slotDtoSet, HttpStatus.OK);
    }

    @GetMapping("/report")
    public ResponseEntity<SalonReportDto> getSalonReport(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken
    ) {
        SalonDto salonDto = salonFeignClient.getSalonByOwnerAccessToken(jwtToken).getBody();
        SalonReportDto report = bookingService.getSalonReport(salonDto.getId());
        return new ResponseEntity<>(report, HttpStatus.OK);
    }


}
