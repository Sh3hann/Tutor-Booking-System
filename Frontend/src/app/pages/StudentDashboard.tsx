import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import {
  Search, MessageSquare, LogOut, BookOpen, Zap,
  GraduationCap, ChevronRight, Users, Star,
  ArrowRight, Sparkles, TrendingUp, Clock, Shield,
  Video, Target, Globe, CheckCircle2, Brain, Calendar, Building2
} from 'lucide-react';

/* ── Constants — Vibrant Cyan-Blue (projector-visible) ─────── */
const PRIMARY = '#0EA5E9';
const P_DARK  = '#0284C7';
const ACCENT  = '#22C55E';
const GRAD    = `linear-gradient(135deg, ${PRIMARY}, ${P_DARK})`;
const GRAD_ACC = `linear-gradient(135deg, ${ACCENT}, #16A34A)`;

/* ═══════════════════════════════════════════════════════
   STUDENT DASHBOARD
   ═══════════════════════════════════════════════════════ */
export function StudentDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useChatAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/student/login'); return; }
    if (!authLoading && user) {
      const role = (user.role || '').toLowerCase();
      if (role !== 'student') {
        navigate(role === 'tutor' ? '/tutor/dashboard' : '/');
        return;
      }
    }
    setLoading(false);
  }, [authLoading, user, navigate]);

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/'); };

  // ── Theme-aware style tokens ──────────────────────────
  const headColor = isDark ? '#ffffff' : '#0f0e1a';
  const subColor = isDark ? 'rgba(200,200,255,0.7)' : '#4a4770';
  const mutedColor = isDark ? '#7070A0' : '#555292';
  const cardBg = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.82)';
  const cardBdr = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(14,165,233,0.18)';
  const cardShadow = isDark ? 'none' : '0 4px 20px rgba(14,165,233,0.08)';
  const navBg = isDark ? 'rgba(6,4,15,0.85)' : 'rgba(240,238,255,0.95)';
  const navBdr = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(14,165,233,0.18)';
  const heroBg = isDark
    ? 'linear-gradient(135deg, rgba(14,165,233,0.22) 0%, rgba(79,70,229,0.18) 50%, rgba(34,197,94,0.08) 100%)'
    : 'linear-gradient(135deg, rgba(14,165,233,0.10) 0%, rgba(79,70,229,0.08) 50%, rgba(34,197,94,0.04) 100%)';
  const heroBdr = isDark ? 'rgba(14,165,233,0.2)' : 'rgba(14,165,233,0.22)';
  const pillBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.82)';
  const pillBdr = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(14,165,233,0.18)';
  const ghostBtnStyle = isDark
    ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#C8C8FF' }
    : { background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(14,165,233,0.22)', color: '#2d2a50' };
  const logoutStyle = isDark
    ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }
    : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl border-4 border-[#0EA5E9] border-t-transparent animate-spin" />
        <p className="text-sm" style={{ color: mutedColor }}>Loading your dashboard...</p>
      </div>
    </div>
  );

  const firstName = (user?.fullName || 'Student').split(' ')[0];

  /* ── Quick Actions ── */
  const actions = [
    { icon: Search,       label: 'Find Tutors',      desc: 'Browse verified tutors by subject, grade, and medium',          sub: '500+ tutors available',   path: '/student/search',          grad: GRAD,                                       glow: 'rgba(14,165,233,0.35)',  accent: PRIMARY,    bg: 'rgba(14,165,233,0.1)'  },
    { icon: MessageSquare,label: 'My Chats',          desc: 'View all your active conversations with tutors',                sub: 'Continue where you left off', path: '/student/conversations',   grad: GRAD_ACC,                                   glow: 'rgba(34,197,94,0.3)',   accent: ACCENT,     bg: 'rgba(34,197,94,0.1)'   },
    { icon: Zap,          label: 'Chat Requests',     desc: 'Send instant chat requests to available tutors',               sub: '120+ tutors online now',  path: '/student/tutors',          grad: 'linear-gradient(135deg,#f59e0b,#d97706)',  glow: 'rgba(245,158,11,0.3)',  accent: '#f59e0b',  bg: 'rgba(245,158,11,0.1)'  },
    { icon: BookOpen,     label: 'My Bookings',       desc: 'View your upcoming classes and manage payments',               sub: 'Manage schedule',         path: '/student/bookings',        grad: 'linear-gradient(135deg,#db2777,#be185d)',  glow: 'rgba(219,39,119,0.3)',  accent: '#db2777',  bg: 'rgba(219,39,119,0.1)'  },
    { icon: Calendar,     label: 'Booking History',   desc: 'View all past and upcoming booking sessions',                 sub: 'View history',            path: '/student/booking-history', grad: 'linear-gradient(135deg,#D4537E,#a83860)',  glow: 'rgba(212,83,126,0.3)',  accent: '#D4537E',  bg: 'rgba(212,83,126,0.1)'  },
    { icon: Building2,    label: 'Institutes',        desc: 'Browse and discover top educational institutes',              sub: 'Find institutes',         path: '/institutes',              grad: 'linear-gradient(135deg,#06b6d4,#0891b2)',  glow: 'rgba(6,182,212,0.3)',   accent: '#06b6d4',  bg: 'rgba(6,182,212,0.1)'   },
    { icon: Brain,        label: 'Brain Quiz',        desc: 'Test your knowledge with 10 fast questions on your subjects', sub: '15 sec per question',     path: '/student/quiz',            grad: 'linear-gradient(135deg,#8B5CF6,#6C63FF)',  glow: 'rgba(139,92,246,0.35)', accent: '#8B5CF6',  bg: 'rgba(139,92,246,0.1)'  },
  ];

  /* ── Feature Highlights ── */
  const highlights = [
    { icon: Video,      title: 'Watch Demo Videos', desc: 'Preview tutors before booking',       color: '#f472b6' },
    { icon: Shield,     title: 'Verified Tutors',   desc: 'All tutors are background-checked',   color: '#34d399' },
    { icon: Clock,      title: 'Flexible Timing',   desc: 'Book any time, any day',              color: '#60a5fa' },
    { icon: Globe,      title: 'Online & In-Person',desc: 'Choose your preferred format',        color: '#fbbf24' },
    { icon: Target,     title: 'Subject Experts',   desc: 'O/L, A/L and all grades covered',    color: PRIMARY   },
    { icon: TrendingUp, title: 'Track Progress',    desc: 'Watch your grades improve',           color: ACCENT    },
  ];

  /* ── How it works ── */
  const steps = [
    { n: 1, title: 'Search',  desc: 'Filter by subject & grade'   },
    { n: 2, title: 'Preview', desc: 'Watch teaching demo videos'  },
    { n: 3, title: 'Request', desc: 'Send a chat request'         },
    { n: 4, title: 'Learn',   desc: 'Start your sessions'         },
  ];

  return (
    <div className="min-h-screen page-enter">

      <style>{`
        @keyframes dashHeroFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes countAnim { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .dash-card-hover { transition:all 0.28s cubic-bezier(0.4,0,0.2,1); }
        .dash-card-hover:hover { transform:translateY(-5px); }
        .action-glow-card { transition:all 0.28s ease; }
        .action-glow-card:hover { transform:translateY(-4px) scale(1.01); }
        .stat-count { animation: countAnim 0.5s ease forwards; }
        .highlight-card { transition:all 0.25s ease; }
        .highlight-card:hover { transform:translateY(-3px); }
      `}</style>

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-40"
        style={{ background: navBg, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: `1px solid ${navBdr}` }}>
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: GRAD, boxShadow: '0 4px 14px rgba(14,165,233,0.4)' }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold" style={{ backgroundImage: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>TutorHub</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(14,165,233,0.15)', color: isDark ? '#a89cff' : '#6C63FF' }}>Student</span>
            </div>
          </div>
          {/* User */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold" style={{ color: headColor }}>{user?.fullName}</span>
              <span className="text-xs" style={{ color: mutedColor }}>Student Account</span>
            </div>
            <button onClick={() => navigate('/student/profile')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold hover:scale-110 transition-transform overflow-hidden flex-shrink-0"
              style={{ background: GRAD, boxShadow: '0 4px 14px rgba(14,165,233,0.40)', border: '2.5px solid rgba(56,189,248,0.50)' }}
              title="Edit Profile">
              {(user as any)?.photoUrl
                ? <img src={(user as any).photoUrl} alt="avatar" className="w-full h-full object-cover" style={{ borderRadius: '50%' }} />
                : (user?.fullName || 'S')[0]
              }
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all hover:-translate-y-0.5"
              style={logoutStyle}>
              <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-16">

        {/* ══ HERO BANNER ════════════════════════════ */}
        <div className="relative mt-8 mb-8 rounded-3xl overflow-hidden"
          style={{ background: heroBg, border: `1px solid ${heroBdr}` }}>
          {/* Glow blobs */}
          <div className="absolute top-0 right-0 pointer-events-none" style={{ width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle,${PRIMARY}55 0%,transparent 70%)`, filter: 'blur(60px)', transform: 'translate(30%,-30%)', opacity: isDark ? 1 : 0.5 }} />
          <div className="absolute bottom-0 left-0 pointer-events-none" style={{ width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle,${ACCENT}44 0%,transparent 70%)`, filter: 'blur(50px)', transform: 'translate(-20%,20%)', opacity: isDark ? 1 : 0.4 }} />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 p-8 lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
                style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.25)', color: isDark ? '#a89cff' : '#6C63FF' }}>
                <Sparkles className="w-3 h-3" /> Welcome back 👋
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold mb-2" style={{ color: headColor }}>
                Hello, <span style={{ backgroundImage: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{firstName}!</span>
              </h1>
              <p className="text-base mb-6 max-w-lg" style={{ color: subColor }}>
                Ready to level up your studies? Find the perfect tutor and start learning smarter.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate('/student/search')}
                  className="action-glow-card flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-white"
                  style={{ background: GRAD, boxShadow: `0 8px 24px rgba(14,165,233,0.4)` }}>
                  <Search className="w-4 h-4" /> Find Your Tutor <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate('/student/tutors')}
                  className="action-glow-card flex items-center gap-2.5 px-6 py-3 rounded-2xl font-semibold"
                  style={ghostBtnStyle}>
                  <Zap className="w-4 h-4" style={{ color: '#fbbf24' }} /> Live Requests
                </button>
              </div>
            </div>

            {/* Right: stat pills */}
            <div className="flex-shrink-0 grid grid-cols-2 gap-3">
              {[
                { n: '500+', label: 'Tutors',      icon: Users,       c: PRIMARY   },
                { n: '120+', label: 'Online Now',  icon: Zap,         c: ACCENT    },
                { n: '4.9★', label: 'Avg Rating',  icon: Star,        c: '#fbbf24' },
                { n: '98%',  label: 'Satisfied',   icon: CheckCircle2,c: '#34d399' },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: pillBg, border: `1px solid ${pillBdr}`, animationDelay: `${i * 0.1}s` }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${s.c}20` }}>
                    <s.icon className="w-4 h-4" style={{ color: s.c }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-none" style={{ color: headColor }}>{s.n}</p>
                    <p className="text-xs mt-0.5" style={{ color: mutedColor }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ QUICK ACTIONS ══════════════════════════ */}
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: headColor }}>
          <Target className="w-5 h-5" style={{ color: PRIMARY }} />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {actions.map(({ icon: Icon, label, desc, sub, path, grad, glow, accent, bg }, i) => (
            <button key={label} onClick={() => navigate(path)}
              className="action-glow-card text-left p-6 rounded-2xl group relative overflow-hidden"
              style={{ background: cardBg, border: `1px solid ${cardBdr}`, boxShadow: cardShadow, animationDelay: `${i * 0.08}s` }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                style={{ background: `radial-gradient(circle at 80% 20%,${glow} 0%,transparent 60%)` }} />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: bg, border: `1px solid ${accent}30` }}>
                  <Icon className="w-6 h-6" style={{ color: accent }} />
                </div>
                <h3 className="font-bold text-base mb-1.5" style={{ color: headColor }}>{label}</h3>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: mutedColor }}>{desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}>
                    {sub}
                  </span>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 translate-x-2"
                    style={{ background: grad }}>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ══ PLATFORM HIGHLIGHTS ═══ */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: headColor }}>
            <Sparkles className="w-5 h-5" style={{ color: PRIMARY }} /> Why TutorHub?
          </h2>
          <span className="text-xs px-3 py-1 rounded-full"
            style={{ background: 'rgba(14,165,233,0.12)', color: isDark ? '#7777BB' : '#6C63FF' }}>
            Sri Lanka's #1 Tutor Platform
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {highlights.map(({ icon: Icon, title, desc, color }, i) => (
            <div key={title} className="highlight-card p-5 rounded-2xl"
              style={{ background: cardBg, border: `1px solid ${cardBdr}`, boxShadow: cardShadow, animationDelay: `${0.3 + i * 0.06}s` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: headColor }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: mutedColor }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* ══ HOW IT WORKS ══════════════════════════ */}
        <div className="p-8 rounded-3xl mb-8 relative overflow-hidden"
          style={{ background: isDark ? 'rgba(14,165,233,0.07)' : 'rgba(14,165,233,0.06)', border: `1px solid ${isDark ? 'rgba(14,165,233,0.14)' : 'rgba(14,165,233,0.20)'}` }}>
          <div className="absolute top-0 right-0 pointer-events-none" style={{ width: 250, height: 250, borderRadius: '50%', background: `radial-gradient(circle,${PRIMARY}22 0%,transparent 70%)`, filter: 'blur(50px)', opacity: isDark ? 1 : 0.5 }} />
          <div className="relative z-10">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: headColor }}>
              <TrendingUp className="w-5 h-5" style={{ color: PRIMARY }} /> How It Works
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: `${ACCENT}15`, color: ACCENT }}>4 Simple Steps</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {steps.map(({ n, title, desc }) => (
                <div key={n} className="flex flex-col items-center text-center group">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white mb-3 transition-all group-hover:scale-110"
                    style={{ background: GRAD, boxShadow: `0 4px 16px rgba(14,165,233,0.35)` }}>
                    {n}
                  </div>
                  <p className="font-semibold text-sm mb-1" style={{ color: headColor }}>{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: mutedColor }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ BOTTOM CTA ════════════════════════════ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-6 rounded-2xl"
          style={{ background: cardBg, border: `1px solid ${cardBdr}`, boxShadow: cardShadow }}>
          <div className="text-center sm:text-left">
            <p className="font-semibold mb-1" style={{ color: headColor }}>Ready to find your perfect tutor?</p>
            <p className="text-sm" style={{ color: mutedColor }}>Browse 500+ verified tutors across all subjects and grades.</p>
          </div>
          <button onClick={() => navigate('/student/search')}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white flex-shrink-0 transition-all hover:-translate-y-0.5"
            style={{ background: GRAD, boxShadow: '0 8px 24px rgba(14,165,233,0.3)' }}>
            <Search className="w-4 h-4" /> Browse Tutors <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
