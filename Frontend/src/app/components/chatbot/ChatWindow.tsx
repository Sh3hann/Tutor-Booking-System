import { useEffect, useMemo, useRef } from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import type { AiChatSession, AiChatMessage } from '../../utils/aiChatApi';

function clampTitle(title: string) {
  const t = (title || '').trim();
  return t.length > 36 ? `${t.slice(0, 36)}…` : t || 'New chat';
}

/* ---- Typing indicator (3 bouncing dots) ---- */
function TypingIndicator() {
  return (
    <div className="flex justify-start th-bubble-enter">
      <div
        className="px-5 py-3 rounded-[18px] rounded-bl-[4px] flex items-center gap-[5px]"
        style={{
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.15), 0 6px 20px rgba(0,0,0,0.25)',
        }}
      >
        <span className="th-typing-dot" />
        <span className="th-typing-dot" />
        <span className="th-typing-dot" />
      </div>
    </div>
  );
}

export function ChatWindow({
  open,
  sessions,
  activeSessionId,
  messages,
  loadingMessages,
  sending,
  onClose,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onClearAll,
  onSend,
  isAiConnected,
  onRetry,
}: {
  open: boolean;
  sessions: AiChatSession[];
  activeSessionId: string | null;
  messages: AiChatMessage[];
  loadingMessages: boolean;
  sending: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onSend: (content: string) => Promise<void>;
  isAiConnected: boolean;
  onRetry: () => void;
}) {
  const { isDark } = useTheme();
  const list = useMemo(
    () =>
      sessions
        .slice()
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [sessions],
  );
  const endRef = useRef<HTMLDivElement>(null);
  const inputKey = activeSessionId || 'no-session';

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(
      () => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
      60,
    );
    return () => clearTimeout(t);
  }, [open, messages.length, loadingMessages, sending]);

  if (!open) return null;

  return (
    <div className="th-ai-chat fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-20 z-[60] flex items-end justify-center sm:justify-end p-4 sm:p-0">
      {/* Backdrop click-catcher (mobile) */}
      <button
        onClick={onClose}
        className="sm:hidden fixed inset-0"
        aria-label="Close"
        style={{
          background: 'rgba(0,0,0,0.60)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* ─── Main panel ─── */}
      <div
        className="th-panel-enter relative w-full sm:w-[420px] h-[78vh] sm:h-[620px] overflow-hidden flex flex-col"
        style={{
          background: 'rgba(255,255,255,0.055)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '1.25rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        }}
      >
        {/* Gradient tint overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(900px 500px at 15% 5%, rgba(139,92,246,0.12), transparent 55%), radial-gradient(700px 400px at 85% 25%, rgba(59,130,246,0.08), transparent 55%), radial-gradient(800px 500px at 40% 100%, rgba(34,211,238,0.05), transparent 55%)',
          }}
        />
        {/* Subtle noise */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2780%27 height=%2780%27 viewBox=%270 0 80 80%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%2780%27 height=%2780%27 filter=%27url(%23n)%27 opacity=%270.50%27/%3E%3C/svg%3E")',
          }}
        />

        {/* ─── Header ─── */}
        <div
          className="relative px-5 pt-4 pb-3 border-b shrink-0"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.09)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-white font-semibold tracking-tight text-[15px]">
                  TutorHub AI
                </h2>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-white/[0.70]">
                  <span
                    className={isAiConnected ? "th-online-dot" : "th-offline-dot"}
                    style={!isAiConnected ? { background: '#ef4444', boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)' } : {}}
                  />
                  {isAiConnected ? "online" : "offline"}
                </span>
              </div>
              <p className="text-[12px] text-white/[0.55] mt-0.5">
                Ask about bookings, payments, tutors & more.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/[0.55] hover:text-white/[0.95] transition-colors duration-200 hover:scale-[1.06] active:scale-[0.96]"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Divider */}
          <div
            className="mt-3 h-px w-full"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(139,92,246,0.50), rgba(59,130,246,0.30), transparent)',
            }}
          />

          {/* Session actions */}
          <div className="mt-3 flex items-center gap-2">
            {/* New chat – purple glass pill */}
            <button
              onClick={onNewChat}
              disabled={!isAiConnected}
              className="flex items-center gap-2 px-3.5 py-[7px] rounded-full text-[13px] font-semibold text-white/[0.95] transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background:
                  'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(108,99,255,0.25))',
                border: '1px solid rgba(139,92,246,0.30)',
                boxShadow:
                  '0 6px 18px rgba(139,92,246,0.22), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              New chat
            </button>

            {/* Clear – neutral glass pill */}
            <button
              onClick={onClearAll}
              disabled={!isAiConnected}
              className="ml-auto flex items-center gap-2 px-3.5 py-[7px] rounded-full text-[13px] font-bold transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
                border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid #FFDADA',
                color: isDark ? 'rgba(255,255,255,0.70)' : '#E05252',
                boxShadow: isDark ? 'none' : '0 2px 8px rgba(224, 82, 82, 0.12)',
              }}
              title="Clear all chats"
            >
              <Trash2 className="w-3.5 h-3.5" style={{ color: isDark ? '#FCA5A5' : '#E05252' }} />
              Clear
            </button>
          </div>

          {/* Session tabs */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {!isAiConnected ? (
              <span className="text-xs text-white/[0.45]">Connection unavailable.</span>
            ) : list.length === 0 ? (
              <span className="text-xs text-white/[0.45]">No chats yet.</span>
            ) : (
              list.map((s) => {
                const active = s.id === activeSessionId;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectSession(s.id)}
                    className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-[1.03]"
                    style={{
                      background: active
                        ? (isDark ? 'rgba(139,92,246,0.30)' : 'rgba(124,111,224,0.12)')
                        : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.90)'),
                      border: `1px solid ${active
                        ? (isDark ? 'rgba(139,92,246,0.38)' : 'rgba(124,111,224,0.30)')
                        : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(124,111,224,0.15)')}`,
                      color: active
                        ? (isDark ? '#fff' : '#6358D0')
                        : (isDark ? 'rgba(255,255,255,0.70)' : '#6B5FCC'),
                      boxShadow: active
                        ? (isDark ? '0 4px 14px rgba(139,92,246,0.20)' : '0 4px 12px rgba(124,111,224,0.10)')
                        : 'none',
                    }}
                    title={s.title}
                  >
                    {clampTitle(s.title)}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Messages + Input ─── */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          {!isAiConnected ? (
            /* ──── Offline State UI ──── */
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center th-panel-enter">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
              >
                <X className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="text-white font-bold text-xl tracking-tight leading-tight mb-3">
                Please install Ollama or sign in again.
              </h3>
              <p className="text-white/50 text-[14px] leading-relaxed mb-8">
                TutorHub AI is currently unavailable because Ollama is not connected or your session has expired.
              </p>

              <div className="flex flex-col gap-3 w-full max-w-[240px]">
                <button
                  onClick={() => window.open('https://ollama.com/download', '_blank')}
                  className="w-full py-3 rounded-2xl text-[14px] font-bold text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, #6C5CE7, #8B5CF6)',
                    boxShadow: '0 10px 20px rgba(108,92,231,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  Download Ollama
                </button>
                <button
                  onClick={onRetry}
                  className="w-full py-3 rounded-2xl text-[14px] font-semibold text-white/70 transition-all duration-200 hover:bg-white/10 active:scale-[0.97]"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  Retry Connection
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Scrollable messages */}
              <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 th-custom-scrollbar"
                style={{
                  scrollBehavior: 'smooth' as any,
                  paddingLeft: '16px',
                  paddingRight: '16px',
                }}
              >
                {loadingMessages ? (
                  <div className="py-10 text-center text-white/[0.55] text-sm">
                    Loading…
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-white/[0.95] font-semibold">
                      Ask me anything.
                    </p>
                    <p className="mt-2 text-sm text-white/[0.55]">
                      Try: "How do I book a tutor?" or "How do payments work?"
                    </p>
                  </div>
                ) : (
                  messages.map((m) => <ChatMessage key={m.id} msg={m} />)
                )}

                {/* Typing indicator while sending */}
                {sending && <TypingIndicator />}

                <div ref={endRef} />
              </div>

              {/* Footer input area */}
              <div
                className="relative border-t shrink-0"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(139,92,246,0.06), rgba(59,130,246,0.03))',
                  }}
                />
                <div className="relative">
                  <ChatInput key={inputKey} disabled={sending} isAiConnected={isAiConnected} onSend={onSend} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
