import type { AiChatMessage } from '../../utils/aiChatApi';
import { useTheme } from '../../contexts/ThemeContext';
import { Sparkles } from 'lucide-react';

export function ChatMessage({ msg }: { msg: AiChatMessage }) {
  const { isDark } = useTheme();
  const isUser = msg.role === 'user';

  return (
    <div
      className={[
        'flex w-full th-bubble-enter gap-2.5',
        isUser ? 'justify-end' : 'justify-start',
      ].join(' ')}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1"
          style={{
            background: isDark ? 'rgba(139,92,246,0.25)' : 'rgba(108,99,255,0.12)',
            border: `1px solid ${isDark ? 'rgba(139,92,246,0.4)' : 'rgba(108,99,255,0.2)'}`
          }}>
          <Sparkles className="w-3.5 h-3.5" style={{ color: isDark ? '#A89CFF' : '#6C63FF' }} />
        </div>
      )}

      <div
        className={[
          'max-w-[72%] flex flex-col',
          isUser ? 'items-end' : 'items-start',
        ].join(' ')}
      >
        {/* Bubble */}
        <div
          className={[
            'relative px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap th-bubble-shadow',
            isUser
              ? 'rounded-[18px] rounded-br-[4px]'
              : 'rounded-[18px] rounded-bl-[4px]',
          ].join(' ')}
          style={
            isUser
              ? {
                background: 'linear-gradient(135deg, #7C6FE0 0%, #6358D0 100%)',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(124, 111, 224, 0.25)',
              }
              : {
                background: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                color: isDark ? 'rgba(255,255,255,0.95)' : '#2D2D4E',
                border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #E8E4F8',
                boxShadow: isDark
                  ? '0 4px 20px rgba(0,0,0,0.25)'
                  : '0 4px 12px rgba(108, 99, 255, 0.05)',
              }
          }
        >
          {msg.content.replace(/\*/g, '')}
        </div>

        {/* Timestamp */}
        <span className="mt-1.5 px-0.5 text-[11px] font-medium"
          style={{ color: '#9B9BB4' }}>
          {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
