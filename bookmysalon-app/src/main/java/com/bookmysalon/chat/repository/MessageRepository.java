package com.bookmysalon.chat.repository;

import com.bookmysalon.chat.entity.Message;
import com.bookmysalon.chat.entity.MessageStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    List<Message> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);

    Optional<Message> findByClientMessageId(String clientMessageId);

    long countByReceiverIdAndStatusNot(Long receiverId, MessageStatus status);

    List<Message> findByConversationIdAndReceiverIdAndStatusNot(Long conversationId, Long receiverId, MessageStatus status);
}
