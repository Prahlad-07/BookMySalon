package com.bookmysalon.chat.websocket;

import java.security.Principal;

public class WsUserPrincipal implements Principal {

    private final Long userId;
    private final String username;

    public WsUserPrincipal(Long userId, String username) {
        this.userId = userId;
        this.username = username;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    @Override
    public String getName() {
        return String.valueOf(userId);
    }
}
