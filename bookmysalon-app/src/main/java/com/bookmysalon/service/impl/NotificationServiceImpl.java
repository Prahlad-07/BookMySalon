package com.bookmysalon.service.impl;

import com.bookmysalon.dto.NotificationDto;
import com.bookmysalon.entity.Notification;
import com.bookmysalon.exception.UserNotFoundException;
import com.bookmysalon.repository.NotificationRepository;
import com.bookmysalon.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public NotificationDto createNotification(NotificationDto notificationDto) {
        // Validate input
        if (notificationDto == null) {
            throw new IllegalArgumentException("Notification data cannot be null");
        }
        if (notificationDto.getType() == null || notificationDto.getType().trim().isEmpty()) {
            throw new IllegalArgumentException("Notification type is required");
        }
        if (notificationDto.getDescription() == null || notificationDto.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Notification description is required");
        }
        if (notificationDto.getUserId() == null || notificationDto.getUserId() <= 0) {
            throw new IllegalArgumentException("User ID is required and must be valid");
        }

        Notification notification = new Notification();
        notification.setType(notificationDto.getType().trim());
        notification.setDescription(notificationDto.getDescription().trim());
        notification.setWasRead(false);
        notification.setUserId(notificationDto.getUserId());
        notification.setBookingId(notificationDto.getBookingId());
        notification.setSalonId(notificationDto.getSalonId());

        Notification savedNotification = notificationRepository.save(notification);
        return mapToDto(savedNotification);
    }

    @Override
    public NotificationDto getNotificationById(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Notification not found with id: " + id));
        return mapToDto(notification);
    }

    @Override
    public List<NotificationDto> getAllNotifications() {
        return notificationRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDto> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDto> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndWasReadFalse(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public NotificationDto markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Notification not found with id: " + id));
        notification.setWasRead(true);
        Notification updatedNotification = notificationRepository.save(notification);
        return mapToDto(updatedNotification);
    }

    @Override
    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new UserNotFoundException("Notification not found with id: " + id);
        }
        notificationRepository.deleteById(id);
    }

    private NotificationDto mapToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .type(notification.getType())
                .description(notification.getDescription())
                .wasRead(notification.getWasRead())
                .userId(notification.getUserId())
                .bookingId(notification.getBookingId())
                .salonId(notification.getSalonId())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
