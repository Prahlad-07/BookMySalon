package com.bookmysalon.chat.controller;

import com.bookmysalon.chat.dto.MessageDto;
import com.bookmysalon.chat.dto.SendMessageRequest;
import com.bookmysalon.chat.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void send(@Valid SendMessageRequest request, Principal principal) {
        Long senderId = Long.parseLong(principal.getName());

        MessageDto message = messageService.sendMessage(
                senderId,
                request.getConversationId(),
                request.getReceiverId(),
                request.getContent(),
                request.getClientMessageId()
        );

        messagingTemplate.convertAndSend("/topic/messages/" + message.getConversationId(), message);
    }
}
