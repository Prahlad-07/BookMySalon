package com.bookmysalon.chat.service;

import com.bookmysalon.chat.dto.ConversationDto;
import com.bookmysalon.chat.dto.MessageDto;

import java.util.List;

public interface MessageService {
    ConversationDto getOrCreateConversation(Long currentUserId, Long participantId);
    List<ConversationDto> getConversations(Long currentUserId);
    List<MessageDto> getChatHistory(Long currentUserId, Long conversationId, int limit);
    MessageDto sendMessage(Long currentUserId, Long conversationId, Long receiverId, String content, String clientMessageId);
    void markConversationRead(Long currentUserId, Long conversationId);
    long getUnreadMessageCount(Long currentUserId);
    boolean isParticipant(Long conversationId, Long userId);
}
