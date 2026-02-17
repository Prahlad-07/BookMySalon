/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React from 'react';
import { ChatProvider } from '../context/ChatContext';
import ChatPage from './ChatPage';

export default function ChatRoute() {
  return (
    <ChatProvider>
      <ChatPage />
    </ChatProvider>
  );
}
