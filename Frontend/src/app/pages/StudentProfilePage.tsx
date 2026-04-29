import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Save, User, Phone, GraduationCap, Users, LoaderCircle } from 'lucide-react';

const GRADES = [
  'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
  'Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12',
  'O/L','A/L','Diploma','Degree','Other'
];

function getNodeApiBase() {
  const host = window.location.hostname || 'localhost';
  return `http://${host}:3001/api`;
}

const PRIMARY = '#6C63FF';
const GRAD = `linear-gradient(135deg, ${PRIMARY}, #3B82F6)`;

export function StudentProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useChatAuth();
  const { isDark } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: '',
    contactNumber: '',
    grade: '',
    age: '',
    parentName: '',
    parentContact: '',
    photoUrl: '',
  });
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/student/login'); return; }
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    fetch(`${getNodeApiBase()}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const p = data.user || {};
        setForm({
          fullName: p.fullName || user.fullName || '',
          contactNumber: p.contactNumber || (user as any).contactNumber || '',
          grade: p.grade || (user as any).grade || '',
          age: p.age?.toString() || (user as any).age?.toString() || '',
          parentName: p.parentName || (user as any).parentName || '',
          parentContact: p.parentContact || (user as any).parentContact || '',
          photoUrl: p.photoUrl || (user as any).photoUrl || '',
        });
        setPreview(p.photoUrl || (user as any).photoUrl || '');
      })
      .catch(() => {
        setForm({
          fullName: user.fullName || '',
          contactNumber: (user as any).contactNumber || '',
          grade: (user as any).grade || '',
          age: (user as any).age?.toString() || '',
          parentName: (user as any).parentName || '',
          parentContact: (user as any).parentContact || '',
          photoUrl: (user as any).photoUrl || '',
        });
        setPreview((user as any).photoUrl || '');
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 400;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.75);
      setPreview(compressed);
      setForm(f => ({ ...f, photoUrl: compressed }));
    };
    img.src = objectUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const res = await fetch(`${getNodeApiBase()}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      toast.success('Profile updated! ✅');
      updateUser(data.user);
      setTimeout(() => navigate('/student/dashboard'), 600);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // ── Theme-aware styles ──────────────────────────────
  const pageBg      = 'transparent';
  const headerBg    = isDark ? 'rgba(6,4,15,0.9)' : 'rgba(240,238,255,0.95)';
  const headerBdr   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.18)';
  const headColor   = isDark ? '#ffffff' : '#0f0e1a';
  const subColor    = isDark ? 'rgba(255,255,255,0.5)' : '#555292';
  const cardBg      = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.82)';
  const cardBdr     = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.18)';
  const labelColor  = isDark ? 'rgba(255,255,255,0.5)' : '#4a4770';
  const inputBg     = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)';
  const inputBdr    = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(108,99,255,0.25)';
  const inputColor  = isDark ? '#ffffff' : '#0f0e1a';
  const backBtnBg   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.82)';
  const selectBg    = isDark ? 'rgba(20,15,35,0.95)' : '#ffffff';
  const selectColor = isDark ? 'white' : '#0f0e1a';

  const inputStyle  = { background: inputBg, border: `1px solid ${inputBdr}`, color: inputColor };
  const inputCls    = 'w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#6C63FF]/50 transition-all';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: pageBg }}>
      <LoaderCircle className="w-8 h-8 text-[#6C63FF] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pb-16" style={{ background: pageBg, color: headColor }}>
      {/* Header */}
      <header className="sticky top-0 z-40"
        style={{ background: headerBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${headerBdr}` }}>
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/student/dashboard')}
            className="p-2 rounded-xl hover:scale-110 transition-transform"
            style={{ background: backBtnBg }}>
            <ArrowLeft className="w-5 h-5" style={{ color: headColor }} />
          </button>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#6C63FF]" />
            <h1 className="font-bold text-lg" style={{ color: headColor }}>My Profile</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-28 h-28 rounded-3xl overflow-hidden flex items-center justify-center text-4xl font-bold text-white"
              style={{ background: preview ? 'transparent' : GRAD, boxShadow: '0 8px 32px rgba(108,99,255,0.4)' }}>
              {preview ? <img src={preview} alt="Profile" className="w-full h-full object-cover" /> : (form.fullName[0] || 'S')}
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              <Camera className="w-7 h-7 text-white" />
            </button>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: GRAD, boxShadow: '0 4px 12px rgba(108,99,255,0.4)' }}
              onClick={() => fileRef.current?.click()}>
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoUpload} />
          <p className="mt-4 text-sm" style={{ color: subColor }}>Tap to change profile photo</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* Personal */}
          <section className="rounded-3xl p-6 space-y-4"
            style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
            <h2 className="font-bold text-base flex items-center gap-2 mb-1" style={{ color: headColor }}>
              <User className="w-4 h-4 text-[#6C63FF]" /> Personal Information
            </h2>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide" style={{ color: labelColor }}>Full Name *</label>
              <input required value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                placeholder="Your full name"
                className={inputCls}
                style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide" style={{ color: labelColor }}>Age</label>
                <input type="number" min="3" max="60" value={form.age}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                  placeholder="e.g. 15"
                  className={inputCls}
                  style={{ ...inputStyle, colorScheme: isDark ? 'dark' : 'light' }} />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide" style={{ color: labelColor }}>Grade / Year</label>
                <select value={form.grade}
                  onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                  className={inputCls}
                  style={{ background: selectBg, border: `1px solid ${inputBdr}`, color: selectColor, colorScheme: isDark ? 'dark' : 'light' }}>
                  <option value="" style={{ background: selectBg, color: selectColor }}>Select grade</option>
                  {GRADES.map(g => <option key={g} value={g} style={{ background: selectBg, color: selectColor }}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide flex items-center gap-1" style={{ color: labelColor }}>
                <Phone className="w-3 h-3" /> Contact Number
              </label>
              <input type="tel" value={form.contactNumber}
                onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))}
                placeholder="+94 77 123 4567"
                className={inputCls}
                style={inputStyle} />
            </div>
          </section>

          {/* Parent / Guardian */}
          <section className="rounded-3xl p-6 space-y-4"
            style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
            <h2 className="font-bold text-base flex items-center gap-2 mb-1" style={{ color: headColor }}>
              <Users className="w-4 h-4 text-[#6C63FF]" /> Parent / Guardian Details
            </h2>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide" style={{ color: labelColor }}>Parent / Guardian Name</label>
              <input value={form.parentName}
                onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))}
                placeholder="Full name of parent or guardian"
                className={inputCls}
                style={inputStyle} />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide" style={{ color: labelColor }}>Parent Contact Number</label>
              <input type="tel" value={form.parentContact}
                onChange={e => setForm(f => ({ ...f, parentContact: e.target.value }))}
                placeholder="+94 71 987 6543"
                className={inputCls}
                style={inputStyle} />
            </div>
          </section>

          {/* Academics note */}
          <p className="text-xs text-center flex items-center justify-center gap-1" style={{ color: subColor }}>
            <GraduationCap className="w-3.5 h-3.5" /> Subject preferences are managed during registration
          </p>

          <button type="submit" disabled={saving}
            className="w-full py-4 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: GRAD, boxShadow: '0 8px 24px rgba(108,99,255,0.4)' }}>
            {saving ? <><LoaderCircle className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
