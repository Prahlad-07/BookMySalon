package com.bookmysalon.controller;

import com.bookmysalon.dto.NotificationDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NotificationDto>> getNotification(@PathVariable Long id) {
        try {
            NotificationDto notification = notificationService.getNotificationById(id);
            return ResponseEntity.ok(ApiResponse.<NotificationDto>builder()
                    .success(true)
                    .data(notification)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<NotificationDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getUserNotifications(@PathVariable Long userId) {
        try {
            List<NotificationDto> notifications = notificationService.getNotificationsByUserId(userId);
            return ResponseEntity.ok(ApiResponse.<List<NotificationDto>>builder()
                    .success(true)
                    .data(notifications)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<NotificationDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getUnreadNotifications(@PathVariable Long userId) {
        try {
            List<NotificationDto> notifications = notificationService.getUnreadNotifications(userId);
            return ResponseEntity.ok(ApiResponse.<List<NotificationDto>>builder()
                    .success(true)
                    .data(notifications)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<NotificationDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markAsRead(@PathVariable Long id) {
        try {
            NotificationDto notification = notificationService.markAsRead(id);
            return ResponseEntity.ok(ApiResponse.<NotificationDto>builder()
                    .success(true)
                    .message("Notification marked as read")
                    .data(notification)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<NotificationDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        try {
            notificationService.deleteNotification(id);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Notification deleted successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<Void>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }
}
