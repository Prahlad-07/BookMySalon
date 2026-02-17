/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-15
 */
package com.bookmysalon.chat.websocket;

import com.bookmysalon.chat.repository.ConversationRepository;
import com.bookmysalon.security.CustomUserPrincipal;
import com.bookmysalon.security.CustomUserDetailsService;
import com.bookmysalon.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final ConversationRepository conversationRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand()) && accessor.getUser() == null) {
            String token = extractToken(accessor);
            if (token == null || token.isBlank()) {
                throw new AccessDeniedException("Missing JWT token for WebSocket connection");
            }

            String username = jwtService.extractUsername(token);
            CustomUserPrincipal user = (CustomUserPrincipal) userDetailsService.loadUserByUsername(username);
            if (!jwtService.isTokenValid(token, user)) {
                throw new AccessDeniedException("Invalid JWT token for WebSocket connection");
            }

            accessor.setUser(new WsUserPrincipal(user.getId(), user.getUsername()));
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            validateTopicSubscription(accessor);
        }

        return message;
    }

    private void validateTopicSubscription(StompHeaderAccessor accessor) {
        if (accessor.getUser() == null) {
            throw new AccessDeniedException("Unauthenticated WebSocket subscription");
        }

        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith("/topic/messages/")) {
            return;
        }

        String conversationIdRaw = destination.substring("/topic/messages/".length());
        Long userId = Long.parseLong(accessor.getUser().getName());
        Long conversationId = Long.parseLong(conversationIdRaw);

        if (!conversationRepository.isParticipant(conversationId, userId)) {
            throw new AccessDeniedException("Not allowed to subscribe this conversation");
        }
    }

    private String extractToken(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String auth = authHeaders.get(0);
            if (auth != null && auth.startsWith(BEARER_PREFIX)) {
                return auth.substring(BEARER_PREFIX.length());
            }
        }

        List<String> tokenHeaders = accessor.getNativeHeader("token");
        if (tokenHeaders != null && !tokenHeaders.isEmpty()) {
            return tokenHeaders.get(0);
        }

        return null;
    }
}
