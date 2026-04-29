import { useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ChatInput({
  disabled,
  onSend,
  isAiConnected = true,
}: {
  disabled?: boolean;
  onSend: (content: string) => Promise<void> | void;
  isAiConnected?: boolean;
}) {
  const { isDark } = useTheme();
  const [text, setText] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  const focusSafely = () => {
    const el = ref.current;
    if (!el) return;
    try {
      (el as any).focus({ preventScroll: true });
    } catch {
      el.focus();
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    await onSend(content);
    setText('');
    focusSafely();
  };

  return (
    <form onSubmit={handleSend} className="px-4 pb-4 pt-3">
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: '20px',
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255, 255, 255, 0.85)',
          border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(108, 92, 231, 0.3)',
          boxShadow: isDark
            ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 24px rgba(0,0,0,0.30)'
            : '0 4px 14px rgba(108, 92, 231, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Subtle gradient shimmer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(139,92,246,0.08), rgba(59,130,246,0.06), rgba(34,211,238,0.04))',
          }}
        />

        <div className="relative flex items-center gap-2 p-2">
          <div className="pl-2" style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(26, 24, 61, 0.45)' }}>
            <Sparkles className="w-4 h-4" />
          </div>

          <input
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled || !isAiConnected}
            placeholder={isAiConnected ? "Ask TutorHub AI…" : "Ollama is not connected..."}
            className="flex-1 bg-transparent outline-none px-2 py-2 text-sm"
            style={{
              color: isDark ? 'rgba(255,255,255,0.95)' : '#1a183d',
            }}
          />

          {/* Glowing purple send button */}
          <button
            type="submit"
            disabled={disabled || !text.trim() || !isAiConnected}
            className="group flex items-center justify-center w-9 h-9 rounded-[10px] text-white disabled:opacity-30 transition-all duration-200 active:scale-[0.94] hover:scale-[1.06]"
            style={{
              background: '#6C5CE7',
              boxShadow: text.trim()
                ? '0 0 16px rgba(108,92,231,0.50), 0 4px 14px rgba(108,92,231,0.35)'
                : '0 2px 8px rgba(0,0,0,0.25)',
              transition: 'all 0.25s ease',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 px-1 flex items-center justify-between text-[11px]"
        style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(26, 24, 61, 0.45)' }}>
        <span>Short, helpful answers for TutorHub.</span>
        <span className="hidden sm:inline">Enter ↵ to send</span>
      </div>
    </form>
  );
}
