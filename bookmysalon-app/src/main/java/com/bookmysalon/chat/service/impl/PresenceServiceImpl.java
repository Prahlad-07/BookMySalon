/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-15
 */
package com.bookmysalon.chat.service.impl;

import com.bookmysalon.chat.service.PresenceService;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PresenceServiceImpl implements PresenceService {

    private final ConcurrentHashMap<Long, AtomicInteger> onlineUsers = new ConcurrentHashMap<>();

    @Override
    public void onConnect(Long userId) {
        onlineUsers.compute(userId, (id, count) -> {
            if (count == null) {
                return new AtomicInteger(1);
            }
            count.incrementAndGet();
            return count;
        });
    }

    @Override
    public void onDisconnect(Long userId) {
        onlineUsers.computeIfPresent(userId, (id, count) -> {
            if (count.decrementAndGet() <= 0) {
                return null;
            }
            return count;
        });
    }

    @Override
    public boolean isOnline(Long userId) {
        AtomicInteger count = onlineUsers.get(userId);
        return count != null && count.get() > 0;
    }
}
