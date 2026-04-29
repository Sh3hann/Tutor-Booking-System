import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import {
  Building2, Users, MapPin, Clock, Settings, LogOut, GraduationCap,
  CheckCircle, XCircle, Edit3, Save, X, Loader2, Image as ImageIcon,
  Phone, FileText, Hash, ChevronRight, AlertCircle, User,
} from 'lucide-react';

/* ── API helper ── */
function getBase() {
  const h = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${h}:3001/api`;
}
async function apiCall(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const res = await fetch(`${getBase()}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers as any) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

/* ── Types ── */
interface Institute {
  id: string; name: string; description: string;
  location: string; timetable: string; photo: string; banner?: string;
  registrationNo?: string; managerId: string; managerName?: string;
  createdAt: string; updatedAt: string;
}
interface JoinRequest {
  id: string; tutorId: string; tutorName: string; tutorEmail: string;
  status: string; createdAt: string;
}
interface Tutor {
  id: string; fullName?: string; name?: string; email?: string; photo?: string; photoUrl?: string;
  instituteTimetable?: string;
}

/* ── Section Header ── */
function SectionHeader({ title, subtitle, icon: Icon, color }: { title: string; subtitle?: string; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'inherit' }}>{title}</h2>
        {subtitle && <p className="text-sm opacity-60">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export function InstituteDashboard() {
  const navigate      = useNavigate();
  const { logout }    = useChatAuth();
  const { isDark, toggleTheme } = useTheme();

  const [institute,    setInstitute]    = useState<Institute | null>(null);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [tutors,       setTutors]       = useState<Tutor[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState<'overview' | 'tutors' | 'requests' | 'settings'>('overview');
  const [saving,       setSaving]       = useState(false);

  /* settings edit state */
  const [edit,  setEdit]  = useState(false);
  const [form,  setForm]  = useState({ name: '', description: '', location: '', timetable: '', photo: '', banner: '' });
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  /* tutor timetable modal state */
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [tutorTimetable, setTutorTimetable] = useState('');
  const [savingTimetable, setSavingTimetable] = useState(false);

  const stored = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  const user   = stored;

  /* ── Load data ── */
  useEffect(() => {
    if (user?.role !== 'institute_manager') {
      navigate('/institute/login', { replace: true });
      return;
    }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/institutes/my-institute');
      setInstitute(data.institute);
      setJoinRequests(data.joinRequests || []);
      setForm({
        name:        data.institute.name || '',
        description: data.institute.description || '',
        location:    data.institute.location || '',
        timetable:   data.institute.timetable || '',
        photo:       data.institute.photo || '',
        banner:      data.institute.banner || '',
      });

      // Load tutors who are linked to this institute
      const tRes = await apiCall(`/institutes/${data.institute.id}`).catch(() => ({}));
      setTutors(tRes.tutors || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load institute');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, photo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Banner must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, banner: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async () => {
    if (!institute) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const res = await fetch(`${getBase()}/institutes/${institute.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setInstitute(data.institute);
      setEdit(false);
      toast.success('Institute details saved!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    } finally { setSaving(false); }
  };

  const handleApproveJoin = async (reqId: string) => {
    if (!institute) return;
    try {
      await apiCall(`/institutes/join-requests/${reqId}/approve`, { method: 'POST' });
      toast.success('Tutor approved!');
      load();
    } catch (e: any) { toast.error(e.message || 'Failed to approve'); }
  };

  const handleRejectJoin = async (reqId: string) => {
    if (!institute) return;
    try {
      await apiCall(`/institutes/join-requests/${reqId}/reject`, { method: 'POST' });
      toast.success('Request rejected.');
      load();
    } catch (e: any) { toast.error(e.message || 'Failed to reject'); }
  };

  const handleLogout = () => { logout(); navigate('/institute/login'); };

  const handleSaveTutorTimetable = async () => {
    if (!institute || !selectedTutor) return;
    setSavingTimetable(true);
    try {
      const { instituteAPI } = await import('../utils/api');
      await instituteAPI.updateTutorTimetable(institute.id, selectedTutor.id, tutorTimetable);
      toast.success('Tutor timetable updated');
      
      // Update local state
      setTutors(tutors.map(t => t.id === selectedTutor.id ? { ...t, instituteTimetable: tutorTimetable } : t));
      setSelectedTutor(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update timetable');
    } finally {
      setSavingTimetable(false);
    }
  };

  /* ── Theme tokens ── */
  const bg       = isDark ? '#000'            : '#F2F2F7';
  const surface  = isDark ? '#1C1C1E'         : '#FFFFFF';
  const border   = isDark ? 'rgba(84,84,88,0.4)' : 'rgba(60,60,67,0.18)';
  const headCol  = isDark ? '#FFFFFF'         : '#1C1C1E';
  const secondary= isDark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const blue     = isDark ? '#0A84FF'         : '#007AFF';
  const green    = isDark ? '#30D158'         : '#34C759';
  const orange   = isDark ? '#FF9F0A'         : '#FF9500';
  const red      = isDark ? '#FF453A'         : '#FF3B30';
  const inputBg  = isDark ? 'rgba(44,44,46,0.8)' : '#FFFFFF';

  const card = { background: surface, border: `1px solid ${border}`, borderRadius: '1rem', padding: '1.5rem' };
  const inputSt: React.CSSProperties = { width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.75rem', background: inputBg, border: `1px solid ${border}`, color: headCol, fontSize: '0.9rem', outline: 'none' };
  const fi = (e: any) => { e.target.style.borderColor = blue; e.target.style.boxShadow = `0 0 0 3px ${blue}18`; };
  const fo = (e: any) => { e.target.style.borderColor = border; e.target.style.boxShadow = 'none'; };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${blue}30`, borderTopColor: blue }} />
        <p style={{ color: secondary }}>Loading your institute…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: bg, color: headCol, fontFamily: "-apple-system, 'SF Pro Display', 'Inter', sans-serif" }}>

      {/* ══ NAVBAR ══ */}
      <header style={{ background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(242,242,247,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${border}`, position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: blue }}>
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: headCol }}>TutorHub</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${blue}18`, color: blue }}>Institute Manager</span>
          </div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {([['overview','Overview'],['tutors','Tutors'],['requests','Join Requests'],['settings','Settings']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                style={tab === key
                  ? { background: blue, color: '#fff' }
                  : { color: secondary, background: 'transparent' }}>
                {label}
                {key === 'requests' && joinRequests.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full font-bold" style={{ background: orange, color: '#fff' }}>
                    {joinRequests.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition-all"
              style={{ color: red, background: `${red}10`, border: `1px solid ${red}20` }}>
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">

        {/* ══ OVERVIEW TAB ══ */}
        {tab === 'overview' && institute && (
          <>
            {/* Hero */}
            <div className="relative rounded-3xl overflow-hidden mb-8 p-8" style={{ background: `linear-gradient(135deg,${blue}25,${blue}10)`, border: `1px solid ${blue}25` }}>
              <div className="absolute top-0 right-0 pointer-events-none w-64 h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle,${blue},transparent 70%)`, filter: 'blur(50px)', transform: 'translate(30%,-30%)' }} />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Institute photo */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2" style={{ borderColor: `${blue}40` }}>
                  {institute.photo
                    ? <img src={institute.photo} alt={institute.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center" style={{ background: `${blue}20` }}><Building2 className="w-10 h-10" style={{ color: blue }} /></div>}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold mb-1" style={{ color: blue }}>🏫 Your Institute</div>
                  <h1 className="text-3xl font-extrabold mb-1" style={{ color: headCol }}>{institute.name}</h1>
                  {institute.location && <div className="flex items-center gap-1.5 text-sm" style={{ color: secondary }}><MapPin className="w-4 h-4" />{institute.location}</div>}
                  {institute.registrationNo && <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: secondary }}><Hash className="w-3.5 h-3.5" />Reg: {institute.registrationNo}</div>}
                </div>
                <button onClick={() => setTab('settings')} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-white"
                  style={{ background: blue, boxShadow: `0 4px 16px ${blue}44` }}>
                  <Settings className="w-4 h-4" /> Edit Details
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Tutors',         value: tutors.length,       icon: Users,    color: blue },
                { label: 'Join Requests',  value: joinRequests.length, icon: AlertCircle, color: orange },
                { label: 'Status',         value: 'Active',            icon: CheckCircle, color: green },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} style={{ ...card }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${color}18` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold" style={{ color: headCol }}>{value}</p>
                      <p className="text-xs" style={{ color: secondary }}>{label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Info */}
            <div className="grid md:grid-cols-2 gap-5">
              <div style={card}>
                <SectionHeader title="Institute Details" icon={Building2} color={blue} />
                <div className="space-y-3">
                  {[
                    { label: 'Description', value: institute.description || 'No description yet', icon: FileText },
                    { label: 'Location',    value: institute.location    || 'Not set',             icon: MapPin  },
                    { label: 'Timetable',   value: institute.timetable   || 'Not set',             icon: Clock   },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label}>
                      <div className="flex items-center gap-2 text-xs font-semibold mb-1" style={{ color: secondary }}>
                        <Icon className="w-3.5 h-3.5" />{label}
                      </div>
                      <p className="text-sm" style={{ color: headCol, whiteSpace: 'pre-wrap' }}>{value}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setTab('settings')} className="mt-4 flex items-center gap-2 text-sm font-semibold" style={{ color: blue, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Edit Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div style={card}>
                <SectionHeader title="Recent Join Requests" icon={Users} color={orange} />
                {joinRequests.length === 0 ? (
                  <div className="text-center py-6" style={{ color: secondary }}>
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No pending join requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {joinRequests.slice(0, 3).map(r => (
                      <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: headCol }}>{r.tutorName || 'Tutor'}</p>
                          <p className="text-xs" style={{ color: secondary }}>{r.tutorEmail || ''}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveJoin(r.id)} className="p-1.5 rounded-xl" style={{ background: `${green}18`, color: green }}><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => handleRejectJoin(r.id)}  className="p-1.5 rounded-xl" style={{ background: `${red}18`,   color: red   }}><XCircle   className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                    {joinRequests.length > 3 && (
                      <button onClick={() => setTab('requests')} className="text-sm font-semibold" style={{ color: blue, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        View all {joinRequests.length} requests →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ══ TUTORS TAB ══ */}
        {tab === 'tutors' && (
          <div style={card}>
            <SectionHeader title="Institute Tutors" subtitle="Tutors approved to teach at your institute" icon={Users} color={blue} />
            {tutors.length === 0 ? (
              <div className="text-center py-16" style={{ color: secondary }}>
                <GraduationCap className="w-14 h-14 mx-auto mb-4 opacity-25" />
                <p className="text-lg font-semibold mb-1" style={{ color: headCol }}>No tutors yet</p>
                <p className="text-sm">Approve join requests to add tutors to your institute roster.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tutors.map(t => (
                  <div key={t.id} 
                    className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer hover:-translate-y-0.5 transition-all" 
                    style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', border: `1px solid ${border}` }}
                    onClick={() => { setSelectedTutor(t); setTutorTimetable(t.instituteTimetable || ''); }}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ background: `${blue}20` }}>
                      {t.photoUrl || t.photo
                        ? <img src={t.photoUrl || t.photo} alt={t.fullName} className="w-full h-full object-cover" style={{ borderRadius: '50%' }} />
                        : <div className="w-full h-full flex items-center justify-center font-bold" style={{ color: blue }}>{(t.fullName || t.name || 'T')[0]}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: headCol }}>{t.fullName || t.name || 'Tutor'}</p>
                      <p className="text-xs truncate" style={{ color: secondary }}>{t.email || ''}</p>
                    </div>
                    <button className="flex-none w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: `${blue}15`, color: blue }}>
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TUTOR TIMETABLE MODAL ── */}
        {selectedTutor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}>
            <div className="rounded-3xl w-full max-w-md p-6 shadow-2xl relative" style={{ background: surface, border: `1px solid ${border}` }}>
              <button onClick={() => setSelectedTutor(null)} className="absolute top-4 right-4 p-2 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: headCol }}>
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${blue}15` }}>
                  <Clock className="w-6 h-6" style={{ color: blue }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: headCol }}>Tutor Timetable</h3>
                  <p className="text-xs" style={{ color: secondary }}>{selectedTutor.fullName || selectedTutor.name}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: secondary }}>
                  Institute Schedule for this Tutor
                </label>
                <textarea
                  value={tutorTimetable}
                  onChange={(e) => setTutorTimetable(e.target.value)}
                  placeholder={'E.g.\nMonday: 4:00 PM - 6:00 PM\nWednesday: 5:00 PM - 7:00 PM'}
                  rows={5}
                  style={{ ...inputSt, resize: 'none', lineHeight: 1.6, fontFamily: 'monospace' }}
                  onFocus={fi}
                  onBlur={fo}
                />
              </div>

              <button 
                onClick={handleSaveTutorTimetable} 
                disabled={savingTimetable}
                className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: blue, opacity: savingTimetable ? 0.7 : 1 }}
              >
                {savingTimetable ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingTimetable ? 'Saving...' : 'Save Timetable'}
              </button>
            </div>
          </div>
        )}

        {/* ══ REQUESTS TAB ══ */}
        {tab === 'requests' && (
          <div style={card}>
            <SectionHeader title="Tutor Join Requests" subtitle="Tutors requesting to be listed at your institute" icon={Users} color={orange} />
            {joinRequests.length === 0 ? (
              <div className="text-center py-16" style={{ color: secondary }}>
                <CheckCircle className="w-14 h-14 mx-auto mb-4 opacity-25" />
                <p className="text-lg font-semibold mb-1" style={{ color: headCol }}>All clear!</p>
                <p className="text-sm">No pending join requests at this time.</p>
              </div>
            ) : joinRequests.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl mb-3" style={{ background: `${orange}09`, border: `1px solid ${orange}20` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: `${blue}18`, color: blue }}>
                    {(r.tutorName || 'T')[0]}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: headCol }}>{r.tutorName || 'Tutor'}</p>
                    <p className="text-sm" style={{ color: secondary }}>{r.tutorEmail || ''}</p>
                    <p className="text-xs" style={{ color: secondary }}>Requested {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveJoin(r.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: green, color: '#fff' }}>
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleRejectJoin(r.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: `${red}15`, color: red, border: `1px solid ${red}25` }}>
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ SETTINGS TAB ══ */}
        {tab === 'settings' && institute && (
          <div style={card}>
            <div className="flex items-center justify-between mb-6">
              <SectionHeader title="Institute Settings" subtitle="Edit your institute's public profile" icon={Settings} color={blue} />
              {!edit
                ? <button onClick={() => setEdit(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm" style={{ background: blue, color: '#fff' }}><Edit3 className="w-4 h-4" /> Edit</button>
                : <div className="flex gap-2">
                    <button onClick={() => setEdit(false)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm" style={{ background: `${red}10`, color: red, border: `1px solid ${red}20` }}><X className="w-4 h-4" /> Cancel</button>
                    <button onClick={handleSaveSettings} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm" style={{ background: green, color: '#fff', opacity: saving ? 0.7 : 1 }}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>}
            </div>

            <div className="space-y-5 max-w-lg">
              {/* Photo & Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: secondary }}>Institute Photo (Logo)</label>
                  <div className="flex flex-col gap-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 flex-shrink-0" style={{ borderColor: `${blue}30` }}>
                      {form.photo
                        ? <img src={form.photo} alt="preview" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center" style={{ background: `${blue}12` }}><Building2 className="w-8 h-8" style={{ color: blue }} /></div>}
                    </div>
                    {edit && (
                      <div>
                        <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium w-full" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : '#F2F2F7', color: headCol, border: `1px solid ${border}` }}>
                          <ImageIcon className="w-4 h-4" /> Change Logo
                        </button>
                        <p className="text-xs mt-1.5 text-center" style={{ color: secondary }}>JPG/PNG - Max 5MB</p>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: secondary }}>Cover Banner</label>
                  <div className="flex flex-col gap-4">
                    <div className="w-full h-24 rounded-2xl overflow-hidden border-2 flex-shrink-0" style={{ borderColor: `${blue}30` }}>
                      {form.banner
                        ? <img src={form.banner} alt="banner preview" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center" style={{ background: `${blue}12` }}><ImageIcon className="w-8 h-8 opacity-50" style={{ color: blue }} /></div>}
                    </div>
                    {edit && (
                      <div>
                        <button onClick={() => bannerRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium w-full" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : '#F2F2F7', color: headCol, border: `1px solid ${border}` }}>
                          <ImageIcon className="w-4 h-4" /> Change Banner
                        </button>
                        <p className="text-xs mt-1.5 text-center" style={{ color: secondary }}>Horizontal Img - Max 5MB</p>
                        <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: secondary }}>Institute Name *</label>
                {edit
                  ? <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputSt} onFocus={fi} onBlur={fo} />
                  : <p style={{ color: headCol, fontWeight: 600 }}>{institute.name}</p>}
              </div>

              {/* Registration No */}
              {institute.registrationNo && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: secondary }}>Registration Number</label>
                  <p style={{ color: headCol }}>{institute.registrationNo}</p>
                  <p className="text-xs mt-0.5" style={{ color: secondary }}>Contact admin to update the registration number.</p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: secondary }}>Description</label>
                {edit
                  ? <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} style={{ ...inputSt, resize: 'none', lineHeight: 1.6 }} onFocus={fi} onBlur={fo} />
                  : <p style={{ color: headCol, whiteSpace: 'pre-wrap' }}>{institute.description || <span style={{ color: secondary }}>Not set</span>}</p>}
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: secondary }}><MapPin className="w-3 h-3 inline mr-1" />Location</label>
                {edit
                  ? <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. 42 Colombo Road, Gampaha" style={inputSt} onFocus={fi} onBlur={fo} />
                  : <p style={{ color: headCol }}>{institute.location || <span style={{ color: secondary }}>Not set</span>}</p>}
              </div>

              {/* Timetable */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: secondary }}><Clock className="w-3 h-3 inline mr-1" />Timetable</label>
                {edit
                  ? <textarea value={form.timetable} onChange={e => setForm(f => ({ ...f, timetable: e.target.value }))} rows={4} placeholder={'Mon–Fri: 8:00 AM – 5:00 PM\nSat: 8:00 AM – 2:00 PM\nSun: Closed'} style={{ ...inputSt, resize: 'none', lineHeight: 1.6, fontFamily: 'monospace', fontSize: '0.875rem' }} onFocus={fi} onBlur={fo} />
                  : <pre style={{ color: headCol, fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', margin: 0 }}>{institute.timetable || <span style={{ color: secondary, fontFamily: 'inherit' }}>Not set</span>}</pre>}
              </div>

              {/* Public link */}
              <div className="pt-2">
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: secondary }}>Public Institute Page</label>
                <Link to={`/institute/${institute.id}`} className="text-sm font-semibold flex items-center gap-1.5" style={{ color: blue }}>
                  View public page →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Mobile tab bar */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden flex items-center justify-around px-4 py-2 border-t" style={{ background: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', borderColor: border }}>
          {([['overview','Overview',Building2],['tutors','Tutors',Users],['requests','Requests',AlertCircle],['settings','Settings',Settings]] as any[]).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
              style={{ color: tab === key ? blue : secondary }}>
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
              {key === 'requests' && joinRequests.length > 0 && tab !== 'requests' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-xs rounded-full font-bold flex items-center justify-center" style={{ background: orange, color: '#fff' }}>
                  {joinRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
