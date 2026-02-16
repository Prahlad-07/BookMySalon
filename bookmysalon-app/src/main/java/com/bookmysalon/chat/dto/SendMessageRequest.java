package com.bookmysalon.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SendMessageRequest {

    @NotNull
    private Long conversationId;

    @NotNull
    private Long receiverId;

    @NotBlank
    private String content;

    private String clientMessageId;
}
