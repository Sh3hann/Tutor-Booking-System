import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { instituteAPI } from '../utils/api';
import { getStoredUser } from '../utils/authService';
import { toast } from 'sonner';
import {
  Building2, MapPin, Clock, Users, Search, ArrowRight,
  X, Loader2, GraduationCap, Send,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Institute {
  id: string;
  name: string;
  description: string;
  location: string;
  timetable: string;
  photo: string;
  managerId?: string;
  managerName?: string;
  createdAt: string;
}

// ─── Request to Join Modal ────────────────────────────────────────────────────
function RequestJoinModal({
  institute,
  onClose,
}: {
  institute: Institute;
  onClose: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleRequest = async () => {
    setSending(true);
    try {
      await instituteAPI.join(institute.id);
      toast.success('Join request sent! The institute manager will review it.');
      setDone(true);
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit request');
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
      <div className="border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl text-center"
        style={{ background: '#0e0b20', boxShadow: '0 0 60px rgba(14,165,233,0.12)' }}>
        {done ? (
          <>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <GraduationCap className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Request Sent!</h3>
            <p className="text-white/50 text-sm mb-6">
              Your request to join <strong className="text-white">{institute.name}</strong> has been submitted.
              The manager will review and approve it.
            </p>
            <button onClick={onClose}
              className="w-full py-3 rounded-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
              Done
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.25)' }}>
              <Send className="w-8 h-8" style={{ color: '#38BDF8' }} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Request to Join</h3>
            <p className="text-white/50 text-sm mb-1">You're requesting to be listed as a tutor at</p>
            <p className="text-white font-bold mb-4">{institute.name}</p>
            <p className="text-xs text-white/30 mb-6">
              The institute manager will receive your request and approve or decline it.
            </p>
            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-3 rounded-2xl font-semibold border border-white/10 text-white/50 hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={handleRequest} disabled={sending}
                className="flex-1 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', boxShadow: '0 8px 24px rgba(14,165,233,0.30)' }}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </>
        )}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Institute Card ────────────────────────────────────────────────────────────
function InstituteCard({
  inst,
  isTutor,
  onViewDetails,
  onRequestJoin,
}: {
  inst: Institute;
  isTutor: boolean;
  onViewDetails: () => void;
  onRequestJoin: () => void;
}) {
  return (
    <div
      className="rounded-3xl border border-white/8 overflow-hidden flex flex-col group hover:-translate-y-1.5 transition-all duration-300 hover:shadow-2xl hover:border-white/15"
      style={{ background: 'linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))' }}>
      {/* Banner */}
      <div className="relative h-40 overflow-hidden flex-shrink-0">
        {inst.photo
          ? <img src={inst.photo} alt={inst.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,rgba(14,165,233,0.25),rgba(2,132,199,0.12))' }}>
              <Building2 className="w-16 h-16 text-white/15" />
            </div>
          )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06040f] via-black/20 to-transparent" />
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-white text-lg mb-2 leading-tight">{inst.name}</h3>
        {inst.description && (
          <p className="text-white/50 text-sm leading-relaxed mb-3 line-clamp-2">{inst.description}</p>
        )}

        <div className="space-y-1.5 mb-4">
          {inst.location && (
            <div className="flex items-center gap-2 text-xs text-white/45">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#38BDF8' }} />
              <span className="truncate">{inst.location}</span>
            </div>
          )}
          {inst.timetable && (
            <div className="flex items-start gap-2 text-xs text-white/45">
              <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#38BDF8' }} />
              <span className="line-clamp-1 font-mono">{inst.timetable.split('\n')[0]}</span>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          {isTutor && (
            <button onClick={onRequestJoin}
              className="flex-none px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5"
              style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.30)', background: 'rgba(14,165,233,0.07)' }}
              title="Request to be listed as a tutor here">
              <Users className="w-3.5 h-3.5" /> Request to Join
            </button>
          )}
          <button onClick={onViewDetails}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,rgba(14,165,233,0.22),rgba(2,132,199,0.12))', border: '1px solid rgba(14,165,233,0.22)' }}>
            View Details <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function InstitutesListPage() {
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [totalTutors, setTotalTutors] = useState<number | string>('—');
  const [totalSubjects, setTotalSubjects] = useState<number | string>('—');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [joinTarget, setJoinTarget] = useState<Institute | null>(null);

  const storedUser = getStoredUser();
  const isTutor = storedUser?.role === 'tutor';

  useEffect(() => { loadInstitutes(); }, []);

  const loadInstitutes = async () => {
    setLoading(true);
    try {
      const res = await instituteAPI.list();
      setInstitutes(res.institutes || []);
      setTotalTutors(res.totalTutors ?? '—');
      setTotalSubjects(res.totalSubjects ?? '—');
    } catch {
      toast.error('Failed to load institutes');
    } finally {
      setLoading(false);
    }
  };

  const filtered = institutes.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.location?.toLowerCase().includes(search.toLowerCase()) ||
    i.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#06040f] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden pt-20 pb-16 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse,#0EA5E9 0%,transparent 70%)' }} />
          <div className="absolute top-10 left-1/4 w-[300px] h-[300px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(ellipse,#38BDF8 0%,transparent 70%)' }} />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold"
            style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(56,189,248,0.25)', color: '#38BDF8' }}>
            <Building2 className="w-4 h-4" /> Institutes Network
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight"
            style={{ background: 'linear-gradient(135deg,#ffffff 30%,#38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Explore Institutes
          </h1>
          <p className="text-white/50 text-lg md:text-xl max-w-xl mx-auto mb-10">
            Discover educational institutes and the tutors who teach there.
            {isTutor && ' Select an institute to request joining.'}
          </p>

          {/* Stats strip */}
          <div className="flex items-center justify-center gap-8 mb-10">
            {[
              { label: 'Institutes', value: institutes.length },
              { label: 'Tutors Listed', value: totalTutors },
              { label: 'Subjects', value: totalSubjects },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Search row — NO create button */}
          <div className="flex max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, location…"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none transition-colors"
                style={{ '--tw-ring-shadow': 'none' } as any}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-6 pb-20">

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'rgba(56,189,248,0.25)', borderTopColor: '#0EA5E9' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/8 p-20 text-center"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <Building2 className="w-16 h-16 text-white/15 mx-auto mb-4" />
            <p className="text-white/40 text-xl font-semibold mb-2">
              {search ? 'No institutes match your search' : 'No institutes yet'}
            </p>
            <p className="text-white/25 text-sm max-w-sm mx-auto">
              {search
                ? 'Try a different keyword or clear the search.'
                : 'Institutes will appear here once they are registered and approved.'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-white/40 text-sm">
                Showing <span className="text-white font-semibold">{filtered.length}</span> institute{filtered.length !== 1 ? 's' : ''}
                {search && <span className="ml-1">for "<span className="text-white/70">{search}</span>"</span>}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(inst => (
                <InstituteCard
                  key={inst.id}
                  inst={inst}
                  isTutor={isTutor}
                  onViewDetails={() => navigate(`/institute/${inst.id}`)}
                  onRequestJoin={() => setJoinTarget(inst)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Join Modal ── */}
      {joinTarget && (
        <RequestJoinModal
          institute={joinTarget}
          onClose={() => setJoinTarget(null)}
        />
      )}
    </div>
  );
}
