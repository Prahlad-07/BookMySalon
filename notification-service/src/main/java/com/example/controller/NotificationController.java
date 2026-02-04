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
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;
    private final BookingFeignClient bookingFeignClient;

    @PostMapping
    public ResponseEntity<NotificationDto> createNotification(
            @RequestBody Notification notification) {
        NotificationDto createdNotification = notificationService
                .createNotification(notification);


        return ResponseEntity.ok(createdNotification);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationDto>> getNotificationsByUserId(
            @PathVariable Long userId) {
        List<Notification> notifications = notificationService
                .getAllNotificationsByUserId(userId);

        List<NotificationDto> notificationDTOS=notifications.stream().map((notification)-> {
            BookingDto bookingDTO= bookingFeignClient
                    .getBookingById(notification.getBookingId()).getBody();
            return NotificationMapper.mapToNotificationDto(notification, bookingDTO);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(notificationDTOS);
    }



    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications() {
        List<Notification> notifications = notificationService
                .getAllNotifications();
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationDto> markNotificationAsRead(
            @PathVariable Long notificationId) {
        Notification updatedNotification = notificationService
                .markNotificationAsRead(notificationId);
        BookingDto bookingDTO= bookingFeignClient
                .getBookingById(updatedNotification.getBookingId()).getBody();

        NotificationDto notificationDTO= NotificationMapper.mapToNotificationDto(
                updatedNotification,
                bookingDTO
        );

        return ResponseEntity.ok(notificationDTO);
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long notificationId) {
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.noContent().build();
    }
}
