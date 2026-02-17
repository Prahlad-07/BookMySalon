/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../config/api';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const SockJsCtor = SockJS?.default || SockJS;

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState({ unreadMessages: 0, unreadNotifications: 0 });
  const [notifications, setNotifications] = useState([]);

  const clientRef = useRef(null);
  const notificationSubscriptionRef = useRef(null);

  const refreshUnreadCounts = async () => {
    if (!user?.id) return;
    try {
      const counts = await api.get('/api/chat/unread-count');
      setUnread({
        unreadMessages: counts?.unreadMessages || 0,
        unreadNotifications: counts?.unreadNotifications || 0,
      });
    } catch (_) {
    }
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const data = await api.get('/api/chat/notifications?limit=20');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (_) {
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

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

    const client = new Client({
      webSocketFactory: () => {
        if (!SockJsCtor) {
          throw new Error('SockJS client not available');
        }
        return new SockJsCtor(`${API_BASE_URL}/ws/chat?token=${encodeURIComponent(token)}`);
      },
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

    try {
      client.activate();
      clientRef.current = client;
    } catch (_) {
      setConnected(false);
      clientRef.current = null;
      return () => {};
    }

    return () => {
      if (notificationSubscriptionRef.current) {
        notificationSubscriptionRef.current.unsubscribe();
      }
      client.deactivate();
      setConnected(false);
    };
  }, [user?.id]);

  const subscribeToConversation = (conversationId, onMessage) => {
    if (!clientRef.current?.connected) {
      return () => {};
    }

    const subscription = clientRef.current.subscribe(`/topic/messages/${conversationId}`, (frame) => {
      const payload = JSON.parse(frame.body);
      onMessage(payload);
    });

    return () => subscription.unsubscribe();
  };

  const sendMessage = (payload) => {
    if (!clientRef.current?.connected) {
      throw new Error('WebSocket is not connected');
    }

    clientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload),
    });
  };

  const markConversationRead = async (conversationId) => {
    await api.put(`/api/chat/conversations/${conversationId}/read`);
    await refreshUnreadCounts();
  };

  const markNotificationRead = async (notificationId) => {
    await api.put(`/api/chat/notifications/${notificationId}/read`);
    setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, wasRead: true } : item)));
    setUnread((prev) => ({
      unreadMessages: prev.unreadMessages,
      unreadNotifications: Math.max(0, prev.unreadNotifications - 1),
    }));
  };

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
    [connected, unread, notifications]
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
