package com.bookmysalon.chat.websocket;

import com.bookmysalon.chat.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
@RequiredArgsConstructor
public class WebSocketPresenceListener {

    private final PresenceService presenceService;

    @EventListener
    public void onConnected(SessionConnectedEvent event) {
        Long userId = extractUserId(StompHeaderAccessor.wrap(event.getMessage()).getUser());
        if (userId != null) {
            presenceService.onConnect(userId);
        }
    }

    @EventListener
    public void onDisconnected(SessionDisconnectEvent event) {
        Long userId = extractUserId(StompHeaderAccessor.wrap(event.getMessage()).getUser());
        if (userId != null) {
            presenceService.onDisconnect(userId);
        }
    }

    private Long extractUserId(Principal principal) {
        if (principal == null) {
            return null;
        }
        try {
            return Long.parseLong(principal.getName());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
