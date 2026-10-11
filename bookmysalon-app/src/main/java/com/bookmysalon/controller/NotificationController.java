/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-14
 *
 * <p>All endpoints are scoped to the authenticated user. Notification ids that
 * belong to another account resolve to 404 rather than exposing their contents.</p>
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.NotificationDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.exception.UnauthorizedException;
import com.bookmysalon.security.SecurityUtils;
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
        return ResponseEntity.ok(ApiResponse.ok(
                notificationService.getNotificationForUser(id, SecurityUtils.currentUserId())));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getUserNotifications(@PathVariable Long userId) {
        ensureSelfOrAdmin(userId);
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getNotificationsByUserId(userId)));
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getUnreadNotifications(@PathVariable Long userId) {
        ensureSelfOrAdmin(userId);
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUnreadNotifications(userId)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markAsRead(@PathVariable Long id) {
        NotificationDto notification = notificationService.markAsRead(id, SecurityUtils.currentUserId());
        return ResponseEntity.ok(ApiResponse.ok(notification, "Notification marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotificationForUser(id, SecurityUtils.currentUserId());
        return ResponseEntity.ok(ApiResponse.message("Notification deleted successfully"));
    }

    private void ensureSelfOrAdmin(Long userId) {
        if (!SecurityUtils.isAdmin() && !SecurityUtils.currentUserId().equals(userId)) {
            throw new UnauthorizedException("You are not allowed to view these notifications");
        }
    }
}
