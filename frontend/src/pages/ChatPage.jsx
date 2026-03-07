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

const toNumericId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

  const isSelfParticipant = (targetParticipantId) => {
    const targetId = toNumericId(targetParticipantId);
    const currentUserId = toNumericId(user?.id);
    return targetId != null && currentUserId != null && targetId === currentUserId;
  };

  const openConversation = async (targetParticipantId) => {
    if (!targetParticipantId) return;
    if (isSelfParticipant(targetParticipantId)) {
      setConversation(null);
      setMessages([]);
      setError('Open a chat with another user from bookings or owner console.');
      return;
    }

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
        if (participantId && isSelfParticipant(participantId)) {
          setError('You cannot start a conversation with yourself.');
          navigate('/chat', { replace: true });
          return;
        }
        if (participantId) {
          await openConversation(participantId);
        } else {
          setError('');
        }
      } catch (err) {
        const errorMessage = err?.response?.data?.error || 'Failed to load chat data';
        if (String(errorMessage).toLowerCase().includes('yourself')) {
          setError('You cannot start a conversation with yourself.');
          navigate('/chat', { replace: true });
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user?.id, participantId]);

  useEffect(() => {
    if (!conversation?.id || !connected) return;

    const unsubscribe = subscribeToConversation(conversation.id, async (incoming) => {
      setMessages((previous) => {
        const indexById = incoming.id ? previous.findIndex((item) => item.id === incoming.id) : -1;
        if (indexById >= 0) {
          const next = [...previous];
          next[indexById] = { ...next[indexById], ...incoming };
          return next.sort(byCreatedAt);
        }

        const indexByClientId = incoming.clientMessageId
          ? previous.findIndex((item) => item.clientMessageId && item.clientMessageId === incoming.clientMessageId)
          : -1;

        if (indexByClientId >= 0) {
          const next = [...previous];
          next[indexByClientId] = { ...next[indexByClientId], ...incoming };
          return next.sort(byCreatedAt);
        }

        return [...previous, incoming].sort(byCreatedAt);
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

  const onSend = async (event) => {
    event.preventDefault();
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

    setMessages((previous) => [...previous, optimistic].sort(byCreatedAt));
    setText('');

    try {
      sendMessage({
        conversationId: conversation.id,
        receiverId: activeOtherUserId,
        content,
        clientMessageId,
      });
    } catch (err) {
      setMessages((previous) => previous.filter((message) => getMessageKey(message) !== getMessageKey(optimistic)));
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
        <aside className="card-base rounded-2xl p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-slate-900">Chats</h1>
            <span className="status-pill status-pending">Unread {unread.unreadMessages}</span>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
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
                  }}
                  className={`w-full text-left rounded-xl border px-3 py-3 transition ${
                    active
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-semibold text-slate-900">User #{otherUserId}</p>
                  <p className="text-sm text-slate-600 truncate">{item.lastMessage?.content || 'No messages yet'}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="card-base rounded-2xl p-4 lg:col-span-2 flex flex-col h-[76vh]">
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

          {error && <div className="notice-box notice-error mt-3">{error}</div>}

          <div className="flex-1 overflow-auto space-y-2 py-4 pr-1">
            {messages.map((message) => {
              const ownMessage = message.senderId === user?.id;
              return (
                <div key={getMessageKey(message)} className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 ${
                      ownMessage ? 'bg-primary-600 text-white' : 'surface-muted text-slate-900'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-[11px] mt-1 ${ownMessage ? 'text-blue-100' : 'text-slate-500'}`}>
                      {new Date(message.createdAt || Date.now()).toLocaleTimeString()} • {message.status}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {conversation ? (
            <form onSubmit={onSend} className="border-t border-slate-200 pt-3 flex gap-2">
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="input-field"
                placeholder="Type your message"
                maxLength={2000}
              />
              <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={!connected || !text.trim()}>
                <Send size={16} /> Send
              </button>
            </form>
          ) : (
            <div className="border-t border-slate-200 pt-3 text-slate-600 text-sm">
              Open a conversation from the list or start from{' '}
              <Link className="text-blue-700 underline" to="/bookings">
                My Bookings
              </Link>
              .
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
