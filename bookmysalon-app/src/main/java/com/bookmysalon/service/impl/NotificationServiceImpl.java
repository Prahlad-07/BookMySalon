package com.bookmysalon.service.impl;

import com.bookmysalon.dto.NotificationDto;
import com.bookmysalon.entity.Notification;
import com.bookmysalon.entity.NotificationType;
import com.bookmysalon.exception.UserNotFoundException;
import com.bookmysalon.repository.NotificationRepository;
import com.bookmysalon.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

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
        notification.setType(NotificationType.valueOf(notificationDto.getType().trim().toUpperCase()));
        notification.setDescription(notificationDto.getDescription().trim());
        notification.setWasRead(false);
        notification.setUserId(notificationDto.getUserId());
        notification.setBookingId(notificationDto.getBookingId());
        notification.setSalonId(notificationDto.getSalonId());
        notification.setConversationId(notificationDto.getConversationId());
        notification.setMessageId(notificationDto.getMessageId());

        Notification savedNotification = notificationRepository.save(notification);
        return mapToDto(savedNotification);
    }

    @Override
    public NotificationDto createAndPushNotification(Long userId,
                                                     NotificationType type,
                                                     String description,
                                                     Long bookingId,
                                                     Long conversationId,
                                                     Long messageId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setDescription(description);
        notification.setWasRead(false);
        notification.setBookingId(bookingId);
        notification.setConversationId(conversationId);
        notification.setMessageId(messageId);

        Notification saved = notificationRepository.save(notification);
        NotificationDto dto = mapToDto(saved);
        messagingTemplate.convertAndSendToUser(String.valueOf(userId), "/queue/notifications", dto);
        return dto;
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
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDto> getNotificationsByUserId(Long userId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, safeLimit)).stream()
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
    public long getUnreadNotificationCount(Long userId) {
        return notificationRepository.countByUserIdAndWasReadFalse(userId);
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
    public NotificationDto markAsRead(Long id, Long userId) {
        Notification notification = notificationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new UserNotFoundException("Notification not found with id: " + id));
        notification.setWasRead(true);
        return mapToDto(notificationRepository.save(notification));
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
                .type(notification.getType() == null ? null : notification.getType().name())
                .description(notification.getDescription())
                .wasRead(notification.getWasRead())
                .userId(notification.getUserId())
                .bookingId(notification.getBookingId())
                .salonId(notification.getSalonId())
                .conversationId(notification.getConversationId())
                .messageId(notification.getMessageId())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
