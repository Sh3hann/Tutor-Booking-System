import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import { getStoredUser, getStoredToken } from '../utils/authService';
import { adminBackendApi } from '../utils/adminApi';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { ArrowLeft, Eye, Trash2, Mail, Phone, Calendar, Shield, Search, GraduationCap, BookOpen, UserCog, Building2 } from 'lucide-react';

const PERMANENT_ADMIN_EMAIL = 'admin@gmail.com';

type RoleTab = 'students' | 'tutors' | 'institutes' | 'admins';

export function AdminAccountsPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RoleTab>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModal, setViewModal] = useState<any | null>(null);
  const [deleteModal, setDeleteModal] = useState<any | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user || (user.role || '').toLowerCase() !== 'admin') {
      navigate('/admin/login'); return;
    }
    load();
  }, [navigate]);

  const load = async () => {
    try {
      const res = await adminBackendApi.getUsers();
      setUsers(res.users || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const isProtected = (u: any) =>
    u.email && u.email.toLowerCase() === PERMANENT_ADMIN_EMAIL.toLowerCase();

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await adminBackendApi.deleteUser(deleteModal.id);
      toast.success('User deleted');
      setDeleteModal(null);
      load();
    } catch (e: any) { toast.error(e.message || 'Failed to delete user'); }
  };

  // Theme
  const pageBg    = isDark ? {} : { background: 'transparent' };
  const cardStyle = isDark
    ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem' }
    : { background: '#eeebf5', border: '1px solid #a8a4c6', borderRadius: '1rem', boxShadow: '0 2px 16px rgba(60,50,140,0.1)' };
  const headingColor = isDark ? '#ffffff' : '#0f0e1a';
  const subColor     = isDark ? '#8888AA' : '#555292';
  const tableHeadBg  = isDark ? {} : { background: '#e4e0ed' };
  const tableHeadTxt = isDark ? '#777799' : '#4a4770';
  const cellTxt      = isDark ? '#ffffff' : '#0f0e1a';
  const rowHover     = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(168,164,198,0.15)';
  const dialogBg     = isDark
    ? { background: '#0b0914', border: '1px solid rgba(255,255,255,0.1)' }
    : { background: '#edeaf8', border: '1px solid #a8a4c6' };
  const dialogTxt    = isDark ? '#ffffff' : '#0f0e1a';
  const dialogSub    = isDark ? '#8888AA' : '#555292';

  // Tabs
  const tabs: { id: RoleTab; label: string; icon: React.ReactNode; roles: string[] }[] = [
    { id: 'students',   label: 'Students',    icon: <GraduationCap className="w-4 h-4" />, roles: ['student'] },
    { id: 'tutors',     label: 'Tutors',      icon: <BookOpen className="w-4 h-4" />,      roles: ['tutor']   },
    { id: 'institutes', label: 'Institutes',  icon: <Building2 className="w-4 h-4" />,     roles: ['institute_manager'] },
    { id: 'admins',     label: 'Admins',      icon: <UserCog className="w-4 h-4" />,       roles: ['admin']   },
  ];

  const activeTabDef = tabs.find(t => t.id === activeTab)!;
  const filtered = users
    .filter(u => activeTabDef.roles.includes((u.role || '').toLowerCase()))
    .filter(u => {
      const q = searchQuery.toLowerCase();
      return !q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });

  const roleBadge = (role: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      admin:   { bg: '#EF444422', color: '#EF4444' },
      tutor:   { bg: '#6C63FF22', color: '#6C63FF' },
      student: { bg: '#10B98122', color: '#059669' },
      institute_manager: { bg: '#F59E0B22', color: '#F59E0B' },
    };
    const s = styles[role] || styles.student;
    const label = role === 'institute_manager' ? 'Institute Mgr' : role;
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={s}>
        {label}
      </span>
    );
  };

  if (loading) return (
    <div style={{ minHeight: '100vh' }} className="flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#6C63FF] border-t-transparent animate-spin" />
        <p style={{ color: subColor }}>Loading accounts…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', ...pageBg }}>
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" asChild style={{ color: headingColor }}>
            <Link to="/admin/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold" style={{ color: headingColor }}>Manage Accounts</h1>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => {
            const count = users.filter(u => t.roles.includes((u.role || '').toLowerCase())).length;
            return (
              <button key={t.id} onClick={() => { setActiveTab(t.id); setSearchQuery(''); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                  activeTab === t.id
                    ? 'bg-[#6C63FF] text-white border-[#6C63FF] shadow-lg shadow-purple-900/30'
                    : isDark
                      ? 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                      : 'bg-[#eeebf5] text-[#555292] border-[#a8a4c6] hover:bg-[#e4e0ed]'
                }`}>
                {t.icon}
                {t.label}
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === t.id ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-[#d4d0e8]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table Card */}
        <div style={cardStyle} className="overflow-hidden">
          {/* Card header + search */}
          <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
            style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #b8b4d0' }}>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: headingColor }}>
                {activeTabDef.label} ({filtered.length})
              </h2>
              <p className="text-sm mt-0.5" style={{ color: subColor }}>
                {activeTab === 'admins' ? 'Admin accounts cannot be deleted (permanent admin protected).' : 'View or delete accounts.'}
              </p>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: subColor }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTabDef.label.toLowerCase()}…`}
                className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all w-56"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#e4e0ed',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #a8a4c6',
                  color: cellTxt,
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={tableHeadBg}>
                <tr>
                  {['Name', 'Email', 'Joined', 'Actions'].map((h, i) => (
                    <th key={h}
                      className={`px-4 py-3 text-left font-semibold ${i === 3 ? 'text-right' : ''}`}
                      style={{ color: tableHeadTxt }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr key={u.id}
                    style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #c8c4e0', background: idx % 2 === 0 ? 'transparent' : rowHover }}>
                    <td className="px-4 py-3 font-medium" style={{ color: cellTxt }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: activeTab === 'admins' ? '#EF4444' : activeTab === 'tutors' ? '#6C63FF' : activeTab === 'institutes' ? '#F59E0B' : '#10B981' }}>
                          {(u.name || '?')[0]?.toUpperCase()}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: subColor }}>{u.email}</td>
                    <td className="px-4 py-3" style={{ color: subColor }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button title="View details" onClick={() => setViewModal(u)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[#6C63FF]/10"
                          style={{ color: '#6C63FF' }}>
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          title={isProtected(u) ? 'Cannot delete permanent admin' : 'Delete user'}
                          disabled={isProtected(u)}
                          onClick={() => setDeleteModal(u)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ color: '#EF4444' }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12" style={{ color: subColor }}>
                      {searchQuery ? `No ${activeTabDef.label.toLowerCase()} match "${searchQuery}"` : `No ${activeTabDef.label.toLowerCase()} yet`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── View User Modal ── */}
        <Dialog open={!!viewModal} onOpenChange={() => setViewModal(null)}>
          <DialogContent className="shadow-2xl backdrop-blur-2xl max-w-md" style={dialogBg}>
            <DialogHeader>
              <DialogTitle style={{ color: dialogTxt }}>User Details</DialogTitle>
              <DialogDescription style={{ color: dialogSub }}>Full account information</DialogDescription>
            </DialogHeader>
            {viewModal && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#e4e0ed' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)' }}>
                    {(viewModal.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-lg" style={{ color: dialogTxt }}>{viewModal.name}</p>
                    {roleBadge(viewModal.role)}
                  </div>
                </div>
                {[
                  { icon: Mail, label: 'Email', value: viewModal.email },
                  { icon: Phone, label: 'Contact', value: viewModal.contactNumber || viewModal.contact || '—' },
                  { icon: Calendar, label: 'Joined', value: viewModal.createdAt ? new Date(viewModal.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                  { icon: Shield, label: 'User ID', value: viewModal.id || '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: isDark ? 'rgba(108,99,255,0.15)' : '#ddd9f0' }}>
                      <Icon className="w-4 h-4" style={{ color: '#6C63FF' }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-0.5" style={{ color: dialogSub }}>{label}</p>
                      <p className="text-sm font-medium break-all" style={{ color: dialogTxt }}>{value}</p>
                    </div>
                  </div>
                ))}
                {viewModal.grade && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isDark ? 'rgba(108,99,255,0.15)' : '#ddd9f0' }}>
                      <GraduationCap className="w-4 h-4" style={{ color: '#6C63FF' }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-0.5" style={{ color: dialogSub }}>Grade</p>
                      <p className="text-sm font-medium" style={{ color: dialogTxt }}>{viewModal.grade}</p>
                    </div>
                  </div>
                )}
                {viewModal.parentName && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isDark ? 'rgba(108,99,255,0.15)' : '#ddd9f0' }}>
                      <Shield className="w-4 h-4" style={{ color: '#6C63FF' }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-0.5" style={{ color: dialogSub }}>Parent / Guardian</p>
                      <p className="text-sm font-medium" style={{ color: dialogTxt }}>{viewModal.parentName}</p>
                    </div>
                  </div>
                )}
                {viewModal.role === 'institute_manager' && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isDark ? 'rgba(245,158,11,0.15)' : '#fdf6e3' }}>
                        <Building2 className="w-4 h-4" style={{ color: '#F59E0B' }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: dialogSub }}>Institute Name</p>
                        <p className="text-sm font-medium" style={{ color: dialogTxt }}>{viewModal.instituteName || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isDark ? 'rgba(245,158,11,0.15)' : '#fdf6e3' }}>
                        <BookOpen className="w-4 h-4" style={{ color: '#F59E0B' }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: dialogSub }}>Registration No.</p>
                        <p className="text-sm font-medium" style={{ color: dialogTxt }}>{viewModal.instituteRegistrationNo || '—'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewModal(null)} style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)', color: '#fff', border: 'none' }}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete Modal ── */}
        <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
          <DialogContent className="shadow-2xl backdrop-blur-2xl" style={dialogBg}>
            <DialogHeader>
              <DialogTitle style={{ color: '#EF4444' }}>Delete User?</DialogTitle>
              <DialogDescription style={{ color: dialogSub }}>
                This will permanently remove <strong style={{ color: dialogTxt }}>{deleteModal?.name}</strong> ({deleteModal?.email}). This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModal(null)} style={{ color: dialogTxt, borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#a8a4c6' }}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
