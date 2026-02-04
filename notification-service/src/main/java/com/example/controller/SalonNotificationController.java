package com.example.controller;

import com.example.mapper.NotificationMapper;
import com.example.model.Notification;
import com.example.payload.dto.BookingDto;
import com.example.payload.dto.NotificationDto;
import com.example.service.NotificationService;
import com.example.service.client.BookingFeignClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications/salon-owner")
@RequiredArgsConstructor
public class SalonNotificationController {
    private final NotificationService notificationService;
    private final BookingFeignClient bookingFeignClient;

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<List<NotificationDto>> getNotificationsBySalonId(
            @PathVariable Long salonId) {
        List<Notification> notifications = notificationService
                .getAllNotificationsBySalonId(salonId);
        List<NotificationDto> notificationDTOS=notifications
                .stream()
                .map((notification)-> {
                    BookingDto bookingDTO= bookingFeignClient
                            .getBookingById(notification.getBookingId()).getBody();
                    return NotificationMapper.mapToNotificationDto(notification, bookingDTO);
                }).collect(Collectors.toList());
        return ResponseEntity.ok(notificationDTOS);
    }
}
