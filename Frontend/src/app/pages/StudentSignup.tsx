import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { authAPI } from '../utils/api';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { GraduationCap, Eye, EyeOff, ArrowRight, Star } from 'lucide-react';

export function StudentSignup() {
  const navigate = useNavigate();
  const { login } = useChatAuth();
  const { isDark } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [grade, setGrade] = useState('');
  const [age, setAge] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authAPI.signup(email, password, fullName, 'student', {
        contactNumber,
        grade,
        age,
        parentName,
        parentContact
      });
      await login(email, password);
      toast.success('Account created! Welcome to TutorHub 🎉');
      navigate('/student/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
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
  const selectClass = isDark
    ? 'w-full h-12 px-4 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-[#6c63ff] [color-scheme:dark]'
    : 'w-full h-12 px-4 rounded-xl outline-none focus:border-[#6c63ff]';
  const selectStyle = isDark ? {} : { background: '#eeebf5', border: '1px solid #a8a4c6', color: '#0f0e1a' };

  const wrapBg = isDark
    ? { background: 'rgba(6,4,15,0.5)' }
    : { background: 'transparent' };

  return (
    <div className="min-h-screen flex" style={wrapBg}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #3B82F6 60%, #06B6D4 100%)' }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 text-white text-center max-w-md">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 text-white">Start Learning Today</h2>
          <p className="text-xl text-white/80 mb-8">Join thousands of students finding their perfect tutors on TutorHub.</p>
          <div className="space-y-4">
            {['Browse 500+ verified tutors', 'Filter by subject & grade level', 'Chat directly with tutors', 'Rate and review sessions'].map((feat) => (
              <div key={feat} className="flex items-center gap-3 text-left bg-white/10 rounded-xl px-4 py-3">
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300 flex-shrink-0" />
                <span className="text-white/90">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#3B82F6] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#6C63FF] to-[#3B82F6] bg-clip-text text-transparent">TutorHub</span>
          </div>

          <div className={`backdrop-blur-lg rounded-3xl shadow-2xl p-8 border ${card}`} style={cardStyle}>
            <div className="mb-8">
              <h1 className={`text-3xl font-bold mb-2 ${textPrimary}`}>Create Account</h1>
              <p className={textSub}>Free forever for students</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className={`${textLabel} font-medium`}>Full Name</Label>
                <Input placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} style={inputStyle} />
              </div>
              <div className="space-y-2">
                <Label className={`${textLabel} font-medium`}>Email</Label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} style={inputStyle} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className={`${textLabel} font-medium`}>Contact Number</Label>
                  <Input placeholder="07XXXXXXXX" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required className={inputClass} style={inputStyle} />
                </div>
                <div className="space-y-2">
                  <Label className={`${textLabel} font-medium`}>Grade / Year</Label>
                  <select required value={grade} onChange={(e) => setGrade(e.target.value)} className={selectClass} style={selectStyle}>
                    <option value="" disabled style={{ background: isDark ? '#1a1528' : '#eeebf5', color: isDark ? '#fff' : '#0f0e1a' }}>Select Grade</option>
                    {[6, 7, 8, 9, 10, 11, 'O/L', 'A/L', 'Undergraduate', 'Professional'].map((g) => (
                      <option key={g} value={String(g)} style={{ background: isDark ? '#1a1528' : '#eeebf5', color: isDark ? '#fff' : '#0f0e1a' }}>
                        {typeof g === 'number' ? `Grade ${g}` : g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className={`${textLabel} font-medium`}>Age</Label>
                  <Input type="number" placeholder="16" value={age} onChange={(e) => setAge(e.target.value)} required className={inputClass} style={inputStyle} />
                </div>
                <div className="space-y-2">
                  <Label className={`${textLabel} font-medium`}>Parent/Guardian Name</Label>
                  <Input placeholder="Parent Name" value={parentName} onChange={(e) => setParentName(e.target.value)} required className={inputClass} style={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className={`${textLabel} font-medium`}>Parent Contact</Label>
                  <Input placeholder="Parent Phone Number" value={parentContact} onChange={(e) => setParentContact(e.target.value)} required className={inputClass} style={inputStyle} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={`${textLabel} font-medium`}>Password</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={password}
                    onChange={(e) => setPassword(e.target.value)} required className={`${inputClass} pr-12`} style={inputStyle} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconBtn}`}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading}
                className="w-full h-12 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-[#6C63FF] to-[#3B82F6] border-0 hover:shadow-lg hover:shadow-[#6C63FF]/30 transition-all duration-300 hover:-translate-y-0.5">
                {loading ? 'Creating account...' : (
                  <span className="flex items-center gap-2">Create Account <ArrowRight className="w-4 h-4" /></span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className={`${textLink} text-sm`}>
                Already have an account?{' '}
                <Link to="/student/login" className="font-semibold text-[#6C63FF] hover:underline">Sign in</Link>
              </p>
              <p className={`${textBack} text-sm`}>
                Want to teach?{' '}
                <Link to="/tutor/signup" className="text-[#3B82F6] hover:underline">Become a Tutor</Link>
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
