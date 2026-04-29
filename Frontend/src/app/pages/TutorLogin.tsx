import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { GraduationCap, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

export function TutorLogin() {
  const navigate = useNavigate();
  const { login } = useChatAuth();
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/tutor/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const card = isDark ? 'bg-white/5 border-white/10' : 'border';
  const cardStyle = isDark
    ? {}
    : { background: '#edeaf8', borderColor: '#a8a4c6', boxShadow: '0 4px 24px rgba(60,50,140,0.14)' };

  const textPrimary = isDark ? 'text-white' : 'text-[#0f0e1a]';
  const textSub     = isDark ? 'text-white/60' : 'text-[#555292]';
  const textLabel   = isDark ? 'text-white/90' : 'text-[#2d2a50]';
  const textLink    = isDark ? 'text-white/60' : 'text-[#555292]';
  const textBack    = isDark ? 'text-white/50' : 'text-[#6665a0]';
  const iconBtn     = isDark ? 'text-white/50 hover:text-white/90' : 'text-[#6665a0] hover:text-[#0f0e1a]';
  const inputClass  = isDark
    ? 'h-12 border-white/10 text-white dark:placeholder:text-white/50 rounded-xl'
    : 'h-12 text-[#0f0e1a] rounded-xl';
  const inputStyle  = isDark ? {} : { background: '#eeebf5', borderColor: '#a8a4c6', color: '#0f0e1a' };

  const wrapBg = isDark
    ? { background: 'rgba(6,4,15,0.5)' }
    : { background: 'transparent' };

  return (
    <div className="min-h-screen flex" style={wrapBg}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6C63FF 50%, #3B82F6 100%)' }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 60% 30%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="relative z-10 text-white text-center max-w-md">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 text-white">Tutor Portal</h2>
          <p className="text-xl text-white/80 mb-8">Manage your classes, students and earnings from one place.</p>
          <div className="grid grid-cols-2 gap-4">
            {[['30-day', 'Free Trial'], ['LKR 3k', 'Per Month'], ['24/7', 'Support'], ['500+', 'Students']].map(([val, label]) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{val}</div>
                <div className="text-sm text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6C63FF] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#6C63FF] bg-clip-text text-transparent">TutorHub</span>
          </div>

          <div className={`backdrop-blur-lg rounded-3xl shadow-2xl p-8 border ${card}`} style={cardStyle}>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-[#7C3AED]" />
                <span className="text-sm font-semibold text-[#7C3AED] uppercase tracking-wide">Tutor Access</span>
              </div>
              <h1 className={`text-3xl font-bold mb-2 ${textPrimary}`}>Sign In</h1>
              <p className={textSub}>Continue managing your students</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className={`${textLabel} font-medium`}>Email</Label>
                <Input type="email" placeholder="tutor@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} style={inputStyle} />
              </div>
              <div className="space-y-2">
                <Label className={`${textLabel} font-medium`}>Password</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)} required className={`${inputClass} pr-12`} style={inputStyle} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconBtn}`}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading}
                className="w-full h-12 rounded-xl text-base font-semibold text-white border-0 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6C63FF)' }}>
                {loading ? 'Signing in...' : (
                  <span className="flex items-center gap-2">Sign In <ArrowRight className="w-4 h-4" /></span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className={`${textLink} text-sm`}>
                New tutor?{' '}
                <Link to="/tutor/signup" className="font-semibold text-[#7C3AED] hover:underline">Register here</Link>
              </p>
              <p className={`${textBack} text-sm`}>
                Looking to learn?{' '}
                <Link to="/student/login" className="text-[#3B82F6] hover:underline">Student Login</Link>
              </p>
            </div>
          </div>
          <p className={`text-center mt-4 text-sm ${textBack}`}>
            <Link to="/" className="hover:text-[#6C63FF] transition-colors">← Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
