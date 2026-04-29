import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { getStoredUser, getStoredToken, logout } from '../utils/authService';
import { adminBackendApi } from '../utils/adminApi';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import {
  Users, LogOut, Shield, BookOpen, UserCog, GraduationCap,
  ClipboardList, TrendingUp, Database, Trash2, AlertTriangle, Star, PieChart, HelpCircle, Building2
} from 'lucide-react';

const PERMANENT_ADMIN_EMAIL = 'admin@gmail.com';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [wiping, setWiping] = useState(false);
  const user = getStoredUser();

  useEffect(() => { init(); }, []);

  const init = async () => {
    const token = getStoredToken();
    const u = getStoredUser();
    if (!token || !u || (u.role || '').toLowerCase() !== 'admin') {
      navigate('/admin/login');
      setLoading(false);
      return;
    }
    try {
      const result = await adminBackendApi.getUsers();
      setUsers(result.users || []);
      const reqRes = await adminBackendApi.getTutorRequests('PENDING').catch(() => ({ requests: [] }));
      setPendingRequestsCount((reqRes.requests || []).length);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  const handleWipeData = async () => {
    if (!confirm('⚠️ This will permanently delete ALL users (except admin), tutors, chats, and subscriptions. Type CONFIRM to proceed.')) return;
    const input = prompt('Type WIPE to confirm complete data reset:');
    if (input !== 'WIPE') { toast.error('Cancelled — data not wiped'); return; }
    setWiping(true);
    try {
      const token = getStoredToken();
      const res = await fetch('/api/admin/wipe-data', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Wipe failed');
      toast.success('All data wiped successfully. Fresh start!');
      await init();
    } catch (e: any) {
      toast.error(e.message || 'Wipe failed');
    } finally {
      setWiping(false);
    }
  };

  const studentCount = users.filter((u) => (u.role || '').toLowerCase() === 'student').length;
  const tutorCount = users.filter((u) => (u.role || '').toLowerCase() === 'tutor').length;
  const tutorPendingCount = users.filter((u) => (u.role || '').toLowerCase() === 'tutor_pending').length;
  const adminCount = users.filter((u) => (u.role || '').toLowerCase() === 'admin').length;

  const divStyle = { minHeight: '100vh' };
  // Theme-aware styles — dark mode unchanged, light uses gray palette
  const cardStyle = isDark
    ? { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem' }
    : { background: '#eeebf5', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid #a8a4c6', borderRadius: '1rem', boxShadow: '0 2px 12px rgba(60,50,140,0.1)' };
  const headingColor = isDark ? '#ffffff' : '#0f0e1a';
  const subColor     = isDark ? '#8888AA' : '#555292';
  const tableSubColor= isDark ? '#555577' : '#4a4770';
  const cellColor    = isDark ? '#ffffff' : '#0f0e1a';
  const cellSubColor = isDark ? '#8888AA' : '#555292';
  const rowDivider   = isDark ? 'rgba(255,255,255,0.04)' : '#c8c4e0';

  if (loading) {
    return (
      <div style={divStyle} className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#6C63FF] border-t-transparent animate-spin" />
          <p style={{ color: '#8888AA' }}>Loading admin panel…</p>
        </div>
      </div>
    );
  }

  const modules = [
    { to: '/admin/accounts',    icon: UserCog,     label: 'Accounts',       desc: 'Students, Tutors & Admins', color: '#6C63FF', badge: null },
    { to: '/admin/institutes',   icon: Building2,   label: 'Institutes',      desc: 'Manage institutes & requests', color: '#10B981', badge: null },
    { to: '/admin/subjects',    icon: BookOpen,    label: 'Subjects',        desc: 'Categories, streams & subjects', color: '#F59E0B', badge: null },
    { to: '/admin/quizzes',     icon: HelpCircle,  label: 'Quizzes',         desc: 'Manage knowledge assessments', color: '#3B82F6', badge: null },
    { to: '/admin/tutor-requests', icon: ClipboardList, label: 'Tutor Requests', desc: 'Approve or reject submisions', color: '#EF4444', badge: pendingRequestsCount > 0 ? pendingRequestsCount : null },
    { to: '/admin/reviews',     icon: Star,        label: 'Reviews',         desc: 'Moderate student ratings', color: '#EAB308', badge: null },
    { to: '/admin/financials',  icon: PieChart,    label: 'Financials',      desc: 'Platform revenue and stats', color: '#8B5CF6', badge: null },
  ];

  const stats = [
    { label: 'Total Users', value: users.length, color: '#6C63FF', icon: Users },
    { label: 'Students', value: studentCount, color: '#3B82F6', icon: Users },
    { label: 'Active Tutors', value: tutorCount, color: '#10B981', icon: GraduationCap },
    { label: 'Pending Tutors', value: tutorPendingCount, color: '#F59E0B', icon: ClipboardList },
  ];

  return (
    <div style={divStyle} className="px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)' }}>
              <Shield className="w-7 h-7" style={{ color: '#EF4444' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: headingColor }}>Admin Panel</h1>
              <p style={{ color: subColor }}>Manage the TutorHub platform · {user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#eeebf5', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}18` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
              </div>
              <div className="text-3xl font-bold" style={{ color: headingColor }}>{value}</div>
              <div className="text-xs mt-1" style={{ color: subColor }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Module Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map(({ to, icon: Icon, label, desc, color, badge }) => (
            <Link key={to} to={to}
              className="group rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{ ...cardStyle, boxShadow: 'none' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${color}1A` }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                {badge !== null && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ background: '#EF4444' }}>{badge}</span>
                )}
              </div>
              <h3 className="font-semibold mb-1" style={{ color: headingColor }}>{label}</h3>
              <p className="text-xs" style={{ color: subColor }}>{desc}</p>
              <div className="mt-4 text-xs font-medium transition-colors group-hover:text-white" style={{ color: color }}>
                Open →
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Users */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: headingColor }}>Recent Users</h2>
            <Link to="/admin/accounts"
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: isDark ? 'rgba(108,99,255,0.1)' : 'rgba(108,99,255,0.12)', color: '#9999CC' }}>
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: tableSubColor }}>
                  <th className="pb-3 text-left font-medium">Name</th>
                  <th className="pb-3 text-left font-medium">Email</th>
                  <th className="pb-3 text-left font-medium">Role</th>
                  <th className="pb-3 text-left font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: rowDivider }}>
                {users.slice(0, 8).map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 font-medium" style={{ color: cellColor }}>{u.name}</td>
                    <td className="py-3" style={{ color: cellSubColor }}>{u.email}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: u.role === 'admin' ? '#EF444420' : u.role === 'tutor' ? '#6C63FF20' : '#10B98120',
                          color: u.role === 'admin' ? '#EF4444' : u.role === 'tutor' ? '#9999FF' : '#10B981',
                        }}>{u.role}</span>
                    </td>
                    <td className="py-3" style={{ color: cellSubColor }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="text-center py-8 text-sm" style={{ color: subColor }}>No users yet</p>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl p-5" style={{ ...cardStyle, border: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5" style={{ color: '#EF4444' }} />
            <h2 className="font-semibold" style={{ color: '#EF4444' }}>Danger Zone</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: headingColor }}>Wipe All Data (Fresh Start)</p>
              <p className="text-xs mt-1" style={{ color: subColor }}>
                Permanently deletes all users (except admin), tutors, chats, and subscriptions. Cannot be undone.
              </p>
            </div>
            <button
              onClick={handleWipeData}
              disabled={wiping}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
              <Trash2 className="w-4 h-4" />
              {wiping ? 'Wiping…' : 'Wipe All Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
