import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { instituteAPI } from '../utils/api';
import { getStoredUser } from '../utils/authService';
import { toast } from 'sonner';
import {
  ArrowLeft, Building2, MapPin, Clock, Image, Save, Loader2,
  Shield, Trash2, AlertTriangle, X, Settings, CheckCircle,
} from 'lucide-react';

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
function DeleteDialog({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
      <div className="bg-[#0e0b20] border border-red-500/25 rounded-3xl w-full max-w-md p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Delete Institute?</h2>
        <p className="text-white/50 mb-6">
          This will permanently delete <strong className="text-white">{name}</strong> and unlink all tutors. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl font-semibold border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 8px 24px rgba(239,68,68,0.3)' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export function InstituteSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saved, setSaved] = useState(false);
  const [institute, setInstitute] = useState<any>(null);
  const [isManager, setIsManager] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    timetable: '',
    photo: '',
    banner: '',
  });

  const bannerRef = useRef<HTMLInputElement>(null);

  const storedUser = getStoredUser();
  const currentUserId = storedUser?.id;
  const isAdmin = storedUser?.role === 'admin';

  useEffect(() => {
    if (!id) return;
    loadInstitute();
  }, [id]);

  const loadInstitute = async () => {
    setLoading(true);
    try {
      const res = await instituteAPI.getWithManagerFlag(id!);
      setInstitute(res.institute);
      // Only the actual creator/manager can edit — admin role alone is NOT enough
      setIsManager(res.isManager === true);
      setForm({
        name: res.institute.name || '',
        description: res.institute.description || '',
        location: res.institute.location || '',
        timetable: res.institute.timetable || '',
        photo: res.institute.photo || '',
        banner: res.institute.banner || '',
      });
    } catch {
      toast.error('Failed to load institute');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, photo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Banner must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, banner: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await instituteAPI.updateSettings(id!, form);
      toast.success('Settings saved!');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await instituteAPI.deleteOwn(id!);
      toast.success('Institute deleted');
      navigate('/institutes');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
      setDeleting(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#06040f] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ─── Access denied ─────────────────────────────────────────────────────────
  if (!isManager) return (
    <div className="min-h-screen bg-[#06040f] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Shield className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-white/50 mb-6">Only the institute manager can access settings.</p>
        <button onClick={() => navigate(`/institute/${id}`)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)' }}>
          View Institute Page
        </button>
      </div>
    </div>
  );

  // ─── Settings UI ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#06040f] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 border-b border-white/8"
        style={{ background: 'rgba(6,4,15,0.92)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
            <div className="h-5 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#6C63FF]" />
              <span className="font-semibold text-white/70 text-sm">Institute Settings</span>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-white text-sm disabled:opacity-60 transition-all hover:-translate-y-0.5"
            style={{ background: saved ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#6C63FF,#3B82F6)', boxShadow: '0 6px 20px rgba(108,99,255,0.3)' }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : saved ? <><CheckCircle className="w-4 h-4" /> Saved!</>
              : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/10"
            style={{ background: 'rgba(108,99,255,0.15)' }}>
            {form.photo
              ? <img src={form.photo} alt={form.name} className="w-full h-full object-cover" />
              : <Building2 className="w-7 h-7 text-[#6C63FF]" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{institute?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Shield className="w-3.5 h-3.5 text-[#6C63FF]" />
              <span className="text-xs text-white/40">
                You are the Institute Manager
              </span>
            </div>
          </div>
        </div>

        {/* ── Photo & Banner Section ── */}
        <div className="rounded-3xl border border-white/8 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="px-6 py-4 border-b border-white/8">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Image className="w-4 h-4 text-[#6C63FF]" /> Institute Branding
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Logo */}
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-3">
                Institute Logo (Square)
              </label>
              {form.photo ? (
                <div className="relative rounded-2xl overflow-hidden mb-4 h-40 border border-white/8 w-40">
                  <img src={form.photo} alt="preview" className="w-full h-full object-cover" />
                  <button onClick={() => setForm(f => ({ ...f, photo: '' }))}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-white/70 hover:text-white transition-colors"
                    title="Remove photo">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="h-40 w-40 rounded-2xl border border-dashed border-white/15 flex items-center justify-center mb-4"
                  style={{ background: 'rgba(108,99,255,0.04)' }}>
                  <div className="text-center">
                    <Building2 className="w-8 h-8 text-white/15 mx-auto mb-2" />
                    <p className="text-white/30 text-xs">No logo</p>
                  </div>
                </div>
              )}
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium w-fit">
                <Image className="w-4 h-4" /> {form.photo ? 'Change Logo' : 'Upload Logo'}
              </button>
              <p className="text-xs text-white/25 mt-2">JPG, PNG — max 5MB</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>

            {/* Banner */}
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-3">
                Cover Banner (Horizontal)
              </label>
              {form.banner ? (
                <div className="relative rounded-2xl overflow-hidden mb-4 h-40 border border-white/8 w-full">
                  <img src={form.banner} alt="banner preview" className="w-full h-full object-cover" />
                  <button onClick={() => setForm(f => ({ ...f, banner: '' }))}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-white/70 hover:text-white transition-colors"
                    title="Remove banner">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="h-40 w-full rounded-2xl border border-dashed border-white/15 flex items-center justify-center mb-4"
                  style={{ background: 'rgba(108,99,255,0.04)' }}>
                  <div className="text-center">
                    <Image className="w-8 h-8 text-white/15 mx-auto mb-2" />
                    <p className="text-white/30 text-xs">No banner</p>
                  </div>
                </div>
              )}
              <button onClick={() => bannerRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium w-fit">
                <Image className="w-4 h-4" /> {form.banner ? 'Change Banner' : 'Upload Banner'}
              </button>
              <p className="text-xs text-white/25 mt-2">JPG, PNG — max 5MB</p>
              <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
            </div>
          </div>
        </div>

        {/* ── Basic Info ── */}
        <div className="rounded-3xl border border-white/8 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="px-6 py-4 border-b border-white/8">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#6C63FF]" /> Basic Information
            </h2>
          </div>
          <div className="p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                Institute Name *
              </label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Royal Educational Institute"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 outline-none focus:border-[#6C63FF] transition-colors" />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4} placeholder="About this institute..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 outline-none focus:border-[#6C63FF] transition-colors resize-none" />
            </div>
          </div>
        </div>

        {/* ── Location & Timetable ── */}
        <div className="rounded-3xl border border-white/8 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="px-6 py-4 border-b border-white/8">
            <h2 className="font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#6C63FF]" /> Location & Schedule
            </h2>
          </div>
          <div className="p-6 space-y-5">
            {/* Location */}
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-[#6C63FF]" /> Location
              </label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. 42 Colombo Road, Gampaha"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 outline-none focus:border-[#6C63FF] transition-colors" />
            </div>

            {/* Timetable */}
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1 text-[#6C63FF]" /> Timetable
              </label>
              <textarea value={form.timetable} onChange={e => setForm(f => ({ ...f, timetable: e.target.value }))}
                rows={5} placeholder={"Mon–Fri: 8:00 AM – 5:00 PM\nSat: 8:00 AM – 2:00 PM\nSun: Closed"}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 outline-none focus:border-[#6C63FF] transition-colors resize-none font-mono text-sm" />
              <p className="text-xs text-white/25 mt-1.5">One entry per line</p>
            </div>
          </div>
        </div>

        {/* ── Save button (bottom) ── */}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-3 disabled:opacity-60 transition-all hover:-translate-y-0.5"
          style={{ background: saved ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#6C63FF,#3B82F6)', boxShadow: '0 8px 30px rgba(108,99,255,0.35)' }}>
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving Changes…</>
            : saved ? <><CheckCircle className="w-5 h-5" /> Changes Saved!</>
            : <><Save className="w-5 h-5" /> Save All Changes</>}
        </button>

        {/* ── Danger Zone ── */}
        <div className="rounded-3xl border border-red-500/20 overflow-hidden"
          style={{ background: 'rgba(239,68,68,0.03)' }}>
          <div className="px-6 py-4 border-b border-red-500/15">
            <h2 className="font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h2>
          </div>
          <div className="p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-semibold text-white mb-0.5">Delete This Institute</p>
              <p className="text-sm text-white/40">Permanently removes the institute and unlinks all tutors.</p>
            </div>
            <button onClick={() => setShowDelete(true)} disabled={deleting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-red-400 border border-red-500/25 bg-red-500/5 hover:bg-red-500/15 transition-all disabled:opacity-50">
              <Trash2 className="w-4 h-4" /> Delete Institute
            </button>
          </div>
        </div>

      </div>

      {/* ── Delete Modal ── */}
      {showDelete && (
        <DeleteDialog
          name={institute?.name || ''}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
