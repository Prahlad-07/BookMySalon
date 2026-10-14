/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import api from '../config/api';
import { buildWebSocketUrl } from '../config/apiBaseUrl';
import { getAccessToken } from '../utils/authSession';
import { useAuth } from './AuthContext';
import { apiModeReady, isMockMode } from '../mock/mode';
import { bus } from '../mock/realtime';

const ChatContext = createContext(null);

/*
 * Native WebSocket on the endpoint's raw transport (/ws/chat/websocket). SockJS's /info
 * probe is a credentialed XHR, which the API's cookie-free CORS policy (rightly) refuses
 * cross-origin — so with the frontend and API on different hosts it could never connect.
 */
const socketUrl = (token) => {
  const url = new URL(buildWebSocketUrl('/ws/chat/websocket', { token }), window.location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
};

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState({ unreadMessages: 0, unreadNotifications: 0 });
  const [notifications, setNotifications] = useState([]);

  const clientRef = useRef(null);
  const notificationSubscriptionRef = useRef(null);

  const refreshUnreadCounts = useCallback(async () => {
    if (!user?.id) return;
    try {
      const counts = await api.get('/api/chat/unread-count');
      setUnread({
        unreadMessages: counts?.unreadMessages || 0,
        unreadNotifications: counts?.unreadNotifications || 0,
      });
    } catch (error) {
      console.warn('Unable to refresh unread chat counts', error);
    }
  }, [user?.id]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await api.get('/api/chat/notifications?limit=20');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Unable to fetch chat notifications', error);
    }
  }, [user?.id]);

  useEffect(() => {
    const token = getAccessToken();

    if (!token || !user?.id) {
      setConnected(false);
      setUnread({ unreadMessages: 0, unreadNotifications: 0 });
      setNotifications([]);
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      return;
    }

    // Demo mode: no socket — messages and notifications travel over an in-page bus.
    let cancelled = false;
    let stopDemo = null;
    apiModeReady.then(() => {
      if (cancelled || !isMockMode()) return;
      setConnected(true);
      refreshUnreadCounts();
      fetchNotifications();
      stopDemo = bus.onNotification(user.id, (payload) => {
        setNotifications((prev) => [payload, ...prev.filter((item) => item.id !== payload.id)].slice(0, 50));
        setUnread((prev) => ({ ...prev, unreadNotifications: prev.unreadNotifications + 1 }));
      });
    });

    const client = new Client({
      webSocketFactory: () => new WebSocket(socketUrl(token)),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      onConnect: () => {
        setConnected(true);
        refreshUnreadCounts();
        fetchNotifications();

        notificationSubscriptionRef.current = client.subscribe('/user/queue/notifications', (frame) => {
          const payload = JSON.parse(frame.body);
          setNotifications((prev) => [payload, ...prev.filter((item) => item.id !== payload.id)].slice(0, 50));
          setUnread((prev) => ({
            unreadMessages: prev.unreadMessages,
            unreadNotifications: prev.unreadNotifications + 1,
          }));
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onWebSocketClose: () => {
        setConnected(false);
      },
      onStompError: () => {
        setConnected(false);
      },
      onWebSocketError: () => {
        setConnected(false);
      },
    });

    const startSocket = () => {
      if (cancelled || isMockMode()) return;
      try {
        client.activate();
        clientRef.current = client;
      } catch (error) {
        console.warn('Unable to activate chat WebSocket', error);
        setConnected(false);
        clientRef.current = null;
      }
    };
    apiModeReady.then(startSocket);

    return () => {
      cancelled = true;
      stopDemo?.();
      if (notificationSubscriptionRef.current) {
        notificationSubscriptionRef.current.unsubscribe();
      }
      client.deactivate();
      setConnected(false);
    };
  }, [fetchNotifications, refreshUnreadCounts, user?.id]);

  const subscribeToConversation = useCallback((conversationId, onMessage) => {
    if (isMockMode()) return bus.onMessage(conversationId, onMessage);
    if (!clientRef.current?.connected) {
      return () => {};
    }

    const subscription = clientRef.current.subscribe(`/topic/messages/${conversationId}`, (frame) => {
      const payload = JSON.parse(frame.body);
      onMessage(payload);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendMessage = useCallback((payload) => {
    if (isMockMode()) {
      import('../mock/handlers')
        .then(({ sendChatMessage }) => sendChatMessage(getAccessToken(), payload))
        .catch((error) => console.warn('Demo message not sent', error));
      return;
    }
    if (!clientRef.current?.connected) {
      throw new Error('WebSocket is not connected');
    }

    clientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload),
    });
  }, []);

  const markConversationRead = useCallback(async (conversationId) => {
    await api.put(`/api/chat/conversations/${conversationId}/read`);
    await refreshUnreadCounts();
  }, [refreshUnreadCounts]);

  const markNotificationRead = useCallback(async (notificationId) => {
    await api.put(`/api/chat/notifications/${notificationId}/read`);
    setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, wasRead: true } : item)));
    setUnread((prev) => ({
      unreadMessages: prev.unreadMessages,
      unreadNotifications: Math.max(0, prev.unreadNotifications - 1),
    }));
  }, []);

  const value = useMemo(
    () => ({
      connected,
      unread,
      notifications,
      refreshUnreadCounts,
      fetchNotifications,
      subscribeToConversation,
      sendMessage,
      markConversationRead,
      markNotificationRead,
    }),
    [
      connected,
      unread,
      notifications,
      refreshUnreadCounts,
      fetchNotifications,
      subscribeToConversation,
      sendMessage,
      markConversationRead,
      markNotificationRead,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
