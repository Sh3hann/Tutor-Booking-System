import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight, GraduationCap } from 'lucide-react';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';

export function InstituteLogin() {
  const navigate = useNavigate();
  const { login } = useChatAuth();
  const { isDark } = useTheme();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      // login() stores user in context; check role from storage
      const stored = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
      const user   = JSON.parse(stored);
      if (user.role === 'institute_manager') {
        toast.success('Welcome back!');
        navigate('/institute/dashboard');
      } else {
        // Wrong account type
        toast.error('This account is not an institute manager. Use the tutor or student login instead.');
        navigate('/institute/login');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Styles ── */
  const s = {
    bg:       isDark ? '#000000'              : '#F2F2F7',
    card:     isDark ? '#1C1C1E'              : '#FFFFFF',
    border:   isDark ? 'rgba(84,84,88,0.50)' : 'rgba(60,60,67,0.20)',
    label:    isDark ? 'rgba(255,255,255,0.92)' : '#1C1C1E',
    secondary:isDark ? 'rgba(235,235,245,0.60)' : 'rgba(60,60,67,0.60)',
    blue:     isDark ? '#0A84FF'              : '#007AFF',
    inputBg:  isDark ? 'rgba(44,44,46,0.80)' : '#FFFFFF',
    shadow:   isDark ? 'none' : '0 4px 32px rgba(0,0,0,0.10)',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
    background: s.inputBg, border: `1px solid ${s.border}`, color: s.label,
    fontSize: '0.9375rem', outline: 'none',
    transition: 'border-color 0.18s, box-shadow 0.18s',
    fontFamily: "-apple-system, 'Inter', sans-serif",
  };
  const focusIn  = (e: any) => { e.target.style.borderColor = s.blue; e.target.style.boxShadow = `0 0 0 3px ${s.blue}20`; };
  const focusOut = (e: any) => { e.target.style.borderColor = s.border; e.target.style.boxShadow = 'none'; };

  return (
    <div className="min-h-screen flex" style={{ background: s.bg, fontFamily: "-apple-system, 'SF Pro Display', 'Inter', sans-serif" }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg,#0EA5E9 0%,#0284C7 50%,#0369A1 100%)' }}>
        <div className="absolute inset-0 opacity-15"
          style={{ backgroundImage: 'radial-gradient(circle at 60% 30%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="relative z-10 text-white text-center max-w-md">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Institute Portal</h2>
          <p className="text-xl text-white/80 mb-10">Manage your institute, tutors, and profile from one place.</p>
          <div className="grid grid-cols-2 gap-4">
            {[['Tutor Roster','Manage who teaches at your institute'],['Institute Profile','Edit details, photos & timetable'],['Join Requests','Approve or reject tutor applications'],['Analytics','Track growth and engagement']].map(([v, l]) => (
              <div key={v} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-left">
                <div className="text-sm font-bold text-white mb-1">{v}</div>
                <div className="text-xs text-white/60">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: s.blue }}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold" style={{ color: s.blue }}>TutorHub</span>
          </div>

          <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: '1.5rem', padding: '2.5rem', boxShadow: s.shadow }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${s.blue}18` }}>
                <Building2 style={{ width: 20, height: 20, color: s.blue }} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.blue }}>Institute Access</div>
                <h1 className="text-2xl font-bold" style={{ color: s.label }}>Sign In</h1>
              </div>
            </div>
            <p className="text-sm mb-8" style={{ color: s.secondary }}>
              Sign in to manage your institute, tutors, and more.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: s.secondary }}>
                  <Mail style={{ width: 12, height: 12, display: 'inline', marginRight: 5 }} />Email Address
                </label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="institute@example.com" style={inputStyle}
                  onFocus={focusIn} onBlur={focusOut} />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: s.secondary }}>
                  <Lock style={{ width: 12, height: 12, display: 'inline', marginRight: 5 }} />Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" style={{ ...inputStyle, paddingRight: '2.75rem' }}
                    onFocus={focusIn} onBlur={focusOut} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: s.secondary, padding: 0 }}>
                    {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.875rem', background: s.blue, color: '#fff', fontWeight: 700, fontSize: '0.9375rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 16px ${s.blue}44`, opacity: loading ? 0.7 : 1, transition: 'opacity 0.18s' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                {loading ? 'Signing in…' : <><span>Sign In</span><ArrowRight style={{ width: 15, height: 15 }} /></>}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center text-sm" style={{ color: s.secondary }}>
              <p>
                New institute?{' '}
                <Link to="/institute/register" style={{ color: s.blue, fontWeight: 600 }}>Register here</Link>
              </p>
              <p>
                <Link to="/" style={{ color: s.secondary }}>← Back to Home</Link>
              </p>
            </div>
          </div>

          {/* Other portals */}
          <div className="mt-4 flex justify-center gap-6 text-xs" style={{ color: s.secondary }}>
            <Link to="/tutor/login"   style={{ color: s.secondary }}>Tutor Login</Link>
            <Link to="/student/login" style={{ color: s.secondary }}>Student Login</Link>
            <Link to="/admin/login"   style={{ color: s.secondary }}>Admin Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
