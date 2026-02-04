package com.example.message;

import com.example.payload.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationEventProducer {
    private final RabbitTemplate rabbitTemplate;

    public void sendNotificationCreateEvent(Long bookingId,
                                            Long userId,
                                            Long salonId) {
        NotificationDto notificationDto = new NotificationDto();
        notificationDto.setBookingId(bookingId);
        notificationDto.setUserId(userId);
        notificationDto.setSalonId(salonId);
        notificationDto.setDescription("New booking got confirmed!");
        notificationDto.setType("BOOKING");

        rabbitTemplate.convertAndSend("notification-queue", notificationDto);
    }
}
