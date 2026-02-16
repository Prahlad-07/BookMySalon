package com.bookmysalon.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConversationDto {
    private Long id;
    private Long customerId;
    private Long salonOwnerId;
    private MessageDto lastMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
