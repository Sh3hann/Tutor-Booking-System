/**
 * Student page: search tutors by name, send chat requests
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { chatApi } from '../utils/chatApi';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Search, MessageSquare, GraduationCap, Loader2 } from 'lucide-react';

export function ChatTutorsPage() {
  const navigate = useNavigate();
  const { user } = useChatAuth();
  const [search, setSearch] = useState('');
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/student/login'); return; }
    const role = (user.role || '').toLowerCase();
    if (role !== 'student') {
      navigate(role === 'tutor' ? '/tutor/dashboard' : '/');
    }
  }, [user, navigate]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const result = await chatApi.getTutors(search);
      setTutors(Array.isArray(result) ? result : result.tutors || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to search');
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (tutorId: string) => {
    setRequestingId(tutorId);
    try {
      await chatApi.createChatRequest(tutorId);
      toast.success('Chat request sent! Waiting for tutor approval.');
    } catch (err: any) {
      const msg = err?.message || '';
      const lower = msg.toLowerCase();
      const isNetworkError = lower.includes('failed to fetch') || lower.includes('networkerror');
      const isAuthError = msg.includes('401') || lower.includes('unauthorized') || lower.includes('jwt');
      toast.error(
        isNetworkError ? 'Chat server is offline.'
        : isAuthError ? 'Session expired. Please log in again.'
        : msg || 'Failed to send request'
      );
    } finally {
      setRequestingId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div className="container mx-auto px-4 max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="p-2.5 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#A0A0C0' }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Find Tutors to Chat</h1>
            <p style={{ color: '#8888AA', fontSize: '0.875rem', marginTop: '2px' }}>
              Search by name and send a chat request
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 p-5 rounded-2xl" style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-4 h-4" style={{ color: '#7C6FFF' }} />
            <span className="font-semibold text-white text-sm">Search by name</span>
          </div>
          <div className="flex gap-3 mt-3">
            <input
              type="text"
              placeholder="Enter tutor name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#E0E0FF',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#7C6FFF,#5B50E8)', boxShadow: '0 4px 12px rgba(124,111,255,0.3)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {tutors.length === 0 && !loading && (
            <div className="text-center py-16 rounded-2xl" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: '#444466' }} />
              <p style={{ color: '#666688' }}>Search for tutors by name to send a chat request</p>
            </div>
          )}

          {tutors.map((tutor, i) => (
            <div
              key={tutor.id}
              className="p-5 rounded-2xl transition-all hover:-translate-y-0.5 fade-up"
              style={{
                background: 'rgba(255,255,255,0.055)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                animationDelay: `${i * 0.06}s`
              }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(124,111,255,0.15)' }}>
                    <GraduationCap className="w-5 h-5" style={{ color: '#7C6FFF' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{tutor.fullName}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(tutor.subjects || []).slice(0, 3).map((s: any, j: number) => (
                        <span key={j} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(200,200,240,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {typeof s === 'string' ? s : s.subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleSendRequest(tutor.id)}
                  disabled={requestingId === tutor.id}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7C6FFF,#5B50E8)', boxShadow: '0 4px 12px rgba(124,111,255,0.25)' }}>
                  {requestingId === tutor.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <MessageSquare className="w-3.5 h-3.5" />
                  }
                  {requestingId === tutor.id ? 'Sending...' : 'Request'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
