package com.example.service.impl;

import com.example.mapper.NotificationMapper;
import com.example.model.Notification;
import com.example.payload.dto.BookingDto;
import com.example.payload.dto.NotificationDto;
import com.example.repository.NotificationRepository;
import com.example.service.NotificationService;
import com.example.service.client.BookingFeignClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;
    private final BookingFeignClient bookingFeignClient;
    private final RealTimeCommunicationService communicationService;

    @Override
    public NotificationDto createNotification(Notification notification) {
        Notification savedNotification = notificationRepository.save(notification);

        BookingDto bookingDto = bookingFeignClient.getBookingById(
                savedNotification.getBookingId()).getBody();

        NotificationDto notificationDto = NotificationMapper.mapToNotificationDto(
                savedNotification,
                bookingDto
        );
        communicationService.sendNotification(new NotificationDto());
        return notificationDto;
    }

    @Override
    public List<Notification> getAllNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserId(userId);
    }

    @Override
    public List<Notification> getAllNotificationsBySalonId(Long salonId) {
        return notificationRepository.findBySalonId(salonId);
    }

    @Override
    public Notification markNotificationAsRead(Long notificationId) {
        return notificationRepository.findById(notificationId).map(
                notification -> {
                    notification.setWasRead(true);
                    return notificationRepository.save(notification);
                }
        ).orElseThrow();
    }

    @Override
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    @Override
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }
}
