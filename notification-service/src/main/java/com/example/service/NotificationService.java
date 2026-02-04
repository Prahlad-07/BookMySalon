package com.example.service;

import com.example.model.Notification;
import com.example.payload.dto.NotificationDto;

import java.util.List;

public interface NotificationService {
    NotificationDto createNotification(Notification notification);

    List<Notification> getAllNotificationsByUserId(Long userId);

    List<Notification> getAllNotificationsBySalonId(Long salonId);

    Notification markNotificationAsRead(Long notificationId);

    List<Notification> getAllNotifications();

    void deleteNotification(Long notificationId);

}
