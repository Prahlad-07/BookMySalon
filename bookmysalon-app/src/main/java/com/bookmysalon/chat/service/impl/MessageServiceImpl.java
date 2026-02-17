/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-15
 */
package com.bookmysalon.chat.service.impl;

import com.bookmysalon.chat.dto.ConversationDto;
import com.bookmysalon.chat.dto.MessageDto;
import com.bookmysalon.chat.entity.Conversation;
import com.bookmysalon.chat.entity.Message;
import com.bookmysalon.chat.entity.MessageStatus;
import com.bookmysalon.chat.repository.ConversationRepository;
import com.bookmysalon.chat.repository.MessageRepository;
import com.bookmysalon.chat.service.MessageService;
import com.bookmysalon.chat.service.PresenceService;
import com.bookmysalon.entity.NotificationType;
import com.bookmysalon.entity.User;
import com.bookmysalon.entity.UserRole;
import com.bookmysalon.repository.UserRepository;
import com.bookmysalon.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class MessageServiceImpl implements MessageService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final PresenceService presenceService;
    private final NotificationService notificationService;

    @Override
    public ConversationDto getOrCreateConversation(Long currentUserId, Long participantId) {
        if (currentUserId.equals(participantId)) {
            throw new IllegalArgumentException("Cannot start conversation with yourself");
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Current user not found"));
        User participant = userRepository.findById(participantId)
                .orElseThrow(() -> new IllegalArgumentException("Participant user not found"));

        Long customerId;
        Long salonOwnerId;

        if (isSalonOwner(currentUser) && isCustomer(participant)) {
            customerId = participantId;
            salonOwnerId = currentUserId;
        } else if (isCustomer(currentUser) && isSalonOwner(participant)) {
            customerId = currentUserId;
            salonOwnerId = participantId;
        } else {
            throw new IllegalArgumentException("Conversation must be between CUSTOMER and SALON_OWNER");
        }

        Conversation conversation = conversationRepository
                .findByCustomerIdAndSalonOwnerId(customerId, salonOwnerId)
                .orElseGet(() -> conversationRepository.save(buildConversation(customerId, salonOwnerId)));

        return mapConversation(conversation, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationDto> getConversations(Long currentUserId) {
        return conversationRepository.findAllForUser(currentUserId)
                .stream()
                .map(conversation -> {
                    Message latestMessage = messageRepository
                            .findByConversationIdOrderByCreatedAtDesc(conversation.getId(), PageRequest.of(0, 1))
                            .stream()
                            .findFirst()
                            .orElse(null);
                    return mapConversation(conversation, latestMessage);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDto> getChatHistory(Long currentUserId, Long conversationId, int limit) {
        ensureParticipant(conversationId, currentUserId);

        int safeLimit = Math.max(1, Math.min(limit, 200));

        List<MessageDto> messages = messageRepository
                .findByConversationIdOrderByCreatedAtDesc(conversationId, PageRequest.of(0, safeLimit))
                .stream()
                .map(this::mapMessage)
                .sorted(Comparator.comparing(MessageDto::getCreatedAt))
                .toList();

        return messages;
    }

    @Override
    public MessageDto sendMessage(Long currentUserId,
                                  Long conversationId,
                                  Long receiverId,
                                  String content,
                                  String clientMessageId) {
        ensureParticipant(conversationId, currentUserId);
        ensureParticipant(conversationId, receiverId);

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Message content cannot be blank");
        }

        if (clientMessageId != null && !clientMessageId.isBlank()) {
            Message existing = messageRepository.findByClientMessageId(clientMessageId).orElse(null);
            if (existing != null && existing.getSenderId().equals(currentUserId)) {
                return mapMessage(existing);
            }
        }

        Message message = new Message();
        message.setConversationId(conversationId);
        message.setSenderId(currentUserId);
        message.setReceiverId(receiverId);
        message.setContent(content.trim());
        message.setClientMessageId(clientMessageId == null || clientMessageId.isBlank() ? null : clientMessageId.trim());
        message.setStatus(MessageStatus.SENT);

        Message saved = messageRepository.save(message);

        if (presenceService.isOnline(receiverId)) {
            saved.setStatus(MessageStatus.DELIVERED);
            saved.setDeliveredAt(LocalDateTime.now());
            saved = messageRepository.save(saved);
        }

        notificationService.createAndPushNotification(
                receiverId,
                NotificationType.NEW_MESSAGE,
                "You have a new message",
                null,
                saved.getConversationId(),
                saved.getId()
        );

        return mapMessage(saved);
    }

    @Override
    public void markConversationRead(Long currentUserId, Long conversationId) {
        ensureParticipant(conversationId, currentUserId);

        List<Message> unreadMessages = messageRepository
                .findByConversationIdAndReceiverIdAndStatusNot(conversationId, currentUserId, MessageStatus.READ);

        LocalDateTime now = LocalDateTime.now();
        unreadMessages.forEach(message -> {
            message.setStatus(MessageStatus.READ);
            message.setReadAt(now);
            if (message.getDeliveredAt() == null) {
                message.setDeliveredAt(now);
            }
        });

        if (!unreadMessages.isEmpty()) {
            messageRepository.saveAll(unreadMessages);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadMessageCount(Long currentUserId) {
        return messageRepository.countByReceiverIdAndStatusNot(currentUserId, MessageStatus.READ);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isParticipant(Long conversationId, Long userId) {
        return conversationRepository.isParticipant(conversationId, userId);
    }

    private Conversation buildConversation(Long customerId, Long salonOwnerId) {
        Conversation conversation = new Conversation();
        conversation.setCustomerId(customerId);
        conversation.setSalonOwnerId(salonOwnerId);
        return conversation;
    }

    private void ensureParticipant(Long conversationId, Long userId) {
        if (!conversationRepository.isParticipant(conversationId, userId)) {
            throw new AccessDeniedException("You are not allowed to access this conversation");
        }
    }

    private boolean isSalonOwner(User user) {
        if (user.getRole() == UserRole.SALON_OWNER) {
            return true;
        }
        return user.getRoles() != null && user.getRoles().stream()
                .filter(Objects::nonNull)
                .anyMatch(role -> role.getName() == UserRole.SALON_OWNER);
    }

    private boolean isCustomer(User user) {
        if (user.getRole() == UserRole.CUSTOMER || user.getRole() == UserRole.USER) {
            return true;
        }
        return user.getRoles() != null && user.getRoles().stream()
                .filter(Objects::nonNull)
                .anyMatch(role -> role.getName() == UserRole.CUSTOMER || role.getName() == UserRole.USER);
    }

    private MessageDto mapMessage(Message message) {
        return MessageDto.builder()
                .id(message.getId())
                .conversationId(message.getConversationId())
                .senderId(message.getSenderId())
                .receiverId(message.getReceiverId())
                .content(message.getContent())
                .clientMessageId(message.getClientMessageId())
                .status(message.getStatus())
                .createdAt(message.getCreatedAt())
                .deliveredAt(message.getDeliveredAt())
                .readAt(message.getReadAt())
                .build();
    }

    private ConversationDto mapConversation(Conversation conversation, Message latestMessage) {
        return ConversationDto.builder()
                .id(conversation.getId())
                .customerId(conversation.getCustomerId())
                .salonOwnerId(conversation.getSalonOwnerId())
                .lastMessage(latestMessage == null ? null : mapMessage(latestMessage))
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }
}
