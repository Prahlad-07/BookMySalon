package com.bookmysalon.service;

import com.bookmysalon.dto.NotificationDto;
import com.bookmysalon.entity.NotificationType;

import java.util.List;

public interface NotificationService {
    NotificationDto createNotification(NotificationDto notificationDto);
    NotificationDto createAndPushNotification(Long userId,
                                              NotificationType type,
                                              String description,
                                              Long bookingId,
                                              Long conversationId,
                                              Long messageId);
    NotificationDto getNotificationById(Long id);
    List<NotificationDto> getAllNotifications();
    List<NotificationDto> getNotificationsByUserId(Long userId);
    List<NotificationDto> getNotificationsByUserId(Long userId, int limit);
    List<NotificationDto> getUnreadNotifications(Long userId);
    long getUnreadNotificationCount(Long userId);
    NotificationDto markAsRead(Long id);
    NotificationDto markAsRead(Long id, Long userId);
    void deleteNotification(Long id);
}
