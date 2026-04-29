import { useEffect, useMemo, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';
import { aiChatApi, type AiChatMessage, type AiChatSession } from '../../utils/aiChatApi';
import { ChatWindow } from './ChatWindow';
import './chatbot.css';

function safeNowIso() {
  return new Date().toISOString();
}

function firstLineTitle(text: string) {
  const t = (text || '').trim().replace(/\s+/g, ' ');
  return t.length > 36 ? `${t.slice(0, 36)}…` : t || 'New chat';
}

export function ChatBotWidget() {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [isAiConnected, setIsAiConnected] = useState(true);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || null,
    [sessions, activeSessionId],
  );

  /* ── data helpers (unchanged) ── */
  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await aiChatApi.listSessions();
      setSessions(res.sessions || []);
      if (!activeSessionId && (res.sessions || []).length > 0) {
        setActiveSessionId(res.sessions[0].id);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load chats');
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    setLoadingMessages(true);
    try {
      const res = await aiChatApi.getMessages(sessionId);
      setMessages(res.messages || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await aiChatApi.checkHealth();
      setIsAiConnected(!!res.ollama);
    } catch {
      setIsAiConnected(false);
    }
  };

  useEffect(() => {
    loadSessions();
    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      checkHealth();
    }
  }, [open]);

  useEffect(() => {
    if (!activeSessionId) { setMessages([]); return; }
    loadMessages(activeSessionId);
  }, [activeSessionId]);

  const ensureSession = async () => {
    if (activeSessionId) return activeSessionId;
    const res = await aiChatApi.createSession();
    setSessions((prev) => [res.session, ...prev]);
    setActiveSessionId(res.session.id);
    return res.session.id;
  };

  const handleNewChat = async () => {
    try {
      const res = await aiChatApi.createSession();
      setSessions((prev) => [res.session, ...prev]);
      setActiveSessionId(res.session.id);
      setOpen(true);
      toast.success('New chat created');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create chat');
    }
  };

  const handleSend = async (content: string) => {
    setSending(true);
    try {
      const sid = await ensureSession();

      const optimisticUser: AiChatMessage = {
        id: `optimistic-user-${Math.random().toString(16).slice(2)}`,
        sessionId: sid,
        role: 'user',
        content,
        createdAt: safeNowIso(),
      };
      setMessages((prev) => [...prev, optimisticUser]);

      const res = await aiChatApi.sendMessage(sid, content);

      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticUser.id);
        return [...withoutOptimistic, res.userMessage, res.assistantMessage];
      });

      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === sid
            ? {
              ...s,
              title: s.title && s.title !== 'New chat' ? s.title : firstLineTitle(content),
              updatedAt: res.session?.updatedAt || safeNowIso(),
            }
            : s,
        );
        return next;
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await aiChatApi.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        const next = sessions.filter((s) => s.id !== id)[0]?.id || null;
        setActiveSessionId(next);
      }
      toast.success('Chat deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete chat');
    }
  };

  const handleClearAll = async () => {
    try {
      await aiChatApi.clearSessions();
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
      toast.success('All chats cleared');
    } catch (e: any) {
      toast.error(e.message || 'Failed to clear chats');
    }
  };

  const handleToggle = () => {
    setOpen((v) => !v);
    setTooltipOpen(false);
  };

  return (
    <>
      <ChatWindow
        open={open}
        sessions={sessions}
        activeSessionId={activeSessionId}
        messages={messages}
        loadingMessages={loadingMessages || loadingSessions}
        sending={sending}
        isAiConnected={isAiConnected}
        onRetry={checkHealth}
        onClose={() => setOpen(false)}
        onNewChat={handleNewChat}
        onSelectSession={(id) => setActiveSessionId(id)}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
        onSend={handleSend}
      />

      {/* ─── Floating Action Button ─── */}
      <div className="th-ai-chat fixed bottom-8 right-20 z-[55]">
        {/* Tooltip bubble */}
        <div
          className={[
            'absolute -top-14 right-0 whitespace-nowrap',
            tooltipOpen && !open
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 pointer-events-none',
            'transition-all duration-250',
          ].join(' ')}
        >
          <div
            className="px-4 py-2 rounded-full text-[13px] font-semibold text-white/[0.95]"
            style={{
              background: 'rgba(15, 15, 25, 0.55)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.10), 0 12px 32px rgba(0,0,0,0.40)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            Need help finding a tutor?
          </div>
        </div>

        {/* FAB */}
        <button
          onClick={handleToggle}
          onMouseEnter={() => setTooltipOpen(true)}
          onMouseLeave={() => setTooltipOpen(false)}
          aria-label="Ask TutorHub AI"
          className="relative flex items-center justify-center transition-all duration-200 active:scale-[0.94] hover:scale-[1.08]"
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, rgba(139,92,246,0.80), rgba(108,99,255,0.65))',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow:
              '0 0 20px rgba(139,92,246,0.45), 0 4px 24px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          {/* Pulse ring */}
          {!open && <span className="th-fab-ring" />}

          {/* Glow halo */}
          <span
            className="absolute -inset-3 rounded-full blur-xl opacity-60 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 40% 30%, rgba(139,92,246,0.50), transparent 60%), radial-gradient(circle at 70% 65%, rgba(59,130,246,0.35), transparent 60%)',
            }}
          />

          <MessageSquareText className="relative w-6 h-6 text-white drop-shadow-lg" />
        </button>

        {/* Accessible status */}
        {open && activeSession && (
          <div className="sr-only">
            Chat open. Active session: {activeSession.title}
          </div>
        )}
      </div>
    </>
  );
}
