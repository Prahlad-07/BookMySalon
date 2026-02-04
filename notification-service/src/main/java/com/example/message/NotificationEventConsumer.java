package com.example.message;

import com.example.model.Notification;
import com.example.payload.dto.NotificationDto;
import com.example.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationEventConsumer {
    private final NotificationService notificationService;

    @RabbitListener(queues = "notification-queue")
    public void createNotificationEventListener(Notification notification) {
        notificationService.createNotification(notification);
    }
}
