import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { getStoredUser, getStoredToken } from '../utils/authService';
import { adminBackendApi } from '../utils/adminApi';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export function AdminTutorsPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user || (user.role || '').toLowerCase() !== 'admin') {
      navigate('/admin/login');
      return;
    }
    load();
  }, [navigate]);

  const load = async () => {
    try {
      const res = await adminBackendApi.getUsers();
      const tutors = (res.users || []).filter(
        (u: any) => (u.role || '').toLowerCase() === 'tutor' || (u.role || '').toLowerCase() === 'tutor_pending'
      );
      setUsers(tutors);
    } catch (e) {
      toast.error('Failed to load tutors');
    } finally {
      setLoading(false);
    }
  };

  const headingColor = isDark ? '#ffffff' : '#0f0e1a';
  const subColor     = isDark ? '#8888AA' : '#555292';
  const cardStyle = isDark
    ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem' }
    : { background: '#eeebf5', border: '1px solid #a8a4c6', borderRadius: '1rem', boxShadow: '0 2px 16px rgba(60,50,140,0.1)' };
  const tableHeadTxt = isDark ? '#777799' : '#4a4770';
  const cellTxt      = isDark ? '#ffffff' : '#0f0e1a';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl" style={{ color: subColor }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" asChild style={{ color: headingColor }}>
            <Link to="/admin/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold" style={{ color: headingColor }}>Manage Tutors</h1>
        </div>

        <div style={cardStyle} className="overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#b8b4d0' }}>
            <h2 className="text-lg font-semibold" style={{ color: headingColor }}>Tutor list</h2>
            <p className="text-sm mt-0.5" style={{ color: subColor }}>All tutors and their approval status. Only approved tutors appear in student search.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: isDark ? 'transparent' : '#e4e0ed' }}>
                <tr>
                  {['Name', 'Email', 'Status', 'Created'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left font-semibold" style={{ color: tableHeadTxt }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id} style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #c8c4e0', background: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.01)' : 'rgba(168,164,198,0.15)') }}>
                    <td className="px-6 py-4 font-medium" style={{ color: cellTxt }}>{u.name}</td>
                    <td className="px-6 py-4" style={{ color: subColor }}>{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: (u.role || '').toLowerCase() === 'tutor' ? '#10B98122' : '#6C63FF22',
                          color: (u.role || '').toLowerCase() === 'tutor' ? '#059669' : '#6C63FF',
                        }}>
                        {(u.role || '').toLowerCase() === 'tutor' ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4" style={{ color: subColor }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12" style={{ color: subColor }}>No tutors yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
