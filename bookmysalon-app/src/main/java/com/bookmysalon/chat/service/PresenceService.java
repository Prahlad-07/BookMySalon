package com.bookmysalon.chat.service;

public interface PresenceService {
    void onConnect(Long userId);
    void onDisconnect(Long userId);
    boolean isOnline(Long userId);
}
