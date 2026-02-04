package com.example.mapper;

import com.example.model.Notification;
import com.example.payload.dto.BookingDto;
import com.example.payload.dto.NotificationDto;
import com.example.service.client.BookingFeignClient;

import java.util.List;

public class NotificationMapper {
    public static NotificationDto mapToNotificationDto(
            Notification notification,
            BookingDto bookingDto) {

        NotificationDto notificationDto = new NotificationDto();
        notificationDto.setId(notification.getId());
        notificationDto.setType(notification.getType());
        notificationDto.setDescription(notification.getDescription());
        notificationDto.setSalonId(notification.getSalonId());
        notificationDto.setBookingId(notification.getBookingId());
        notificationDto.setWasRead(notification.getWasRead());
        notificationDto.setUserId(notification.getUserId());
        notificationDto.setCreatedAt(notification.getCreatedAt());
        return notificationDto;
    }

    public static List<NotificationDto> mapToNotificationDtoList(List<Notification> notifications, BookingFeignClient bookingFeignClient) {
        return notifications.stream()
                .map(notification -> NotificationMapper.mapToNotificationDto(
                        notification,
                        bookingFeignClient.getBookingById(notification.getBookingId()).getBody()
                )).toList();
    }
}
