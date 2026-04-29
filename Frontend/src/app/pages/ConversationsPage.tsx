import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { chatApi } from '../utils/chatApi';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { toast } from 'sonner';
import { ArrowLeft, MessageSquare, GraduationCap, Users, Loader2, Inbox } from 'lucide-react';

const GRAD = 'linear-gradient(135deg, #7C6FFF, #4F8EFF)';
const gp = {
  background: 'rgba(255,255,255,0.055)',
  backdropFilter: 'blur(18px) saturate(160%)',
  WebkitBackdropFilter: 'blur(18px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '1.25rem',
} as const;

export function ConversationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useChatAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isTutor = location.pathname.startsWith('/tutor');

  useEffect(() => {
    if (!user) {
      navigate(isTutor ? '/tutor/login' : '/student/login');
      return;
    }
    const role = (user.role || '').toLowerCase();
    if (isTutor && role !== 'tutor') { navigate('/student/dashboard'); return; }
    if (!isTutor && role !== 'student') { navigate(role === 'tutor' ? '/tutor/dashboard' : '/'); return; }
    loadThreads();
  }, [user, navigate, location.pathname]);

  const loadThreads = async () => {
    try {
      const result = await chatApi.getThreads();
      setThreads(result.threads || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load conversations');
    } finally { setLoading(false); }
  };

  const handleOpenChat = (threadId: string) => {
    navigate(`/chat/${threadId}`, { state: { from: isTutor ? 'tutor' : 'student' } });
  };

  const handleBack = () => navigate(isTutor ? '/tutor/dashboard' : '/student/dashboard');

  if (!user) return null;

  return (
    <div className="min-h-screen page-enter">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-header">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4 max-w-3xl">
          <button onClick={handleBack}
            className="p-2.5 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#A0A0C0' }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,111,255,0.15)' }}>
              <MessageSquare className="w-4 h-4" style={{ color: '#7C6FFF' }} />
            </div>
            <h1 className="font-bold text-white">Messages</h1>
          </div>
          {threads.length > 0 && (
            <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: 'rgba(124,111,255,0.3)', border: '1px solid rgba(124,111,255,0.4)' }}>
              {threads.length}
            </span>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#7C6FFF' }} />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={gp}>
              <Inbox className="w-9 h-9" style={{ color: '#444466' }} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No conversations yet</h3>
            <p className="mb-6 max-w-xs text-sm leading-relaxed" style={{ color: '#7070A0' }}>
              {user.role === 'student'
                ? 'Find a tutor and send a chat request to get started.'
                : 'Conversations appear here after you accept student requests.'}
            </p>
            <button
              onClick={() => navigate(user.role === 'student' ? '/student/tutors' : '/tutor/requests')}
              className="px-6 py-3 rounded-2xl font-semibold text-white btn-glow transition-all"
              style={{ background: GRAD, boxShadow: '0 8px 24px rgba(124,111,255,0.3)' }}>
              {user.role === 'student' ? 'Find Tutors to Chat' : 'View Chat Requests'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((thread, i) => (
              <button key={thread.id} onClick={() => handleOpenChat(thread.id)}
                className="w-full card-hover text-left flex items-center gap-4 p-4 animate-fade-up"
                style={{ ...gp, animationDelay: `${i * 0.06}s` }}>
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ background: GRAD, boxShadow: '0 4px 12px rgba(124,111,255,0.3)' }}>
                  {(thread.otherUser?.name || '?')[0].toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{thread.otherUser?.name || 'Unknown'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.07)', color: '#8888AA' }}>
                      {thread.otherUser?.role === 'tutor' ? '👨‍🏫 Tutor' : '📚 Student'}
                    </span>
                  </div>
                  <p className="text-sm truncate" style={{ color: '#7070A0' }}>Click to open conversation →</p>
                </div>
                <MessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: '#44446A' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
