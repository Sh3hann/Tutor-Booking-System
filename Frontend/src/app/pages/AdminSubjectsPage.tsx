import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { getStoredUser, getStoredToken } from '../utils/authService';
import { AdminSubjectManagement } from '../components/AdminSubjectManagement';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, BookOpen } from 'lucide-react';

export function AdminSubjectsPage() {
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
    <div style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard"
            className="p-2.5 rounded-xl transition-all hover:scale-105"
            style={{ background: btnBg, color: btnColor, border: btnBdr }}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.15)' }}>
              <BookOpen className="w-5 h-5" style={{ color: '#F59E0B' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: headColor }}>Manage Subjects</h1>
              <p className="text-sm" style={{ color: subColor }}>
                3-level hierarchy: Category → Stream → Subject
              </p>
            </div>
          </div>
        </div>

        {/* How it works info box */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: '#F59E0B' }}>📚 3-Level Hierarchy</p>
          <p className="text-xs" style={{ color: subColor }}>
            <strong style={{ color: headColor }}>Category</strong> (e.g., A/L Advanced Level) →{' '}
            <strong style={{ color: headColor }}>Stream</strong> (e.g., Science Stream, Commerce Stream) →{' '}
            <strong style={{ color: headColor }}>Subject</strong> (e.g., Physics, Chemistry, Accounting). Streams are optional — you can add subjects directly to a category too.
          </p>
        </div>

        {/* Subject Management Component */}
        <AdminSubjectManagement />
      </div>
    </div>
  );
}