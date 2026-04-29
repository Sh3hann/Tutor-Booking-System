import { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router';
import { bookingAPI } from '../utils/api';
import { toast } from 'sonner';
import {
  Calendar, ArrowLeft, CalendarOff, Search,
  Trash2, AlertTriangle, ChevronDown, Clock,
  GraduationCap
} from 'lucide-react';

/* ── Constants ─────────────────────────────────────── */
const PRIMARY = '#6C63FF';
const P_DARK  = '#4F46E5';
const GRAD    = `linear-gradient(135deg, ${PRIMARY}, ${P_DARK})`;
const CLEARED_KEY = 'bh_bookings_cleared';

type FilterOption = 'All' | 'Completed' | 'Upcoming' | 'Cancelled';

/* ── Status helpers ─────────────────────────────────── */
function resolveVariant(b: any): 'completed' | 'upcoming' | 'cancelled' {
  if (b.status === 'REJECTED' || b.status === 'CANCELLED') return 'cancelled';
  if (b.paymentStatus === 'PAID') return 'completed';
  return 'upcoming';
}

const STATUS_META = {
  completed: { label: 'Completed', bg: 'rgba(34,197,94,0.12)',  color: '#4ade80', border: 'rgba(34,197,94,0.28)',  bar: '#22c55e' },
  upcoming:  { label: 'Upcoming',  bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.28)', bar: '#3b82f6' },
  cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.28)',  bar: '#ef4444' },
};

/* ── Confirmation Dialog ────────────────────────────── */
function ConfirmDialog({
  onConfirm, onCancel
}: {
  onConfirm: () => void;
  onCancel:  () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg,rgba(20,16,40,0.98),rgba(10,8,24,0.98))', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(108,99,255,0.08))' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.18)' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: '#f87171' }} />
            </div>
            <h3 className="font-bold text-white text-base">Clear Booking History?</h3>
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(200,200,255,0.7)' }}>
            This removes bookings from this history view only. Your actual sessions are not affected.
          </p>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#C8C8FF' }}>
              Cancel
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 6px 20px rgba(239,68,68,0.35)' }}>
              Yes, Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STUDENT BOOKING HISTORY PAGE
   ═══════════════════════════════════════════════════════ */

export function StudentBookingHistoryPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<FilterOption>('All');
  const [showFilter, setShowFilter]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isCleared, setIsCleared]     = useState(() => localStorage.getItem(CLEARED_KEY) === '1');

  // ── Theme-aware colors ────────────────────────────
  const headColor = isDark ? '#ffffff' : '#0f0e1a';
  const subColor  = isDark ? 'rgba(255,255,255,0.45)' : '#555292';
  const cardBg    = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const cardBdr   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.18)';
  const navBg     = isDark ? 'rgba(6,4,15,0.9)' : 'rgba(240,238,255,0.95)';
  const bodyBg    = isDark ? '#06040f' : '#f8f7ff';
  const muted     = isDark ? 'rgba(255,255,255,0.35)' : '#7070A0';

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getStudentBookings();

      const priority = { upcoming: 0, cancelled: 1, completed: 2 };
      const sorted = [...(res.bookings || [])].sort((a, b) => {
        const vA = resolveVariant(a);
        const vB = resolveVariant(b);
        if (priority[vA] !== priority[vB]) return priority[vA] - priority[vB];

        const dateA = new Date(a.dateTime || a.createdAt || 0).getTime();
        const dateB = new Date(b.dateTime || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setAllBookings(sorted);
    } catch {
      setAllBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isCleared) loadBookings();
    else setLoading(false);
  }, [isCleared, loadBookings]);

  const handleClear = () => {
    localStorage.setItem(CLEARED_KEY, '1');
    setIsCleared(true);
    setShowConfirm(false);
    toast.success('Booking history cleared');
  };

  const handleRestore = () => {
    localStorage.removeItem(CLEARED_KEY);
    setIsCleared(false);
  };

  /* Filtered list */
  const displayed = isCleared ? [] : allBookings.filter(b => {
    if (filter === 'All') return true;
    const v = resolveVariant(b);
    return v === filter.toLowerCase();
  });

  const filterOptions: FilterOption[] = ['All', 'Completed', 'Upcoming', 'Cancelled'];

  const filterColors: Record<FilterOption, string> = {
    All:       isDark ? '#c4b5fd' : PRIMARY,
    Completed: '#22c55e',
    Upcoming:  '#3b82f6',
    Cancelled: '#ef4444',
  };

  return (
    <div className="min-h-screen" style={{ background: bodyBg, color: headColor }}>

      {/* ── NAV BAR ── */}
      <header className="sticky top-0 z-40"
        style={{ background: navBg, backdropFilter: 'blur(24px)', borderBottom: `1px solid ${cardBdr}` }}>
        <div className="max-w-4xl mx-auto px-4 lg:px-8 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/student/dashboard')}
            className="flex items-center gap-2 text-sm transition-colors hover:text-white group"
            style={{ color: muted }}>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: GRAD }}>
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold" style={{ backgroundImage: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>TutorHub</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,rgba(212,83,126,0.3),rgba(168,56,96,0.2))' }}>
              <Calendar className="w-6 h-6" style={{ color: '#D4537E' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: headColor }}>Booking History</h1>
              <p className="text-sm" style={{ color: subColor }}>
                {isCleared ? 'History cleared' : `${displayed.length} booking${displayed.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>


          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Filter dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilter(v => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: filterColors[filter] }}>
                <span>{filter}</span>
                <ChevronDown className="w-3.5 h-3.5" style={{ transform: showFilter ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-2 w-40 rounded-2xl overflow-hidden shadow-2xl z-20"
                  style={{ background: isDark ? 'rgba(20,16,40,0.98)' : '#ffffff', border: `1px solid ${cardBdr}` }}>
                  {filterOptions.map(opt => (
                    <button key={opt}
                      onClick={() => { setFilter(opt); setShowFilter(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5"
                      style={{ color: filter === opt ? filterColors[opt] : (isDark ? 'rgba(255,255,255,0.65)' : '#555292') }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear / Restore button */}
            {isCleared ? (
              <button onClick={handleRestore}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', color: '#a89cff' }}>
                Restore History
              </button>
            ) : allBookings.length > 0 && (
              <button onClick={() => setShowConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            )}
          </div>
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 rounded-full border-4 border-[#6C63FF] border-t-transparent animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl"
            style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,99,255,0.05)', border: `1px solid ${cardBdr}` }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}>
              <CalendarOff className="w-7 h-7" style={{ color: PRIMARY }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: headColor }}>
              {isCleared ? 'History was cleared' : filter !== 'All' ? `No ${filter.toLowerCase()} bookings` : 'No bookings yet'}
            </p>
            <p className="text-sm mb-6" style={{ color: subColor }}>
              {isCleared ? 'Click "Restore History" to view your bookings again' : 'Book a session with a tutor to get started'}
            </p>
            <button
              onClick={() => isCleared ? handleRestore() : navigate('/student/search')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:-translate-y-0.5"
              style={{ background: GRAD, boxShadow: '0 6px 20px rgba(108,99,255,0.35)' }}>
              <Search className="w-4 h-4" />
              {isCleared ? 'Restore History' : 'Find a Tutor'}
            </button>
          </div>
        ) : (
          /* Booking Cards */
          <div className="flex flex-col gap-4">
            {displayed.map((b) => {
              const variant = resolveVariant(b);
              const meta    = STATUS_META[variant];
              const dateStr = b.dateTime
                ? new Date(b.dateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—';
              const timeStr = b.dateTime
                ? new Date(b.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : '—';
              const initial = (b.tutorName || 'T')[0].toUpperCase();

              return (
                <div key={b.id}
                  className="relative flex items-center gap-5 p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ background: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? 'none' : '0 4px 15px rgba(108,99,255,0.06)' }}>

                  {/* Left accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: meta.bar }} />

                  {/* Avatar */}
                  {b.tutorAvatar ? (
                    <img src={b.tutorAvatar} alt={b.tutorName}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white"
                      style={{ background: GRAD }}>{initial}</div>
                  )}

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold truncate" style={{ color: headColor }}>{b.subject || 'Session'}</p>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: subColor }}>
                      with <span className="font-medium" style={{ color: headColor }}>{b.tutorName || 'Tutor'}</span>
                      {b.classType ? ` · ${b.classType}` : ''}
                      {b.duration_minutes || b.durationMinutes
                        ? ` · ${b.duration_minutes || b.durationMinutes} min` : ''}
                    </p>
                  </div>

                  {/* Date / Time */}
                  <div className="hidden sm:flex flex-col items-end flex-shrink-0 gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" style={{ color: muted }} />
                      <span className="text-sm font-semibold" style={{ color: headColor }}>{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" style={{ color: muted }} />
                      <span className="text-xs" style={{ color: subColor }}>{timeStr}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <ConfirmDialog
          onConfirm={handleClear}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
