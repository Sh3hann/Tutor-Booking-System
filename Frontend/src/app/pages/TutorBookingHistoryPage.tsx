import { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router';
import { bookingAPI } from '../utils/api';
import { toast } from 'sonner';
import {
  Calendar, ArrowLeft, CalendarOff, Trash2,
  AlertTriangle, ChevronDown, Clock, GraduationCap,
  TrendingUp, CheckCircle2, XCircle, Users
} from 'lucide-react';

/* ── Constants ──────────────────────────────────────── */
const GRAD    = 'linear-gradient(135deg,#7C3AED,#6C63FF)';
const CLEARED_KEY = 'tutor_bh_cleared';

type StatusFilter   = 'All' | 'Completed' | 'Upcoming' | 'Cancelled';
type DateFilter     = 'All Time' | 'This Week' | 'This Month' | 'Last 3 Months';

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

/* ── Date range filter ──────────────────────────────── */
function withinDateRange(b: any, range: DateFilter): boolean {
  if (range === 'All Time') return true;
  const now   = Date.now();
  const bTime = new Date(b.dateTime || b.createdAt || 0).getTime();
  const diff  = now - bTime;
  const day   = 86_400_000;
  if (range === 'This Week')      return diff <= 7  * day;
  if (range === 'This Month')     return diff <= 30 * day;
  if (range === 'Last 3 Months')  return diff <= 90 * day;
  return true;
}

/* ── Confirmation Dialog ────────────────────────────── */
function ConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg,rgba(20,16,40,0.98),rgba(10,8,24,0.98))', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="p-6 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(124,58,237,0.08))' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.18)' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: '#f87171' }} />
            </div>
            <h3 className="font-bold text-white text-base">Clear Booking History?</h3>
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(200,190,255,0.7)' }}>
            This removes entries from this history view only. Your actual class sessions and payments are not affected.
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
   TUTOR BOOKING HISTORY PAGE
   ═══════════════════════════════════════════════════════ */

export function TutorBookingHistoryPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('All');
  const [dateFilter, setDateFilter]         = useState<DateFilter>('All Time');
  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [showDateDrop, setShowDateDrop]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [isCleared, setIsCleared]           = useState(() => localStorage.getItem(CLEARED_KEY) === '1');

  // ── Theme-aware colors ────────────────────────────
  const headColor = isDark ? '#ffffff' : '#0f0e1a';
  const subColor  = isDark ? 'rgba(255,255,255,0.4)' : '#555292';
  const cardBg    = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const cardBdr   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.18)';
  const navBg     = isDark ? 'rgba(6,4,15,0.9)' : 'rgba(240,238,255,0.95)';
  const bodyBg    = isDark ? '#06040f' : '#f8f7ff';
  const muted     = isDark ? 'rgba(255,255,255,0.3)' : '#7070A0';

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getTutorBookings();

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
    const v = resolveVariant(b);
    const statusOk = statusFilter === 'All' || v === statusFilter.toLowerCase();
    const dateOk   = withinDateRange(b, dateFilter);
    return statusOk && dateOk;
  });

  /* Summary stats from ALL bookings (unfiltered) */
  const stats = {
    total:     allBookings.length,
    completed: allBookings.filter(b => resolveVariant(b) === 'completed').length,
    upcoming:  allBookings.filter(b => resolveVariant(b) === 'upcoming').length,
    cancelled: allBookings.filter(b => resolveVariant(b) === 'cancelled').length,
    earnings:  allBookings
      .filter(b => resolveVariant(b) === 'completed')
      .reduce((s, b) => s + (b.price || 0), 0),
  };

  const statusOptions: StatusFilter[] = ['All', 'Completed', 'Upcoming', 'Cancelled'];
  const dateOptions: DateFilter[]     = ['All Time', 'This Week', 'This Month', 'Last 3 Months'];

  const statusColors: Record<StatusFilter, string> = {
    All: isDark ? '#c4b5fd' : '#6C63FF', 
    Completed: '#4ade80', 
    Upcoming: '#60a5fa', 
    Cancelled: '#f87171'
  };

  /* Close dropdowns on outside click */
  const closeDrops = () => { setShowStatusDrop(false); setShowDateDrop(false); };

  return (
    <div className="min-h-screen" style={{ background: bodyBg, color: headColor }} onClick={closeDrops}>

      {/* ── NAV BAR ── */}
      <header className="sticky top-0 z-40"
        style={{ background: navBg, backdropFilter: 'blur(24px)', borderBottom: `1px solid ${cardBdr}` }}>
        <div className="max-w-5xl mx-auto px-4 lg:px-8 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/tutor/dashboard')}
            className="flex items-center gap-2 text-sm transition-all hover:text-white group"
            style={{ color: muted }}>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#6C63FF)' }}>
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold"
              style={{ backgroundImage: 'linear-gradient(135deg,#a78bfa,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              TutorHub
            </span>
          </div>
        </div>
      </header>


      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,rgba(212,83,126,0.28),rgba(168,56,96,0.2))' }}>
              <Calendar className="w-6 h-6" style={{ color: '#D4537E' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: headColor }}>Booking History</h1>
              <p className="text-sm" style={{ color: subColor }}>
                {isCleared ? 'History cleared' : `${displayed.length} booking${displayed.length !== 1 ? 's' : ''} shown`}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>

            {/* Status filter */}
            <div className="relative">
              <button onClick={() => { setShowStatusDrop(v => !v); setShowDateDrop(false); }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: statusColors[statusFilter] }}>
                {statusFilter}
                <ChevronDown className="w-3.5 h-3.5" style={{ transform: showStatusDrop ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
              </button>
              {showStatusDrop && (
                <div className="absolute right-0 mt-2 w-40 rounded-2xl overflow-hidden shadow-2xl z-20"
                  style={{ background: isDark ? 'rgba(20,16,40,0.98)' : '#ffffff', border: `1px solid ${cardBdr}` }}>
                  {statusOptions.map(opt => (
                    <button key={opt} onClick={() => { setStatusFilter(opt); setShowStatusDrop(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5"
                      style={{ color: statusFilter === opt ? statusColors[opt] : (isDark ? 'rgba(255,255,255,0.6)' : '#555292') }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date filter */}
            <div className="relative">
              <button onClick={() => { setShowDateDrop(v => !v); setShowStatusDrop(false); }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: dateFilter !== 'All Time' ? '#c4b5fd' : 'rgba(255,255,255,0.65)' }}>
                {dateFilter}
                <ChevronDown className="w-3.5 h-3.5" style={{ transform: showDateDrop ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
              </button>
              {showDateDrop && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl overflow-hidden shadow-2xl z-20"
                  style={{ background: isDark ? 'rgba(20,16,40,0.98)' : '#ffffff', border: `1px solid ${cardBdr}` }}>
                  {dateOptions.map(opt => (
                    <button key={opt} onClick={() => { setDateFilter(opt); setShowDateDrop(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5"
                      style={{ color: dateFilter === opt ? (isDark ? '#c4b5fd' : PRIMARY) : (isDark ? 'rgba(255,255,255,0.6)' : '#555292') }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear / Restore */}
            {isCleared ? (
              <button onClick={handleRestore}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#c4b5fd' }}>
                Restore History
              </button>
            ) : allBookings.length > 0 && (
              <button onClick={() => setShowConfirm(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            )}
          </div>
        </div>

        {/* ── SUMMARY STATS BAR ── */}
        {!isCleared && allBookings.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Total Sessions', value: stats.total,     icon: Users,        color: '#c4b5fd', bg: 'rgba(124,58,237,0.12)'  },
              { label: 'Completed',      value: stats.completed, icon: CheckCircle2, color: '#4ade80', bg: 'rgba(34,197,94,0.12)'   },
              { label: 'Upcoming',       value: stats.upcoming,  icon: Clock,        color: '#60a5fa', bg: 'rgba(59,130,246,0.12)'  },
              { label: 'Cancelled',      value: stats.cancelled, icon: XCircle,      color: '#f87171', bg: 'rgba(239,68,68,0.12)'   },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                style={{ background: bg, border: `1px solid ${color}30` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}20` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none" style={{ color }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: subColor }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── EARNINGS ACCENT BAR ── */}
        {!isCleared && stats.completed > 0 && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl mb-8"
            style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.07))', border: '1px solid rgba(16,185,129,0.2)' }}>
            <TrendingUp className="w-5 h-5 flex-shrink-0" style={{ color: '#10b981' }} />
            <p className="text-sm font-semibold" style={{ color: '#34d399' }}>
              Total Earnings from Completed Sessions:&nbsp;
              <span className="text-white font-bold">LKR {stats.earnings.toLocaleString()}</span>
            </p>
          </div>
        )}

        {/* ── CONTENT ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 rounded-full border-4 border-[#7C3AED] border-t-transparent animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <CalendarOff className="w-7 h-7" style={{ color: '#a78bfa' }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: headColor }}>
              {isCleared
                ? 'History was cleared'
                : statusFilter !== 'All' || dateFilter !== 'All Time'
                  ? 'No bookings match your filters'
                  : 'No bookings yet'}
            </p>
            <p className="text-sm text-center max-w-xs" style={{ color: subColor }}>
              {isCleared
                ? 'Click "Restore History" to view your bookings again'
                : 'Once students book your sessions, they will appear here'}
            </p>
            {isCleared && (
              <button onClick={handleRestore}
                className="mt-5 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
                style={{ background: GRAD, boxShadow: '0 6px 20px rgba(124,58,237,0.35)' }}>
                Restore History
              </button>
            )}
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
              const studentName    = b.studentName  || b.student?.fullName || 'Student';
              const studentEmail   = b.studentEmail || b.student?.email    || '';
              const studentInitial = studentName[0].toUpperCase();

              return (
                <div key={b.id}
                  className="relative flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ background: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? 'none' : '0 4px 15px rgba(108,99,255,0.06)' }}>

                  {/* Left accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ background: meta.bar }} />

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#6C63FF)' }}>
                    {studentInitial}
                  </div>

                  {/* Student + Subject info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="font-semibold" style={{ color: headColor }}>{studentName}</p>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                        {meta.label}
                      </span>
                    </div>
                    {studentEmail && (
                      <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{studentEmail}</p>
                    )}
                    <p className="text-sm" style={{ color: subColor }}>
                      <span className="font-medium" style={{ color: headColor }}>{b.subject || 'Session'}</span>
                      {b.classType  ? ` · ${b.classType}`  : ''}
                      {b.classFormat ? ` · ${b.classFormat}` : ''}
                      {b.duration_minutes || b.durationMinutes
                        ? ` · ${b.duration_minutes || b.durationMinutes} min` : ''}
                    </p>
                  </div>

                  {/* Date / Time */}
                  <div className="hidden sm:flex flex-col items-end flex-shrink-0 gap-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" style={{ color: muted }} />
                      <span className="text-sm font-semibold" style={{ color: headColor }}>{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" style={{ color: muted }} />
                      <span className="text-xs" style={{ color: subColor }}>{timeStr}</span>
                    </div>
                  </div>

                  {/* Earning */}
                  {b.price !== undefined && (
                    <div className="flex-shrink-0 text-right sm:pl-4 sm:border-l"
                      style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Earning</p>
                      <p className="font-bold text-sm"
                        style={{ color: variant === 'completed' ? '#4ade80' : 'rgba(255,255,255,0.55)' }}>
                        LKR {b.price?.toLocaleString()}
                      </p>
                    </div>
                  )}
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
