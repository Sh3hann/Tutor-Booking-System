import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { chatApi } from '../utils/chatApi';
import { getSocket } from '../utils/socketService';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { ArrowLeft, Send, GraduationCap, Clock, MapPin, BookOpen, ChevronDown, ChevronUp, X, User, Phone, Users } from 'lucide-react';

// Shortcut templates — tutors use these to auto-send their info
const SHORTCUT_TEMPLATES = [
  {
    id: 'timetable',
    icon: Clock,
    label: '📅 Timetable',
    message: (tutorData: any) =>
      `📅 My Available Timetable:\n${tutorData?.timetable || 'Monday–Friday: 4 PM – 8 PM\nWeekends: 9 AM – 5 PM\n\nFeel free to suggest a time that works for you!'}`,
    color: '#6C63FF',
  },
  {
    id: 'location',
    icon: MapPin,
    label: '📍 Location',
    message: (tutorData: any) =>
      `📍 My Location:\n${tutorData?.location || 'Location not specified'}\n\nI also offer online classes via Zoom/Google Meet.`,
    color: '#10B981',
  },
  {
    id: 'subjects',
    icon: BookOpen,
    label: '📚 Subjects',
    message: (tutorData: any) => {
      const subjects = (tutorData?.subjects || [])
        .map((s: any) => typeof s === 'object' && s.subject ? s.subject : String(s))
        .join(', ');
      return `📚 Subjects I Teach:\n${subjects || 'Contact me for subject details'}\n\nHourly Rate: LKR ${tutorData?.hourlyRate || '—'}/hr`;
    },
    color: '#F59E0B',
  },
];

export function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { threadId: threadIdParam, tutorId } = useParams();
  const { user } = useChatAuth();
  const [resolvedThreadId, setResolvedThreadId] = useState<string | null>(threadIdParam || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherName, setOtherName] = useState('');
  const [otherAvatar, setOtherAvatar] = useState('');
  const [otherUserId, setOtherUserId] = useState('');
  const [otherUserInfo, setOtherUserInfo] = useState<any>(null);
  const [showStudentInfo, setShowStudentInfo] = useState(false);
  const [tutorData, setTutorData] = useState<any>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { isDark } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Theme tokens ────────────────────────────────────────
  const pageBg        = isDark ? '#06040f' : 'transparent';
  const headBg        = isDark ? 'rgba(6,4,15,0.85)' : 'rgba(220,217,238,0.96)';
  const headBorder    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.20)';
  const headTxt       = isDark ? '#ffffff' : '#0f0e1a';
  const subTxt        = isDark ? '#555577' : '#555292';
  const backBtnBg     = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.90)';
  const backBtnColor  = isDark ? '#999' : '#0f0e1a';
  
  const msgMyBg       = 'linear-gradient(135deg,#6C63FF,#3B82F6)';
  const msgOtherBg    = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.92)';
  const msgOtherBdr   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.18)';
  const msgOtherTxt   = isDark ? '#f3f4f6' : '#0f0e1a';
  const timestampTxt  = isDark ? '#555577' : '#666688';

  const inputAreaBg   = isDark ? '#06040f' : 'rgba(220,217,238,0.96)';
  const inputBg       = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)';
  const inputBdr      = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.25)';
  const inputTxt      = isDark ? '#E8E8F0' : '#0f0e1a';

  const modalBg       = isDark ? '#100d1f' : 'rgba(255,255,255,0.98)';
  const modalTxt      = isDark ? '#ffffff' : '#0f0e1a';
  const modalSub      = isDark ? 'rgba(255,255,255,0.5)' : '#4a4770';

  useEffect(() => {
    if (!user) {
      if (location.pathname.startsWith('/tutor')) navigate('/tutor/login');
      else navigate('/student/login');
    }
  }, [user, navigate, location.pathname]);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      setLoading(true);
      let tid = threadIdParam;
      if (!tid && tutorId) {
        const threadsResult = await chatApi.getThreads();
        const thread = (threadsResult.threads || []).find((t: any) => t.otherUser?.id === tutorId);
        tid = thread?.id;
        setResolvedThreadId(tid || null);
        if (!tid) { setLoading(false); return; }
      } else { setResolvedThreadId(tid || null); }

      if (!tid) { setLoading(false); return; }

      try {
        const result = await chatApi.getMessages(tid);
        setMessages(result.messages || []);
        const threadsResult = await chatApi.getThreads();
        const thread = (threadsResult.threads || []).find((t: any) => t.id === tid);
        setOtherName(thread?.otherUser?.name || 'Chat');
        setOtherAvatar((thread?.otherUser?.name || 'C')[0].toUpperCase());
        const otherId = thread?.otherUser?.id || '';
        setOtherUserId(otherId);

        // If user is a tutor, fetch the student's profile details for the info modal
        if ((user.role || '').toLowerCase().includes('tutor') && otherId) {
          try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
            const nodeBase = `http://${window.location.hostname}:3001/api`;
            const uRes = await fetch(`${nodeBase}/users/${otherId}/profile`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (uRes.ok) { const d = await uRes.json(); setOtherUserInfo(d.user || null); }
          } catch {}
        }

        // If user is a tutor, try to load their profile data for shortcuts
        if (user.role === 'tutor' || user.role === 'tutor_pending') {
          try {
            const { tutorAPI } = await import('../utils/api');
            const profileResult = await tutorAPI.getMyProfile();
            if (profileResult?.profile) setTutorData(profileResult.profile);
          } catch {}
        }

        const socket = getSocket();
        if (socket) {
          socket.emit('joinThread', { threadId: tid });
          socket.off('newMessage');
          socket.on('newMessage', ({ message }: { message: any }) => {
            if (message.threadId === tid) setMessages((prev) => [...prev, message]);
          });
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load chat');
        navigate(user.role === 'tutor' ? '/tutor/conversations' : '/student/conversations');
      } finally { setLoading(false); }
    };
    init();
    return () => { const socket = getSocket(); if (socket) socket.off('newMessage'); };
  }, [threadIdParam, tutorId, user, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const sendMessage = async (content: string) => {
    const tid = threadIdParam || resolvedThreadId;
    if (!content.trim() || !tid) return;
    setSending(true);
    const optimisticMessage = {
      id: Math.random().toString(), threadId: tid, senderId: user!.id,
      senderRole: user!.role, content: content.trim(), sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('sendMessage', { threadId: tid, content: content.trim() });
    } else {
      toast.error('Connection lost. Please refresh.');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
    }
    setSending(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await sendMessage(newMessage);
    setNewMessage('');
  };

  const handleShortcut = async (shortcut: typeof SHORTCUT_TEMPLATES[0]) => {
    setShowShortcuts(false);
    if (isTutor) {
      const msg = shortcut.message(tutorData);
      await sendMessage(msg);
    } else {
      const tid = threadIdParam || resolvedThreadId;
      if (!tid) return;
      
      let questionText = '';
      if (shortcut.id === 'timetable') questionText = 'Hello! Could you please share your available timetable?';
      else if (shortcut.id === 'location') questionText = 'Hi! Where are your classes located? Do you offer online sessions?';
      else if (shortcut.id === 'subjects') questionText = 'Hello! What subjects do you teach and what are your hourly rates?';
      
      if (questionText) await sendMessage(questionText);

      setTimeout(() => {
        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit('triggerAutoReply', { threadId: tid, shortcutId: shortcut.id });
        } else {
          toast.error('Connection lost. Auto-reply failed.');
        }
      }, 500);
    }
  };

  const handleBack = () => {
    // Always go back to the previous page in history (e.g. search results)
    navigate(-1);
  };

  if (!user) return null;

  const isTutor = (user.role || '').toLowerCase() === 'tutor' || (user.role || '').toLowerCase() === 'tutor_pending';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: pageBg }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#6C63FF] border-t-transparent animate-spin" />
          <p style={{ color: isDark ? '#8888AA' : '#555292' }}>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: pageBg }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ background: headBg, backdropFilter: 'blur(16px)', borderColor: headBorder }}>
        <div className="container mx-auto px-4 h-16 flex items-center gap-4 max-w-3xl">
          <button onClick={handleBack}
            className="p-2 rounded-xl hover:scale-110 transition-transform"
            style={{ background: backBtnBg, color: backBtnColor }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          {otherAvatar ? (
            <button
              onClick={() => isTutor && otherUserInfo && setShowStudentInfo(true)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${isTutor && otherUserInfo ? 'cursor-pointer hover:scale-110 transition-transform ring-2 ring-[#6C63FF]/40' : ''}`}
              style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)' }}
              title={isTutor ? 'View Student Profile' : undefined}>
              {otherAvatar}
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)' }}>
              <GraduationCap className="w-5 h-5" style={{ color: backBtnColor }} />
            </div>
          )}
          <div className="flex-1">
            <h1 className="font-semibold" style={{ color: headTxt }}>{otherName || 'Chat'}</h1>
            <p className="text-xs" style={{ color: subTxt }}>
              {!isTutor ? 'Use shortcuts below to get quick info ↓' : 'Connected'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto container mx-auto px-4 py-6 max-w-3xl space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.1)' }}>
              <Send className="w-8 h-8" style={{ color: isDark ? '#444466' : '#6C63FF' }} />
            </div>
            <p style={{ color: isDark ? '#666688' : '#2D2A50' }}>No messages yet — say hello! 👋</p>
            <p className="mt-2 text-sm" style={{ color: isDark ? '#444466' : '#555292' }}>
              {!isTutor 
                ? 'Click "Ask Tutor Info" below to get an instant auto-reply about their schedule and location.'
                : 'Say hello and ask how you can help!'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMyMessage = msg.senderId === user.id;
            return (
              <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                {!isMyMessage && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end"
                    style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)' }}>
                    {otherAvatar}
                  </div>
                )}
                <div className={`max-w-[72%] flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    isMyMessage ? 'rounded-br-sm text-white' : 'rounded-bl-sm'
                  }`}
                    style={isMyMessage
                      ? { background: msgMyBg }
                      : { background: msgOtherBg, backdropFilter: 'blur(12px)', border: `1px solid ${msgOtherBdr}`, color: msgOtherTxt }}>
                    {msg.content}
                  </div>
                  <span className="text-xs mt-1 px-1" style={{ color: timestampTxt }}>
                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* No thread yet */}
      {!loading && tutorId && !resolvedThreadId && !threadIdParam && (
        <div className="container mx-auto px-4 pb-4 max-w-3xl">
          <div className="p-4 rounded-2xl text-center" style={{ background: backBtnBg, backdropFilter: 'blur(12px)', border: `1px solid ${headBorder}` }}>
            <p style={{ color: subTxt }} className="mb-3">No chat thread yet. Send a chat request first.</p>
            <button onClick={() => navigate('/student/tutors')}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)' }}>
              Find Tutors to Chat
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      {(resolvedThreadId || threadIdParam) && (
        <div className="sticky bottom-0 border-t" style={{ borderColor: headBorder, background: inputAreaBg }}>
          {/* Shortcuts Panel */}
          {!isTutor && (
            <>
              <div className="container mx-auto max-w-3xl px-4 pt-2">
                  <button
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                    style={{ background: isDark ? 'rgba(108,99,255,0.1)' : 'rgba(108,99,255,0.15)', color: isDark ? '#9999CC' : '#4F46E5', border: `1px solid ${isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.25)'}` }}>
                    ⚡ Ask Tutor Info
                    {showShortcuts ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  </button>
              </div>
              {showShortcuts && (
                <div className="container mx-auto max-w-3xl px-4 py-2 flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 duration-200">
                  {SHORTCUT_TEMPLATES.map((shortcut) => {
                    const Icon = shortcut.icon;
                    const label = shortcut.label.replace('📅 ', '📅 Ask ').replace('📍 ', '📍 Ask ').replace('📚 ', '📚 Ask ');
                    return (
                      <button key={shortcut.id}
                        onClick={() => handleShortcut(shortcut)}
                        disabled={sending}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                        style={{ background: `${shortcut.color}18`, color: shortcut.color, border: `1px solid ${shortcut.color}30` }}>
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    );
                  })}
                  <div className="w-full flex items-center gap-2 text-xs px-1" style={{ color: '#555577' }}>
                    <span>Click to instantly auto-reply with tutor details</span>
                  </div>
                </div>
              )}
            </>
          )}

          <form onSubmit={handleSendMessage} className="container mx-auto max-w-3xl flex gap-3 p-4">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isTutor ? "Type a message..." : "Type a message or use ⚡ Ask Tutor Info above..."}
              disabled={sending}
              className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none transition-all shadow-sm"
              style={{
                background: inputBg, backdropFilter: 'blur(12px)',
                border: `1px solid ${inputBdr}`,
                color: inputTxt,
              }}
            />
            <button type="submit" disabled={sending || !newMessage.trim()}
              className="px-4 py-3 rounded-xl text-white disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)' }}>
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* Student Info Modal — shown when tutor clicks student avatar */}
      {showStudentInfo && otherUserInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="border rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" style={{ background: modalBg, borderColor: headBorder }}>
            <div className="p-5 border-b flex items-center justify-between" style={{ background: 'linear-gradient(135deg,rgba(108,99,255,0.2),rgba(59,130,246,0.1))', borderColor: headBorder }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl" style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)' }}>
                  {(otherUserInfo.fullName || 'S')[0]}
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: modalTxt }}>{otherUserInfo.fullName}</h3>
                  <p className="text-xs" style={{ color: modalSub }}>Student Profile</p>
                </div>
              </div>
              <button onClick={() => setShowStudentInfo(false)} className="p-2 rounded-xl transition-colors" style={{ background: backBtnBg, color: backBtnColor }}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border" style={{ background: backBtnBg, borderColor: headBorder }}>
                  <p className="text-xs mb-1 flex items-center gap-1" style={{ color: modalSub }}><User className="w-3 h-3" /> Grade</p>
                  <p className="font-semibold" style={{ color: modalTxt }}>{otherUserInfo.grade || 'Not set'}</p>
                </div>
                <div className="p-3 rounded-xl border" style={{ background: backBtnBg, borderColor: headBorder }}>
                  <p className="text-xs mb-1" style={{ color: modalSub }}>Age</p>
                  <p className="font-semibold" style={{ color: modalTxt }}>{otherUserInfo.age || 'Not set'}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border" style={{ background: backBtnBg, borderColor: headBorder }}>
                <p className="text-xs mb-1 flex items-center gap-1" style={{ color: modalSub }}><Phone className="w-3 h-3" /> Student Contact</p>
                <p className="font-semibold" style={{ color: modalTxt }}>{otherUserInfo.contactNumber || 'Not set'}</p>
                <p className="text-xs" style={{ color: modalSub }}>{otherUserInfo.email}</p>
              </div>
              <div className="p-3 rounded-xl border" style={{ background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.12)', borderColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.3)' }}>
                <p className="text-xs mb-1 flex items-center gap-1" style={{ color: isDark ? 'rgba(245,158,11,0.6)' : '#B45309' }}><Users className="w-3 h-3" /> Parent / Guardian</p>
                <p className="font-semibold" style={{ color: isDark ? '#FCD34D' : '#92400E' }}>{otherUserInfo.parentName || 'Not set'}</p>
                <p className="text-sm" style={{ color: isDark ? 'rgba(252,211,77,0.7)' : '#B45309' }}>{otherUserInfo.parentContact || 'Not provided'}</p>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => setShowStudentInfo(false)} className="w-full py-3 rounded-2xl font-bold text-white transition-all shadow-lg" style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
