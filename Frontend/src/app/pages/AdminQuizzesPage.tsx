import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { getStoredUser, getStoredToken } from '../utils/authService';
import { AdminQuizManagement } from '../components/AdminQuizManagement';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export function AdminQuizzesPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  const headColor = isDark ? '#ffffff' : '#0f0e1a';
  const subColor  = isDark ? '#8888AA' : '#555292';
  const btnBg     = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.82)';
  const btnColor  = isDark ? '#9999CC' : '#3d3a6b';
  const btnBdr    = isDark ? 'none' : '1px solid rgba(108,99,255,0.2)';

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user || (user.role || '').toLowerCase() !== 'admin') {
      navigate('/admin/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Deck */}
        <div className="flex items-center gap-6">
          <Link to="/admin/dashboard"
            className="p-3.5 rounded-2xl transition-all hover:scale-105 shadow-xl"
            style={{ background: btnBg, color: btnColor, border: btnBdr }}>
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <HelpCircle className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: headColor }}>Manage Quizzes</h1>
              <p className="text-sm" style={{ color: subColor }}>
                Academic Simulations & Knowledge Assessment Center
              </p>
            </div>
          </div>
        </div>

        {/* Informational Bridge */}
        <div className="rounded-3xl p-6 relative overflow-hidden group border border-white/5" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(108,99,255,0.05)' }}>
          <div className="flex items-start gap-4 z-10 relative">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🚀</span>
            </div>
            <div>
              <p className="text-sm font-medium mb-1 text-blue-400">Construct Dynamic Assessments</p>
              <p className="text-xs leading-relaxed opacity-60 max-w-3xl" style={{ color: subColor }}>
                Design high-stakes simulations linked directly to your academic hierarchy. Add multi-stage questions, set precise time limits, and provide explanatory logic to guide student mastery. All quizzes are categorized by level and subject for streamlined student discovery.
              </p>
            </div>
          </div>
        </div>

        {/* Management Area */}
        <AdminQuizManagement />
      </div>
    </div>
  );
}