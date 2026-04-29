import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { adminBackendApi } from '../utils/adminApi';
import { toast } from 'sonner';
import {
  ArrowLeft, Trash2, Building2, MapPin, Clock,
  CheckCircle, XCircle, Users, AlertTriangle, Hash, ExternalLink
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Institute {
  id: string; name: string; description: string;
  location: string; timetable: string; photo: string; createdAt: string;
}
interface ManagerRegistration {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  managerName: string;
  email: string;
  instituteName: string;
  instituteLocation: string;
  instituteDescription: string;
  instituteRegistrationNo: string;
}

export function AdminInstitutesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'institutes' | 'requests'>('institutes');
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [requests, setRequests] = useState<ManagerRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Institute | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [iRes, mgrRes] = await Promise.all([
        adminBackendApi.getInstitutes(),
        adminBackendApi.getManagerRegistrations(),
      ]);
      setInstitutes(iRes.institutes || []);
      setRequests(mgrRes.registrations || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminBackendApi.deleteInstitute(deleteTarget.id);
      toast.success('Institute deleted');
      setDeleteTarget(null);
      load();
    } catch (e: any) { toast.error(e.message || 'Failed to delete'); }
  };

  const handleApprove = async (req: ManagerRegistration) => {
    try {
      await adminBackendApi.approveManagerRegistration(req.id);
      toast.success(`Institute "${req.instituteName}" approved & created!`);
      load();
    } catch (e: any) { toast.error(e.message || 'Failed to approve'); }
  };

  const handleReject = async (req: ManagerRegistration) => {
    try {
      if (!confirm(`Reject registration for ${req.instituteName}?`)) return;
      await adminBackendApi.rejectManagerRegistration(req.id);
      toast.success('Registration rejected');
      load();
    } catch { toast.error('Failed to reject registration'); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#06040f] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#06040f] text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <button onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 mb-8 text-white/50 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,rgba(56,189,248,0.25),rgba(14,165,233,0.12))' }}>
              <Building2 className="w-6 h-6" style={{ color: '#38BDF8' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Institutes</h1>
              <p className="text-white/40 text-sm">{institutes.length} institutes · {requests.length} pending requests</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-2xl border border-white/8 w-fit"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          {([
            { id: 'institutes', label: 'Institutes', count: institutes.length },
            { id: 'requests',   label: 'Requests',   count: requests.length },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                tab === t.id ? 'bg-[#0EA5E9] text-white shadow-lg' : 'text-white/50 hover:text-white'
              }`}>
              {t.label}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                tab === t.id ? 'bg-white/20' : 'bg-white/8'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── Institutes Tab ── */}
        {tab === 'institutes' && (
          <div>
            {institutes.length === 0 ? (
              <div className="rounded-3xl border border-white/8 p-16 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <Building2 className="w-14 h-14 text-white/20 mx-auto mb-4" />
                <p className="text-white/40 text-lg font-semibold">No institutes yet</p>
                <p className="text-white/25 text-sm mt-1">Approve a manager registration request to add one.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {institutes.map(inst => (
                  <div key={inst.id} className="rounded-2xl border border-white/8 overflow-hidden hover:-translate-y-1 transition-all flex flex-col" style={{ background: 'rgba(28,28,30,0.80)' }}>
                    <div className="relative h-32 overflow-hidden flex-shrink-0">
                      {inst.photo
                        ? <img src={inst.photo} alt={inst.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(14,165,233,0.25),rgba(2,132,199,0.08))' }}>
                            <Building2 className="w-10 h-10 text-[#0EA5E9]/40" />
                          </div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-black/20 to-transparent" />
                      <button onClick={() => setDeleteTarget(inst)} className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/25 text-red-300 hover:bg-red-500/45 transition-colors backdrop-blur-sm">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-white text-base mb-1">{inst.name}</h3>
                      {inst.description && <p className="text-white/45 text-xs mb-3 line-clamp-2">{inst.description}</p>}
                      <div className="space-y-1.5 mb-4">
                        {inst.location && <div className="flex items-center gap-2 text-xs text-white/45"><MapPin className="w-3 h-3 text-[#38BDF8]" /> {inst.location}</div>}
                        {inst.timetable && <div className="flex items-start gap-2 text-xs text-white/45"><Clock className="w-3 h-3 flex-shrink-0 mt-0.5 text-[#38BDF8]" /><span className="line-clamp-1 font-mono">{inst.timetable.split('\n')[0]}</span></div>}
                      </div>
                      <div className="mt-auto pt-2 border-t border-white/10 flex justify-between items-center text-xs opacity-60">
                        <span>Created: {new Date(inst.createdAt).toLocaleDateString()}</span>
                        <button onClick={() => navigate(`/institute/${inst.id}`)} className="flex items-center gap-1 hover:text-[#38BDF8] transition-colors"><ExternalLink className="w-3 h-3" /> View</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Requests Tab ── */}
        {tab === 'requests' && (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="rounded-3xl border border-white/8 p-16 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <Users className="w-14 h-14 text-white/20 mx-auto mb-4" />
                <p className="text-white/40 text-lg font-semibold">No pending requests</p>
                <p className="text-white/25 text-sm mt-1">When an institute manager registers, their request will appear here.</p>
              </div>
            ) : requests.map((req, i) => (
              <div key={i}
                className="rounded-3xl border border-white/10 overflow-hidden p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ background: 'rgba(14,165,233,0.15)' }}>
                    <Building2 className="w-6 h-6 text-[#38BDF8]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg mb-1">{req.instituteName}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mt-3">
                      <div className="text-sm"><span className="text-white/40">Manager Name:</span> <span className="text-white/80">{req.managerName}</span></div>
                      <div className="text-sm"><span className="text-white/40">Email:</span> <span className="text-white/80">{req.email}</span></div>
                      <div className="text-sm"><span className="text-white/40">Registration No:</span> <span className="font-mono text-[#38BDF8]">{req.instituteRegistrationNo}</span></div>
                      {req.instituteLocation && <div className="text-sm"><span className="text-white/40">Location:</span> <span className="text-white/80">{req.instituteLocation}</span></div>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                  <button onClick={() => handleReject(req)}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm text-red-400 border border-red-500/25 bg-red-500/5 hover:bg-red-500/15 transition-all flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button onClick={() => handleApprove(req)}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', color: 'white', boxShadow: '0 4px 16px rgba(14,165,233,0.3)' }}>
                    <CheckCircle className="w-4 h-4" /> Approve & Create
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-[#100d1f] border border-red-500/25 rounded-3xl w-full max-w-md p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Delete Institute?</h2>
            <p className="text-white/50 mb-6">
              This will permanently delete <strong className="text-white">{deleteTarget.name}</strong>
              {' '}and unlink all tutors from it. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-2xl font-semibold border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-3 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 8px 24px rgba(239,68,68,0.3)' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
