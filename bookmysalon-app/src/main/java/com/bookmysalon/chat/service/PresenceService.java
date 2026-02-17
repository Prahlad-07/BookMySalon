/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-15
 */
package com.bookmysalon.chat.service;

public interface PresenceService {
    void onConnect(Long userId);
    void onDisconnect(Long userId);
    boolean isOnline(Long userId);
}
