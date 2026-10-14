/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-13
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Avatar } from '../components/ui';
import { useT } from '../i18n';
import { formatDate, formatTime, intlLocale } from '../i18n/format';

const byCreatedAt = (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
const keyOf = (m) => (m.id ? `id-${m.id}` : `cid-${m.clientMessageId}`);
const toId = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

const dayLabel = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const offset = d.toDateString() === today.toDateString() ? 0 : d.toDateString() === yesterday.toDateString() ? -1 : null;
  if (offset == null) return formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' });
  const text = new Intl.RelativeTimeFormat(intlLocale(), { numeric: 'auto' }).format(offset, 'day');
  return text.charAt(0).toLocaleUpperCase(intlLocale()) + text.slice(1);
};
const clock = (iso) => formatTime(iso || Date.now());
const shortWhen = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? clock(iso) : formatDate(d, { day: 'numeric', month: 'short' });
};
const STATUS_KEY = { SENDING: 'chat.sending', READ: 'chat.read', DELIVERED: 'chat.delivered' };

export default function ChatPage() {
  const { participantId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connected, subscribeToConversation, sendMessage, markConversationRead } = useChat();
  const t = useT();

  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const otherOf = useCallback(
    (c) =>
      c && Number(c.customerId) === Number(user?.id)
        ? { id: c.salonOwnerId, name: c.salonOwnerName || t('chat.salon') }
        : { id: c?.customerId, name: c?.customerName || t('chat.client') },
    [user?.id, t]
  );

  const loadConversations = useCallback(async () => {
    const data = await api.get('/api/chat/conversations');
    setConversations(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    loadConversations()
      .catch(() => setError(t('chat.err.list')))
      .finally(() => setLoadingList(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loadConversations]);

  useEffect(() => {
    if (!participantId || !user?.id) {
      setConversation(null);
      setMessages([]);
      return undefined;
    }
    if (toId(participantId) === Number(user.id)) {
      navigate('/chat', { replace: true });
      return undefined;
    }
    let active = true;
    (async () => {
      try {
        setLoadingThread(true);
        setError('');
        const convo = await api.post(`/api/chat/conversations/with/${participantId}`);
        if (!active) return;
        setConversation(convo);
        const history = await api.get(`/api/chat/conversations/${convo.id}/messages?limit=100`);
        if (!active) return;
        setMessages((Array.isArray(history) ? history : []).sort(byCreatedAt));
        markConversationRead(convo.id).catch(() => {});
        loadConversations().catch(() => {});
      } catch (err) {
        if (active) setError(err?.response?.data?.error || t('chat.err.open'));
      } finally {
        if (active) setLoadingThread(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId, user?.id, navigate, markConversationRead, loadConversations]);

  useEffect(() => {
    if (!conversation?.id || !connected) return undefined;
    return subscribeToConversation(conversation.id, (incoming) => {
      setMessages((prev) => {
        const i = prev.findIndex(
          (m) => (incoming.id && m.id === incoming.id) || (incoming.clientMessageId && m.clientMessageId === incoming.clientMessageId)
        );
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], ...incoming };
          return next;
        }
        return [...prev, incoming].sort(byCreatedAt);
      });
      if (Number(incoming.receiverId) === Number(user?.id)) markConversationRead(conversation.id).catch(() => {});
      setConversations((prev) =>
        prev
          .map((c) => (c.id === conversation.id ? { ...c, lastMessage: incoming } : c))
          .sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0))
      );
    });
  }, [conversation?.id, connected, subscribeToConversation, markConversationRead, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const other = otherOf(conversation);

  const send = (event) => {
    event?.preventDefault();
    const content = text.trim();
    if (!content || !conversation?.id || !other.id) return;
    const clientMessageId = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic = {
      conversationId: conversation.id,
      senderId: user.id,
      receiverId: other.id,
      content,
      clientMessageId,
      status: 'SENDING',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    try {
      sendMessage({ conversationId: conversation.id, receiverId: other.id, content, clientMessageId });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.clientMessageId !== clientMessageId));
      setText(content);
      setError(t('chat.err.offline'));
    }
    inputRef.current?.focus();
  };

  const grouped = useMemo(() => {
    const out = [];
    let lastDay = '';
    messages.forEach((m) => {
      const day = new Date(m.createdAt || Date.now()).toDateString();
      if (day !== lastDay) {
        out.push({ divider: dayLabel(m.createdAt || Date.now()), key: `d-${day}` });
        lastDay = day;
      }
      out.push(m);
    });
    return out;
    // dayLabel reads the active language (module state), so regroup when `t` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, t]);

  const showThreadOnMobile = Boolean(participantId);

  return (
    <div className="shell !px-0 sm:!px-8">
      <div className="grid h-[calc(100vh-4rem)] grid-cols-1 border-line md:grid-cols-[320px_minmax(0,1fr)] md:border-x">
        {/* Conversation list */}
        <aside className={`flex min-h-0 flex-col border-r border-line ${showThreadOnMobile ? 'hidden md:flex' : 'flex'}`}>
          <div className="border-b border-line px-5 py-5">
            <h1 className="display text-[22px] leading-none text-ink">{t('nav.messages')}</h1>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {loadingList ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="skeleton h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="skeleton h-3.5 w-1/2" />
                      <div className="skeleton h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-5 py-12 text-sm leading-relaxed text-ink-2">
                <p className="font-semibold text-ink">{t('chat.empty')}</p>
                <p className="mt-1">{user?.role === 'SALON_OWNER' ? t('chat.emptyOwner') : t('chat.emptyCustomer')}</p>
              </div>
            ) : (
              conversations.map((c) => {
                const o = otherOf(c);
                const active = conversation?.id === c.id;
                const unread =
                  c.lastMessage && Number(c.lastMessage.receiverId) === Number(user?.id) && c.lastMessage.status !== 'READ';
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/chat/${o.id}`)}
                    className={`flex w-full gap-3 border-b border-line px-5 py-4 text-left transition ${
                      active ? 'bg-sunken' : 'hover:bg-sunken/60'
                    }`}
                  >
                    <Avatar name={o.name} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${unread ? 'font-semibold text-ink' : 'font-medium text-ink'}`}>
                          {o.name}
                        </span>
                        <span className="shrink-0 text-[11.5px] text-ink-3">{shortWhen(c.lastMessage?.createdAt)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className={`truncate text-[13px] ${unread ? 'text-ink' : 'text-ink-3'}`}>
                          {c.lastMessage
                            ? Number(c.lastMessage.senderId) === Number(user?.id)
                              ? t('chat.youPrefix', { text: c.lastMessage.content })
                              : c.lastMessage.content
                            : t('chat.noMessages')}
                        </span>
                        {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-label={t('chat.unread')} />}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className={`min-h-0 flex-col ${showThreadOnMobile ? 'flex' : 'hidden md:flex'}`}>
          {!conversation && !loadingThread ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <p className="display text-[22px] text-ink">{t('chat.pick')}</p>
              <p className="mt-2 max-w-xs text-sm text-ink-2">
                {user?.role === 'SALON_OWNER' ? t('chat.pickOwner') : t('chat.pickCustomer')}
              </p>
              {error && <p className="mt-4 text-sm text-danger">{error}</p>}
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-line px-5 py-3.5">
                <Link to="/chat" className="icon-btn -ml-2 md:hidden" aria-label={t('chat.back')}>
                  <ArrowLeft size={18} />
                </Link>
                {conversation && <Avatar name={other.name} size={36} />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{conversation ? other.name : `${t('common.loading')}…`}</p>
                  <p className="flex items-center gap-1.5 text-[12px] text-ink-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-success' : 'bg-warning'}`} />
                    {connected ? t('chat.live') : t('chat.reconnecting')}
                  </p>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-6 scrollbar-thin" aria-live="polite">
                {loadingThread ? (
                  <div className="flex h-full items-center justify-center">
                    <span className="spinner" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="mt-10 text-center text-sm text-ink-3">{t('chat.start')}</p>
                ) : (
                  <div className="mx-auto max-w-2xl space-y-1.5">
                    {grouped.map((item, i) => {
                      if (item.divider) {
                        return (
                          <div key={item.key} className="flex items-center gap-3 py-4 text-[11.5px] font-medium text-ink-3">
                            <span className="h-px flex-1 bg-line" />
                            {item.divider}
                            <span className="h-px flex-1 bg-line" />
                          </div>
                        );
                      }
                      const mine = Number(item.senderId) === Number(user?.id);
                      const next = grouped[i + 1];
                      const lastInRun = !next || next.divider || Number(next.senderId) !== Number(item.senderId);
                      return (
                        <div key={keyOf(item)} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`max-w-[78%] whitespace-pre-wrap break-words rounded-[14px] px-3.5 py-2 text-[14.5px] leading-relaxed ${
                              mine ? 'bg-ink text-paper' : 'border border-line bg-surface text-ink'
                            } ${mine && lastInRun ? 'rounded-br-[4px]' : ''} ${!mine && lastInRun ? 'rounded-bl-[4px]' : ''}`}
                          >
                            {item.content}
                          </div>
                          {lastInRun && (
                            <span className="mt-1 px-1 text-[11px] text-ink-3">
                              {clock(item.createdAt)}
                              {mine &&
                                ` · ${t(STATUS_KEY[item.status] || 'chat.sent')}`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {error && conversation && <p className="px-5 pb-2 text-sm text-danger">{error}</p>}

              <form onSubmit={send} className="border-t border-line p-3 sm:p-4">
                <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-lg border border-line-strong bg-surface p-1.5 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/15">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={text}
                    maxLength={2000}
                    onChange={(e) => {
                      setText(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={connected ? t('chat.placeholder', { name: other.name }) : t('chat.connecting')}
                    className="max-h-[140px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[14.5px] text-ink placeholder:text-ink-3 focus:outline-none"
                    aria-label={t('salon.message')}
                    disabled={!conversation}
                  />
                  <button
                    type="submit"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-paper transition hover:bg-ink/85 disabled:opacity-30"
                    disabled={!text.trim() || !connected}
                    aria-label={t('chat.send')}
                  >
                    <ArrowUp size={17} />
                  </button>
                </div>
                <p className="mx-auto mt-1.5 hidden max-w-2xl px-1 text-[11px] text-ink-3 sm:block">
                  {t('chat.hint')}
                </p>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
