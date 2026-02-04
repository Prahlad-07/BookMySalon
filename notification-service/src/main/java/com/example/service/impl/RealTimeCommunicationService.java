package com.example.service.impl;

import com.example.payload.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RealTimeCommunicationService {
    private final SimpMessagingTemplate simpTemplate;

    public void sendNotification(NotificationDto notificationDto) {
        simpTemplate.convertAndSend("/notification/user" + notificationDto.getUserId(), notificationDto);
        simpTemplate.convertAndSend("/notification/salon/" + notificationDto.getSalonId(), notificationDto);
    }

}
