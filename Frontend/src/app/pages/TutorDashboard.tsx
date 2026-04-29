import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { subscriptionAPI, tutorAPI } from '../utils/api';
import { getStoredUser } from '../utils/authService';
import { toast } from 'sonner';
import {
  User, CreditCard, MessageSquare, LogOut, AlertCircle, CheckCircle,
  Layers, Inbox, Video, GraduationCap, ChevronRight, Layers as layersCopy,
  Calendar, Building2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const SUBSCRIPTION_STORAGE_KEY = 'tutorSubscription';

function getStoredSubscription(): any {
  try {
    const stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
      localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch { return null; }
}

function saveSubscription(subscription: any) {
  try {
    if (subscription) localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
    else localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
  } catch { }
}

export function TutorDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useChatAuth();
  const { isDark, toggleTheme } = useTheme();
  const [subscription, setSubscription] = useState<any>(() => getStoredSubscription());
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingTrial, setAcceptingTrial] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/tutor/login'); return; }
    if (user) {
      Promise.all([
        subscriptionAPI.getSubscription(user.id).catch(() => null),
        tutorAPI.getMyProfile().catch(() => null)
      ]).then(([subRes, profRes]) => {
        const sub = subRes?.subscription || null;
        setSubscription(sub);
        saveSubscription(sub);
        if (profRes?.profile) setProfile(profRes.profile);
      }).finally(() => setLoading(false));
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, navigate]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
    toast.success('Logged out');
    navigate('/');
  };

  const handleAcceptTrial = async () => {
    setAcceptingTrial(true);
    try {
      const res = await subscriptionAPI.acceptTrial();
      toast.success('Free trial started! Your profile is now visible to students.');
      const sub = res?.subscription || null;
      if (sub) { setSubscription(sub); saveSubscription(sub); }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start free trial');
    } finally {
      setAcceptingTrial(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen   bg-white/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#0EA5E9] border-t-transparent animate-spin" />
          <p className="text-white/60 text-white/50">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isSubscriptionActive = subscription?.active;
  const storedUser = getStoredUser();
  const role = (storedUser?.role || user?.role || '').toLowerCase();
  const isPendingApproval = role === 'tutor_pending';
  const expiresAt = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : 0;
  const showUpgradeMessage = isSubscriptionActive && subscription?.isTrial && daysLeft > 0 && daysLeft <= 10;

  const navItems = [
    { icon: User,           label: 'My Profile',          path: '/tutor/profile',          color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)'  },
    { icon: Layers,         label: 'Class Bookings',       path: '/tutor/bookings',         color: '#F43F5E', bg: 'rgba(244,63,94,0.12)'   },
    { icon: Inbox,          label: 'Chat Requests',        path: '/tutor/requests',         color: '#F97316', bg: 'rgba(249,115,22,0.12)'  },
    { icon: MessageSquare,  label: 'Messages',             path: '/tutor/conversations',    color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
    { icon: GraduationCap,  label: 'Learning Materials',   path: '/tutor/materials',        color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
    { icon: CreditCard,     label: 'Subscription',         path: '/tutor/plans',            color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)'  },
    { icon: layersCopy,     label: 'Earnings',             path: '/tutor/financials',       color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
    { icon: Calendar,       label: 'Booking History',      path: '/tutor/booking-history',  color: '#F43F5E', bg: 'rgba(244,63,94,0.12)'   },
    { icon: Building2,      label: 'Institutes',           path: '/institutes',             color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)'  },
  ];

  const getVideoEmbedUrl = (url: string): string => {
    if (!url) return '';
    try {
      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
      if (isYouTube) {
        let videoId = '';
        if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    } catch { return url; }
  };
  const videoEmbedUrl = profile?.introVideoUrl ? getVideoEmbedUrl(profile.introVideoUrl) : '';

  const firstName = (user?.fullName || 'Tutor').split(' ')[0];

  return (
    <div className="min-h-screen page-enter">
      <style>{`
        .tutor-action-card{transition:all 0.28s cubic-bezier(0.4,0,0.2,1)}
        .tutor-action-card:hover{transform:translateY(-5px);border-color:rgba(108,99,255,0.25)!important;box-shadow:0 16px 40px rgba(60,30,160,0.2)}
      `}</style>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40"
        style={isDark
          ? { background: 'rgba(6,4,15,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }
          : { background: 'rgba(240,238,255,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(108,99,255,0.18)' }
        }>
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7C3AED,#0EA5E9)', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold" style={{ backgroundImage: isDark ? 'linear-gradient(135deg,#a78bfa,#818cf8)' : 'linear-gradient(135deg,#6d28d9,#4338ca)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>TutorHub</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full font-medium" style={{ background: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(108,99,255,0.15)', color: isDark ? '#c4b5fd' : '#0284C7', border: isDark ? 'none' : '1px solid rgba(108,99,255,0.25)' }}>Tutor</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold" style={{ color: isDark ? '#ffffff' : '#0f0e1a' }}>{user?.fullName}</span>
              <span className="text-xs" style={{ color: isDark ? '#5555AA' : '#555292' }}>Tutor Account</span>
            </div>
            {profile?.photoUrl || profile?.photo ? (
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: '2.5px solid rgba(56,189,248,0.55)', boxShadow: '0 3px 12px rgba(14,165,233,0.35)' }}>
                <img src={profile.photoUrl || profile.photo} alt={user?.fullName}
                  className="w-full h-full object-cover" style={{ display: 'block', borderRadius: '50%' }} />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', boxShadow: '0 3px 12px rgba(14,165,233,0.35)', border: '2.5px solid rgba(56,189,248,0.40)' }}>
                {(user?.fullName || 'T')[0]}
              </div>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all hover:-translate-y-0.5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        {/* ── Hero Banner — Sky Blue ── */}
        <div className="relative mb-8 p-8 rounded-3xl overflow-hidden" style={{
          background: isDark
            ? 'linear-gradient(135deg,rgba(14,165,233,0.18) 0%,rgba(2,132,199,0.14) 60%,rgba(56,189,248,0.08) 100%)'
            : 'linear-gradient(135deg,rgba(14,165,233,0.12) 0%,rgba(2,132,199,0.07) 100%)',
          border: isDark ? '1px solid rgba(56,189,248,0.22)' : '1px solid rgba(14,165,233,0.25)',
        }}>
          <div className="absolute top-0 right-0 pointer-events-none" style={{ width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(14,165,233,0.28) 0%,transparent 70%)', filter: 'blur(60px)', transform: 'translate(30%,-30%)' }} />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
                style={{ background: isDark ? 'rgba(14,165,233,0.15)' : 'rgba(2,132,199,0.10)', border: `1px solid rgba(14,165,233,0.30)`, color: isDark ? '#38BDF8' : '#0284C7' }}>👨‍🏫 Tutor Dashboard</div>
              <h1 className="text-3xl font-extrabold mb-2" style={{ color: isDark ? '#ffffff' : '#1C1C1E' }}>
                Welcome back, <span style={{ color: isDark ? '#38BDF8' : '#0284C7' }}>{firstName}!</span>
              </h1>
              <p style={{ color: isDark ? 'rgba(186,230,253,0.75)' : 'rgba(2,132,199,0.80)' }}>Manage your classes, students, and profile from one place.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/tutor/profile')} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', boxShadow: '0 6px 20px rgba(14,165,233,0.40)' }}>
                <User className="w-4 h-4" /> Edit Profile
              </button>
              <button onClick={() => navigate('/tutor/requests')} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold transition-all hover:-translate-y-0.5"
                style={isDark
                  ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#BAE6FD' }
                  : { background: '#EFF6FF', border: '1px solid rgba(14,165,233,0.28)', color: '#0284C7' }}>
                <Inbox className="w-4 h-4" style={{ color: '#f59e0b' }} /> Requests
              </button>
            </div>
          </div>
        </div>

        {/* Pending Approval Banner */}
        {isPendingApproval && (
          <div className="mb-6 p-4 rounded-2xl flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
            <div>
              <p className="font-semibold text-white">Profile pending admin approval</p>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(245,158,11,0.75)' }}>You'll be visible to students once approved.</p>
            </div>
          </div>
        )}

        {/* Subscription Alert - Inactive */}
        {!isSubscriptionActive && !isPendingApproval && (
          <div className="mb-6 p-5 rounded-2xl" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#f97316' }} />
              <div>
                <p className="font-semibold text-white">Subscription Required</p>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(249,115,22,0.75)' }}>Start a free trial or subscribe to appear in student searches.</p>
              </div>
            </div>
            <button onClick={handleAcceptTrial} disabled={acceptingTrial}
              className="px-6 py-2.5 rounded-xl font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
              {acceptingTrial ? 'Starting...' : '🎁 Start 30-Day Free Trial'}
            </button>
          </div>
        )}

        {/* Subscription Active Banner */}
        {isSubscriptionActive && (
          <div className="mb-6 p-4 rounded-2xl border dark:border-green-500/20 border-green-200 dark:bg-green-500/10 bg-green-50 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold dark:text-green-400 text-green-800">
                {subscription.plan === 'trial' ? 'Free Trial Active' : `${subscription.plan} Plan Active`}
              </p>
              <p className="text-sm dark:text-green-500/80 text-green-700">
                Expires {expiresAt?.toLocaleDateString()} • You're visible to students ✓
              </p>
            </div>
            {subscription.plan !== 'trial' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold dark:bg-green-500/20 bg-green-100 dark:text-green-400 text-green-700">ACTIVE</span>
            )}
          </div>
        )}

        {/* Trial Ending Warning */}
        {showUpgradeMessage && (
          <div className="mb-6 p-5 rounded-2xl border dark:border-amber-500/20 border-amber-200 dark:bg-amber-500/10 bg-amber-50">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-semibold dark:text-amber-400 text-amber-800">Trial ending in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
                <p className="text-sm dark:text-amber-500/80 text-amber-700 mt-0.5">Subscribe to keep your profile visible.</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => navigate('/tutor/subscribe?plan=monthly')}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #0EA5E9, #3B82F6)' }}>Monthly — LKR 3,000</button>
              <button onClick={() => navigate('/tutor/subscribe?plan=annual')}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white text-white/90 dark:border-white/20 border border-white/10">Annual — LKR 18,000</button>
            </div>
          </div>
        )}


        {/* Quick Action Cards — uniform 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-8">
          {navItems.map(({ icon: Icon, label, path, color, bg }) => (
            <button key={label}
              onClick={() => navigate(path)}
              className="group rounded-2xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden"
              style={{
                background: isDark ? 'rgba(28,28,30,0.85)' : '#FFFFFF',
                border: isDark ? '1px solid rgba(84,84,88,0.40)' : '1px solid rgba(60,60,67,0.14)',
                boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05)',
              }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{ background: bg }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <p className="font-semibold text-sm" style={{ color: isDark ? '#ffffff' : '#1C1C1E' }}>{label}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs" style={{ color: isDark ? 'rgba(235,235,245,0.50)' : 'rgba(60,60,67,0.55)' }}>Open</span>
                <ChevronRight className="w-3 h-3" style={{ color: isDark ? 'rgba(235,235,245,0.50)' : 'rgba(60,60,67,0.55)' }} />
              </div>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="mt-8 mb-0" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(108,99,255,0.1)' }} />

        {/* Teaching Video Dedicated Section */}
        <div className="mt-6 w-full">
          <div
            className="w-full group rounded-2xl p-5 md:p-6 transition-all duration-300 tutor-action-card overflow-hidden"
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : '#eeebf5',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #a8a4c6',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,83,126,0.15)' }}>
                <Video className="w-5 h-5 text-[#D4537E]" />
              </div>
              <h2 className="text-base font-medium" style={{ color: isDark ? '#ffffff' : '#0f0e1a' }}>Teaching Video</h2>
            </div>

            {/* Large Video Embed (16:9) */}
            <div
              className="w-full rounded-2xl overflow-hidden bg-black/10 relative"
              style={{ aspectRatio: '16 / 9', maxHeight: '480px' }}
            >
              {videoEmbedUrl ? (
                <iframe
                  src={videoEmbedUrl}
                  className="w-full h-full"
                  style={{ display: 'block', border: 'none' }}
                  allowFullScreen
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-3 border-2 border-dashed"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#a8a4c6' }}
                >
                  <Video className="w-8 h-8" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : '#a8a4c6' }} />
                  <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#555292' }}>No video added yet</p>
                  <button
                    onClick={() => navigate('/tutor/profile')}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
                    style={{ background: '#D4537E' }}
                  >
                    Add Video
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
