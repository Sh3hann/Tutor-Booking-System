import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  GraduationCap, Star, ArrowRight, Search, BookOpen,
  MessageSquare, Shield, ChevronRight, Zap, TrendingUp,
  CheckCircle2, Calendar, Users, Video, Clock, Sparkles,
  Sun, Moon, Building2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/* ── Sky-Blue Color Tokens — Projector Visible ──────────────────── */
function C(isDark: boolean) {
  return {
    bg:        isDark ? '#0A0A0A'                   : '#F2F2F7',
    bgCard:    isDark ? '#1C1C1E'                   : '#FFFFFF',
    bgSection: isDark ? 'rgba(28,28,30,0.60)'       : 'rgba(255,255,255,0.70)',
    label:     isDark ? 'rgba(255,255,255,0.93)'    : '#1C1C1E',
    secondary: isDark ? 'rgba(235,235,245,0.60)'    : 'rgba(60,60,67,0.60)',
    tertiary:  isDark ? 'rgba(235,235,245,0.35)'    : 'rgba(60,60,67,0.35)',
    primary:   isDark ? '#38BDF8'                   : '#0284C7',
    primaryGlow: isDark ? 'rgba(56,189,248,0.35)'   : 'rgba(2,132,199,0.30)',
    green:     isDark ? '#4ADE80'                   : '#16A34A',
    orange:    isDark ? '#FB923C'                   : '#EA580C',
    red:       isDark ? '#F87171'                   : '#DC2626',
    sep:       isDark ? 'rgba(84,84,88,0.55)'       : 'rgba(60,60,67,0.16)',
    sepLight:  isDark ? 'rgba(84,84,88,0.30)'       : 'rgba(60,60,67,0.09)',
    cardShadow: isDark ? 'none'
               : '0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.06)',
    navBg:     isDark ? 'rgba(10,10,10,0.88)'       : 'rgba(242,242,247,0.92)',
  };
}

/* ── Scroll Reveal ─────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); io.disconnect(); } }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, v };
}
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, v } = useReveal();
  return (
    <div ref={ref} className={className} style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(22px)', transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Data ──────────────────────────────────────────────────────── */
const REVIEWS = [
  { name: 'Amara Silva',    role: 'O/L Student', text: 'Found the perfect tutor in minutes. My grades went up by 2 grades!', stars: 5, avatar: '👩🏻‍🎓' },
  { name: 'Roshan Perera',  role: 'Parent',       text: 'The teaching demo videos made choosing a tutor so much easier.', stars: 5, avatar: '👨🏽‍💼' },
  { name: 'Kavindi M.',     role: 'A/L Student',  text: 'Real-time chat with tutors changed how I study. Highly recommend!', stars: 5, avatar: '👩🏽‍💻' },
];

const FEATURES = [
  { icon: Search,        title: 'Smart Search',        desc: 'Filter by subject, grade, language & location instantly.',    color: '#0EA5E9' },
  { icon: Calendar,      title: 'Instant Booking',     desc: 'Browse availability and book sessions in real time.',         color: '#22C55E' },
  { icon: MessageSquare, title: 'Real-Time Chat',      desc: 'Message tutors directly — no third-party apps needed.',      color: '#0EA5E9' },
  { icon: Video,         title: 'Teaching Videos',     desc: 'Watch tutor demo videos before you commit to a booking.',    color: '#F97316' },
  { icon: Shield,        title: 'Verified Tutors',     desc: 'Every tutor is reviewed, approved, and background checked.', color: '#22C55E' },
  { icon: Star,          title: 'Ratings & Reviews',   desc: 'Transparent student reviews with verified star ratings.',    color: '#F59E0B' },
];

const STEPS = [
  { n: 1, t: 'Create Account',  d: 'Sign up free in 60 seconds.' },
  { n: 2, t: 'Search & Filter', d: 'Find your ideal tutor easily.' },
  { n: 3, t: 'Watch Demo',      d: 'See teaching style before booking.' },
  { n: 4, t: 'Start Learning',  d: 'Book sessions and achieve goals!' },
];

/* ══════════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════════ */
export function LandingPage() {
  const { isDark, toggleTheme } = useTheme();
  const c = C(isDark);
  const [stats, setStats] = useState({ tutors: 0, sessions: 0, rating: 0, sat: 0 });

  useEffect(() => {
    const id = setTimeout(() => {
      const dur = 1400, start = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - start) / dur, 1);
        const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setStats({ tutors: Math.floor(e*500), sessions: Math.floor(e*15000), rating: parseFloat((e*4.9).toFixed(1)), sat: Math.floor(e*98) });
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 400);
    return () => clearTimeout(id);
  }, []);

  /* shared mini card style */
  const card = { background: c.bgCard, border: `1px solid ${c.sep}`, borderRadius: '1rem', boxShadow: c.cardShadow };

  /* ── Primary CTA button ── */
  const btnPrimary = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '0.8rem 1.6rem',
    borderRadius: '0.875rem',
    background: `linear-gradient(135deg, #0EA5E9, #0284C7)`,
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.9375rem',
    letterSpacing: '-0.01em',
    border: 'none',
    cursor: 'pointer',
    boxShadow: `0 6px 22px rgba(14,165,233,0.45)`,
    transition: 'transform 0.18s, box-shadow 0.18s, opacity 0.18s',
    textDecoration: 'none',
    ...extra,
  });

  /* ── Ghost / outline button ── */
  const btnGhost = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '0.8rem 1.6rem',
    borderRadius: '0.875rem',
    background: isDark ? 'rgba(44,44,46,0.75)' : '#FFFFFF',
    color: c.label,
    fontWeight: 600,
    fontSize: '0.9375rem',
    letterSpacing: '-0.01em',
    border: `1.5px solid ${isDark ? 'rgba(84,84,88,0.60)' : 'rgba(60,60,67,0.22)'}`,
    cursor: 'pointer',
    boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
    transition: 'transform 0.18s, box-shadow 0.18s, background 0.18s',
    textDecoration: 'none',
    ...extra,
  });

  /* ── Green CTA button ── */
  const btnGreen = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '0.75rem 1.5rem',
    borderRadius: '0.875rem',
    background: `linear-gradient(135deg, #22C55E, #16A34A)`,
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.9rem',
    letterSpacing: '-0.01em',
    border: 'none',
    cursor: 'pointer',
    boxShadow: `0 4px 18px rgba(34,197,94,0.40)`,
    transition: 'transform 0.18s, opacity 0.18s',
    textDecoration: 'none',
    ...extra,
  });

  const hoverLift = {
    onMouseEnter: (e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 30px rgba(14,165,233,0.55)`; },
    onMouseLeave: (e: any) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 22px rgba(14,165,233,0.45)`; },
  };
  const hoverLiftGhost = {
    onMouseEnter: (e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; },
    onMouseLeave: (e: any) => { e.currentTarget.style.transform = 'translateY(0)'; },
  };

  return (
    <div style={{ background: c.bg, color: c.label, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', 'Inter', sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>

      <style>{`
        @keyframes landFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes landPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes landFadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .land-float  { animation: landFloat 5s ease-in-out infinite; }
        .land-float2 { animation: landFloat 6.5s ease-in-out 1.2s infinite; }
        .land-float3 { animation: landFloat 4.5s ease-in-out 2.5s infinite; }
        .land-fade   { animation: landFadeUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
        .feat-hover  { transition: all 0.25s ease; }
        .feat-hover:hover { transform: translateY(-4px); }
      `}</style>

      {/* ══ NAVBAR ═══════════════════════════════════════════════ */}
      <nav style={{ background: c.navBg, backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', borderBottom: `1px solid ${c.sep}`, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.25rem', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,#0EA5E9,#0284C7)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(14,165,233,0.40)' }}>
              <GraduationCap style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.0625rem', letterSpacing: '-0.025em', color: c.label }}>TutorHub</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="hidden md:flex">
            {[['Find Tutors', '/student/search'], ['Institutes', '/institutes'], ['Become a Tutor', '/tutor/signup-step1']].map(([n, h]) => (
              <Link key={n} to={h} style={{ fontSize: '0.875rem', fontWeight: 500, color: c.secondary, textDecoration: 'none', letterSpacing: '-0.01em', transition: 'color 0.18s' }}
                onMouseEnter={e => (e.currentTarget.style.color = c.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = c.secondary)}>
                {n}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={toggleTheme}
              style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(44,44,46,0.80)' : 'rgba(255,255,255,0.90)', border: `1px solid ${c.sep}`, cursor: 'pointer', transition: 'all 0.2s' }}
              title={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? <Sun style={{ width: 15, height: 15, color: '#FB923C' }} /> : <Moon style={{ width: 15, height: 15, color: c.primary }} />}
            </button>
            <Link to="/student/login" style={{ fontSize: '0.875rem', fontWeight: 600, color: c.primary, padding: '0.4rem 0.85rem', borderRadius: 8, letterSpacing: '-0.01em', textDecoration: 'none' }}>Sign In</Link>
            <Link to="/student/signup"
              style={btnPrimary({ padding: '0.45rem 1.1rem', fontSize: '0.875rem', borderRadius: 9 })}
              {...hoverLift}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 80, paddingBottom: 60, padding: '80px 1.25rem 60px', position: 'relative', overflow: 'hidden' }}>
        {/* Bg blobs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 650, height: 650, borderRadius: '50%', background: `radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)`, filter: 'blur(90px)', top: '-10%', left: '-8%' }} />
          <div style={{ position: 'absolute', width: 450, height: 450, borderRadius: '50%', background: `radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 70%)`, filter: 'blur(80px)', bottom: '5%', right: '2%' }} />
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '4rem', alignItems: 'center' }}>

            {/* LEFT */}
            <div>
              {/* Badge */}
              <div className="land-fade" style={{ animationDelay: '0.05s', marginBottom: '1.25rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.3rem 0.9rem', borderRadius: 9999, background: isDark ? 'rgba(56,189,248,0.14)' : 'rgba(2,132,199,0.08)', border: `1px solid ${c.primary}35`, fontSize: '0.8125rem', fontWeight: 700, color: c.primary, letterSpacing: '-0.01em' }}>
                  <Sparkles style={{ width: 12, height: 12 }} />
                  Sri Lanka's #1 Tutor Platform
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.green, display: 'inline-block', animation: 'landPulse 2s infinite' }} />
                </span>
              </div>

              {/* Headline */}
              <h1 className="land-fade" style={{ animationDelay: '0.12s', fontSize: 'clamp(2.4rem,5.5vw,3.8rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.04em', color: c.label, marginBottom: '0.5rem' }}>
                Find Your Perfect
              </h1>
              <h1 className="land-fade" style={{ animationDelay: '0.20s', fontSize: 'clamp(2.4rem,5.5vw,3.8rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.04em', color: c.primary, marginBottom: '1.25rem' }}>
                Tutor Today
              </h1>
              <p className="land-fade" style={{ animationDelay: '0.28s', fontSize: '1.0625rem', lineHeight: 1.65, color: c.secondary, maxWidth: 440, letterSpacing: '-0.012em', marginBottom: '2rem' }}>
                Connect with expert tutors, book sessions instantly, and learn at your own pace — anytime, anywhere across Sri Lanka.
              </p>

              {/* ── HERO BUTTONS ── */}
              <div className="land-fade" style={{ animationDelay: '0.36s', display: 'flex', flexWrap: 'wrap', gap: '0.875rem', marginBottom: '2.5rem' }}>
                <Link to="/student/signup" style={btnPrimary()} {...hoverLift}>
                  <Search style={{ width: 17, height: 17 }} />
                  Find a Tutor
                  <ArrowRight style={{ width: 15, height: 15 }} />
                </Link>
                <Link to="/tutor/signup-step1" style={btnGhost()} {...hoverLiftGhost}>
                  <Zap style={{ width: 17, height: 17, color: c.primary }} />
                  Become a Tutor
                </Link>
              </div>

              {/* Stats row */}
              <div className="land-fade" style={{ animationDelay: '0.44s', display: 'flex', flexWrap: 'wrap', gap: '2rem', paddingTop: '1.5rem', borderTop: `1px solid ${c.sepLight}` }}>
                {[['tutors', stats.tutors + '+', 'Expert Tutors'], ['sessions', (stats.sessions / 1000).toFixed(0) + 'k+', 'Sessions Done'], ['rating', stats.rating + '★', 'Avg Rating'], ['sat', stats.sat + '%', 'Satisfaction']].map(([k, n, l]) => (
                  <div key={k} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.035em', color: c.primary, marginBottom: 2 }}>{n}</p>
                    <p style={{ fontSize: '0.75rem', color: c.secondary, letterSpacing: '-0.005em' }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: hero visual */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: 380, aspectRatio: '4/5', borderRadius: '2rem', overflow: 'hidden', boxShadow: isDark ? '0 30px 80px rgba(0,0,0,0.70)' : '0 20px 60px rgba(0,0,0,0.14)', border: `1px solid ${c.sep}`, position: 'relative' }}>
                <img src="/hero_premium_student.png" alt="Students learning" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: isDark ? 'linear-gradient(180deg,transparent 55%,rgba(0,0,0,0.45) 100%)' : 'linear-gradient(180deg,transparent 60%,rgba(242,242,247,0.25) 100%)' }} />
              </div>

              {/* Floating: review card */}
              <div className="land-float" style={{ ...card, position: 'absolute', left: -40, top: 60, width: 210, padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: isDark ? 'rgba(56,189,248,0.14)' : 'rgba(2,132,199,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>👩🏻‍🎓</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: c.label, letterSpacing: '-0.01em' }}>Amara Silva</p>
                    <p style={{ fontSize: '0.6875rem', color: c.secondary }}>O/L Student</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} style={{ width: 11, height: 11, fill: '#F59E0B', color: '#F59E0B' }} />)}
                </div>
                <p style={{ fontSize: '0.75rem', color: c.secondary, lineHeight: 1.5 }}>Found the perfect tutor. Grades improved!</p>
              </div>

              {/* Floating: rating */}
              <div className="land-float2" style={{ ...card, position: 'absolute', right: -24, top: 30, padding: '0.875rem 1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.375rem', fontWeight: 800, color: c.label, letterSpacing: '-0.03em' }}>4.9 ★</p>
                <p style={{ fontSize: '0.6875rem', color: c.secondary }}>Avg Rating</p>
              </div>

              {/* Floating: online */}
              <div className="land-float3" style={{ ...card, position: 'absolute', left: -16, bottom: 60, display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.green, display: 'inline-block', animation: 'landPulse 2s infinite' }} />
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: c.label, letterSpacing: '-0.01em' }}>120+ Online</p>
                  <p style={{ fontSize: '0.6875rem', color: c.secondary }}>Tutors right now</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════ */}
      <section id="features" style={{ padding: '5rem 1.25rem', borderTop: `1px solid ${c.sep}` }}>
        <Reveal>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.3rem 0.85rem', borderRadius: 9999, background: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(2,132,199,0.07)', border: `1px solid ${c.primary}28`, fontSize: '0.8125rem', fontWeight: 700, color: c.primary, marginBottom: '1rem' }}>
                <TrendingUp style={{ width: 12, height: 12 }} /> Platform Features
              </div>
              <h2 style={{ fontSize: 'clamp(1.75rem,4vw,2.4rem)', fontWeight: 800, letterSpacing: '-0.035em', color: c.label, marginBottom: '0.75rem' }}>Everything to Excel</h2>
              <p style={{ color: c.secondary, maxWidth: 460, margin: '0 auto', lineHeight: 1.65 }}>From discovery to booking to learning — all in one place.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1rem' }}>
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 60}>
                  <div className="feat-hover" style={{ ...card, padding: '1.5rem', height: '100%' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 13, background: `${f.color}18`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                      <f.icon style={{ width: 21, height: 21, color: f.color }} />
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.015em', color: c.label, marginBottom: '0.375rem' }}>{f.title}</h3>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: c.secondary }}>{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ INSTITUTE SECTION ════════════════════════════════════ */}
      <section id="institutes" style={{ padding: '5rem 1.25rem', background: c.bgSection }}>
        <Reveal>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '3.5rem', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.3rem 0.85rem', borderRadius: 9999, background: isDark ? 'rgba(74,222,128,0.12)' : 'rgba(22,163,74,0.08)', border: `1px solid ${c.green}30`, fontSize: '0.8125rem', fontWeight: 700, color: c.green, marginBottom: '1.25rem' }}>
                  <Building2 style={{ width: 12, height: 12 }} /> For Educational Institutes
                </div>
                <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.035em', color: c.label, lineHeight: 1.15, marginBottom: '1rem' }}>
                  Register Your Institute on TutorHub
                </h2>
                <p style={{ color: c.secondary, lineHeight: 1.7, marginBottom: '1.75rem', fontSize: '1rem' }}>
                  Join TutorHub as an institute manager to connect with qualified tutors, manage your roster, and be discovered by thousands of students.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2rem' }}>
                  {[['Connect with Tutors', 'Tutors can request to join your institute', c.primary], ['Showcase Your Institute', 'Add photos, timetables and a full profile page', c.green], ['Increase Visibility', 'Students searching for institutes will find you', c.orange]].map(([t, d, col]) => (
                    <div key={t as string} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <CheckCircle2 style={{ width: 18, height: 18, color: col as string, flexShrink: 0, marginTop: 3 }} />
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: c.label, letterSpacing: '-0.01em' }}>{t}</p>
                        <p style={{ fontSize: '0.8125rem', color: c.secondary, marginTop: 2 }}>{d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem' }}>
                  <Link to="/institute/register" style={btnGreen()}>
                    <Building2 style={{ width: 16, height: 16 }} />
                    Register Institute
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                  <Link to="/institutes" style={btnGhost({ fontSize: '0.875rem', padding: '0.7rem 1.25rem' })}>
                    Browse Institutes <ChevronRight style={{ width: 14, height: 14 }} />
                  </Link>
                  <Link to="/institute/login" style={btnGhost({ fontSize: '0.875rem', padding: '0.7rem 1.25rem' })}>
                    Institute Login <ChevronRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                {[
                  { icon: Building2, color: c.primary, t: 'Register Account', d: 'Sign up as an Institute Manager' },
                  { icon: Users,     color: c.green,   t: 'Submit Details',   d: 'Admin reviews your application' },
                  { icon: Shield,    color: c.orange,  t: 'Get Approved',     d: 'Institute page goes live' },
                  { icon: TrendingUp,color: '#8B5CF6', t: 'Grow Together',    d: 'Manage tutors, attract students' },
                ].map((item, i) => (
                  <div key={i} className="feat-hover" style={{ ...card, padding: '1.25rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: `${item.color}16`, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                      <item.icon style={{ width: 18, height: 18, color: item.color }} />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: c.label, letterSpacing: '-0.01em', marginBottom: 3 }}>{item.t}</p>
                    <p style={{ fontSize: '0.75rem', color: c.secondary, lineHeight: 1.5 }}>{item.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════ */}
      <section id="how" style={{ padding: '5rem 1.25rem', borderTop: `1px solid ${c.sep}` }}>
        <Reveal>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: 'clamp(1.75rem,4vw,2.4rem)', fontWeight: 800, letterSpacing: '-0.035em', color: c.label, marginBottom: '0.5rem' }}>How It Works</h2>
              <p style={{ color: c.secondary }}>Start learning in 4 simple steps</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem' }}>
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 80}>
                  <div className="feat-hover" style={{ ...card, padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 13, background: `linear-gradient(135deg,#0EA5E9,#0284C7)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: '#fff', margin: '0 auto 1rem', boxShadow: '0 4px 14px rgba(14,165,233,0.40)' }}>
                      {s.n}
                    </div>
                    <h4 style={{ fontWeight: 700, color: c.label, letterSpacing: '-0.015em', fontSize: '0.9rem', marginBottom: '0.375rem' }}>{s.t}</h4>
                    <p style={{ fontSize: '0.8125rem', color: c.secondary, lineHeight: 1.55 }}>{s.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════════ */}
      <section style={{ padding: '5rem 1.25rem', background: c.bgSection }}>
        <Reveal>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: 'clamp(1.75rem,4vw,2.4rem)', fontWeight: 800, letterSpacing: '-0.035em', color: c.label, marginBottom: '0.5rem' }}>What Students Say</h2>
              <p style={{ color: c.secondary }}>Real reviews from real learners</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
              {REVIEWS.map((r, i) => (
                <Reveal key={r.name} delay={i * 80}>
                  <div className="feat-hover" style={{ ...card, padding: '1.5rem', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(2,132,199,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>{r.avatar}</div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: c.label, letterSpacing: '-0.01em' }}>{r.name}</p>
                        <p style={{ fontSize: '0.75rem', color: c.secondary }}>{r.role}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2, marginBottom: '0.875rem' }}>
                      {[...Array(r.stars)].map((_, i) => <Star key={i} style={{ width: 13, height: 13, fill: '#F59E0B', color: '#F59E0B' }} />)}
                    </div>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: c.secondary, fontStyle: 'italic' }}>"{r.text}"</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ CTA BANNER ═══════════════════════════════════════════ */}
      <section style={{ padding: '5rem 1.25rem', borderTop: `1px solid ${c.sep}` }}>
        <Reveal>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', padding: '3.5rem 2rem', borderRadius: '1.5rem', background: isDark ? 'rgba(56,189,248,0.07)' : 'rgba(2,132,199,0.05)', border: `1px solid ${c.primary}25`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 340, height: 180, borderRadius: '50%', background: `radial-gradient(circle,${c.primaryGlow} 0%,transparent 70%)`, filter: 'blur(60px)' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.25rem 0.75rem', borderRadius: 9999, background: isDark ? 'rgba(74,222,128,0.12)' : 'rgba(22,163,74,0.08)', border: `1px solid ${c.green}30`, fontSize: '0.75rem', fontWeight: 700, color: c.green, marginBottom: '1.25rem' }}>
                <CheckCircle2 style={{ width: 12, height: 12 }} /> Free to start — no credit card required
              </div>
              <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.035em', color: c.label, marginBottom: '0.75rem' }}>Ready to Start Learning?</h2>
              <p style={{ color: c.secondary, lineHeight: 1.65, marginBottom: '2rem' }}>
                Join thousands of students who found their perfect tutor on TutorHub.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.875rem' }}>
                <Link to="/student/signup" style={btnPrimary({ padding: '0.85rem 1.75rem', fontSize: '1rem' })} {...hoverLift}>
                  Get Started Free <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
                <Link to="/tutor/signup-step1" style={btnGhost({ padding: '0.85rem 1.75rem', fontSize: '1rem' })} {...hoverLiftGhost}>
                  Become a Tutor <ChevronRight style={{ width: 16, height: 16 }} />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer style={{ padding: '2.5rem 1.25rem', borderTop: `1px solid ${c.sep}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,#0EA5E9,#0284C7)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap style={{ width: 15, height: 15, color: '#fff' }} />
              </div>
              <span style={{ fontWeight: 800, letterSpacing: '-0.025em', color: c.label }}>TutorHub</span>
            </div>
            <Link to="/admin/login" style={{ fontSize: '0.75rem', color: c.tertiary, textDecoration: 'none', transition: 'color 0.18s' }}
              onMouseEnter={e => (e.currentTarget.style.color = c.primary)} onMouseLeave={e => (e.currentTarget.style.color = c.tertiary)}>
              Admin Login
            </Link>
          </div>
          <p style={{ fontSize: '0.875rem', color: c.tertiary }}>© 2025 TutorHub · All rights reserved.</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" style={{ fontSize: '0.875rem', color: c.secondary, textDecoration: 'none', transition: 'color 0.18s' }}
                onMouseEnter={e => (e.currentTarget.style.color = c.primary)} onMouseLeave={e => (e.currentTarget.style.color = c.secondary)}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}