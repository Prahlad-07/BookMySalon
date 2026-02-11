package com.bookmysalon.service;

import com.bookmysalon.dto.NotificationDto;
import java.util.List;

public interface NotificationService {
    NotificationDto createNotification(NotificationDto notificationDto);
    NotificationDto getNotificationById(Long id);
    List<NotificationDto> getAllNotifications();
    List<NotificationDto> getNotificationsByUserId(Long userId);
    List<NotificationDto> getUnreadNotifications(Long userId);
    NotificationDto markAsRead(Long id);
    void deleteNotification(Long id);
}
