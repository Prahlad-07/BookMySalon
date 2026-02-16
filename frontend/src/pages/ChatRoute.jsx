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
