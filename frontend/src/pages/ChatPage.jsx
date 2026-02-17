/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Send, Wifi, WifiOff } from 'lucide-react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const byCreatedAt = (a, b) => new Date(a.createdAt || Date.now()).getTime() - new Date(b.createdAt || Date.now()).getTime();

const getMessageKey = (message) => {
  if (message.id) return `id-${message.id}`;
  if (message.clientMessageId) return `cid-${message.clientMessageId}`;
  return `tmp-${message.createdAt}-${message.senderId}`;
};

export default function ChatPage() {
  const { participantId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connected, subscribeToConversation, sendMessage, markConversationRead, unread } = useChat();

  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const bottomRef = useRef(null);

  const activeOtherUserId = useMemo(() => {
    if (!conversation || !user?.id) return null;
    return conversation.customerId === user.id ? conversation.salonOwnerId : conversation.customerId;
  }, [conversation, user?.id]);

  const loadConversations = async () => {
    const data = await api.get('/api/chat/conversations');
    setConversations(Array.isArray(data) ? data : []);
  };

  const openConversation = async (targetParticipantId) => {
    if (!targetParticipantId) return;

    const convo = await api.post(`/api/chat/conversations/with/${targetParticipantId}`);
    setConversation(convo);

    const history = await api.get(`/api/chat/conversations/${convo.id}/messages?limit=100`);
    const normalized = (Array.isArray(history) ? history : []).sort(byCreatedAt);
    setMessages(normalized);

    await markConversationRead(convo.id);
    setError('');
  };

  useEffect(() => {
    if (!user?.id) return;

    const run = async () => {
      try {
        setLoading(true);
        await loadConversations();

        if (participantId) {
          await openConversation(participantId);
        }
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load chat data');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user?.id, participantId]);

  useEffect(() => {
    if (!conversation?.id || !connected) return;

    const unsubscribe = subscribeToConversation(conversation.id, async (incoming) => {
      setMessages((prev) => {
        const idxById = incoming.id ? prev.findIndex((item) => item.id === incoming.id) : -1;
        if (idxById >= 0) {
          const next = [...prev];
          next[idxById] = { ...next[idxById], ...incoming };
          return next.sort(byCreatedAt);
        }

        const idxByClientId = incoming.clientMessageId
          ? prev.findIndex((item) => item.clientMessageId && item.clientMessageId === incoming.clientMessageId)
          : -1;

        if (idxByClientId >= 0) {
          const next = [...prev];
          next[idxByClientId] = { ...next[idxByClientId], ...incoming };
          return next.sort(byCreatedAt);
        }

        return [...prev, incoming].sort(byCreatedAt);
      });

      if (incoming.receiverId === user?.id) {
        await markConversationRead(conversation.id);
      }
    });

    return () => unsubscribe();
  }, [conversation?.id, connected, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSend = async (e) => {
    e.preventDefault();
    if (!conversation?.id || !activeOtherUserId || !text.trim()) return;

    const content = text.trim();
    const clientMessageId = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const optimistic = {
      id: null,
      conversationId: conversation.id,
      senderId: user.id,
      receiverId: activeOtherUserId,
      content,
      clientMessageId,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic].sort(byCreatedAt));
    setText('');

    try {
      sendMessage({
        conversationId: conversation.id,
        receiverId: activeOtherUserId,
        content,
        clientMessageId,
      });
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => getMessageKey(msg) !== getMessageKey(optimistic)));
      setText(content);
      setError(err?.message || 'Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-base rounded-2xl p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-slate-900">Chats</h1>
            <span className="text-xs text-slate-600">Unread: {unread.unreadMessages}</span>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-auto">
            {conversations.length === 0 && <p className="text-slate-600">No conversations yet.</p>}
            {conversations.map((item) => {
              const otherUserId = item.customerId === user?.id ? item.salonOwnerId : item.customerId;
              const active = conversation?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigate(`/chat/${otherUserId}`);
                    openConversation(otherUserId);
                  }}
                  className={`w-full text-left rounded-xl border px-3 py-3 ${active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
                >
                  <p className="font-semibold text-slate-900">User #{otherUserId}</p>
                  <p className="text-sm text-slate-600 truncate">{item.lastMessage?.content || 'No messages yet'}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card-base rounded-2xl p-4 lg:col-span-2 flex flex-col h-[75vh]">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <p className="text-slate-600 text-sm">Conversation</p>
              <p className="font-semibold text-slate-900">{conversation ? `#${conversation.id}` : 'Select a chat'}</p>
            </div>
            <div className="text-sm flex items-center gap-2 text-slate-600">
              {connected ? <Wifi size={16} className="text-emerald-600" /> : <WifiOff size={16} className="text-red-600" />}
              {connected ? 'Connected' : 'Reconnecting'}
            </div>
          </div>

          {error && <div className="mt-3 rounded-lg border border-red-300 bg-red-50 text-red-700 p-3 text-sm">{error}</div>}

          <div className="flex-1 overflow-auto space-y-2 py-4">
            {messages.map((message) => (
              <div key={getMessageKey(message)} className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-xl px-3 py-2 ${message.senderId === user?.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  <p>{message.content}</p>
                  <p className={`text-[11px] mt-1 ${message.senderId === user?.id ? 'text-blue-100' : 'text-slate-500'}`}>
                    {new Date(message.createdAt || Date.now()).toLocaleTimeString()} • {message.status}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {conversation ? (
            <form onSubmit={onSend} className="border-t border-slate-200 pt-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input-field"
                placeholder="Type your message"
                maxLength={2000}
              />
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={!connected || !text.trim()}>
                <Send size={16} /> Send
              </button>
            </form>
          ) : (
            <div className="border-t border-slate-200 pt-3 text-slate-600 text-sm">
              Open a conversation from list or start from <Link className="text-blue-700 underline" to="/bookings">My Bookings</Link>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
