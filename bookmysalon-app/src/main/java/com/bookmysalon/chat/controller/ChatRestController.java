package com.bookmysalon.chat.controller;

import com.bookmysalon.chat.dto.ConversationDto;
import com.bookmysalon.chat.dto.MessageDto;
import com.bookmysalon.chat.dto.UnreadCountDto;
import com.bookmysalon.dto.NotificationDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.security.CustomUserPrincipal;
import com.bookmysalon.service.NotificationService;
import com.bookmysalon.chat.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final MessageService messageService;
    private final NotificationService notificationService;

    @PostMapping("/conversations/with/{participantId}")
    public ResponseEntity<ApiResponse<ConversationDto>> getOrCreateConversation(@PathVariable Long participantId) {
        Long currentUserId = currentUserId();
        ConversationDto conversation = messageService.getOrCreateConversation(currentUserId, participantId);
        return ResponseEntity.ok(ApiResponse.<ConversationDto>builder().success(true).data(conversation).build());
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationDto>>> getConversations() {
        Long currentUserId = currentUserId();
        List<ConversationDto> conversations = messageService.getConversations(currentUserId);
        return ResponseEntity.ok(ApiResponse.<List<ConversationDto>>builder().success(true).data(conversations).build());
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<List<MessageDto>>> getChatHistory(@PathVariable Long conversationId,
                                                                        @RequestParam(defaultValue = "50") int limit) {
        Long currentUserId = currentUserId();
        List<MessageDto> messages = messageService.getChatHistory(currentUserId, conversationId, limit);
        return ResponseEntity.ok(ApiResponse.<List<MessageDto>>builder().success(true).data(messages).build());
    }

    @PutMapping("/conversations/{conversationId}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long conversationId) {
        Long currentUserId = currentUserId();
        messageService.markConversationRead(currentUserId, conversationId);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Conversation marked as read").build());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<UnreadCountDto>> getUnreadCounts() {
        Long currentUserId = currentUserId();

        UnreadCountDto unreadCount = UnreadCountDto.builder()
                .unreadMessages(messageService.getUnreadMessageCount(currentUserId))
                .unreadNotifications(notificationService.getUnreadNotificationCount(currentUserId))
                .build();

        return ResponseEntity.ok(ApiResponse.<UnreadCountDto>builder().success(true).data(unreadCount).build());
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getNotifications(@RequestParam(defaultValue = "30") int limit) {
        Long currentUserId = currentUserId();
        List<NotificationDto> notifications = notificationService.getNotificationsByUserId(currentUserId, limit);
        return ResponseEntity.ok(ApiResponse.<List<NotificationDto>>builder().success(true).data(notifications).build());
    }

    @PutMapping("/notifications/{notificationId}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markNotificationRead(@PathVariable Long notificationId) {
        Long currentUserId = currentUserId();
        NotificationDto notification = notificationService.markAsRead(notificationId, currentUserId);
        return ResponseEntity.ok(ApiResponse.<NotificationDto>builder().success(true).data(notification).build());
    }

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return principal.getId();
    }
}
