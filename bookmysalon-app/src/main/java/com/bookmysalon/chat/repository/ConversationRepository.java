/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-15
 */
package com.bookmysalon.chat.repository;

import com.bookmysalon.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByCustomerIdAndSalonOwnerId(Long customerId, Long salonOwnerId);

    @Query("""
            select c from Conversation c
            where c.customerId = :userId or c.salonOwnerId = :userId
            order by c.updatedAt desc
            """)
    List<Conversation> findAllForUser(@Param("userId") Long userId);

    @Query("""
            select count(c) > 0 from Conversation c
            where c.id = :conversationId and (c.customerId = :userId or c.salonOwnerId = :userId)
            """)
    boolean isParticipant(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}
