import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { bookingAPI } from '../utils/api';
import { toast } from 'sonner';
import { Calendar, Video, CreditCard, ArrowLeft, CheckCircle, Clock, ExternalLink, X, Lock, Pencil, Trash2, Save, GraduationCap, AlertTriangle, Timer, Ban } from 'lucide-react';

// ─── Time-gated Join Button ──────────────────────────────────────────────────
// OPEN    : now >= (dateTime - 5 min)  AND  completedAt not set
// UPCOMING: now < (dateTime - 5 min)
// ENDED   : completedAt is set
function JoinButton({ b }: { b: any }) {
  const [, tick] = useState(0);
  // Re-render every 30 s so countdown refreshes without page reload
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const now       = Date.now();
  const classTime = new Date(b.dateTime).getTime();
  const openAt    = classTime - 5 * 60 * 1000;  // 5 min before start
  const isEnded   = !!b.completedAt;
  const isOpen    = now >= openAt && !isEnded;
  const isUpcoming = now < openAt;

  const minsUntil  = Math.ceil((openAt - now) / 60_000);
  const hoursUntil = Math.floor(minsUntil / 60);
  const countdown  = hoursUntil > 0
    ? `${hoursUntil}h ${minsUntil % 60}m`
    : `${minsUntil}m`;

  // Tutor hasn't set a meeting link yet
  if (!b.meetingLink) {
    return (
      <div className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white/40 border border-white/10"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <Clock className="w-4 h-4" /> No meeting link yet
      </div>
    );
  }

  // Class has ended (tutor marked done)
  if (isEnded) {
    return (
      <div className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-bold border border-red-500/15"
        style={{ background: 'rgba(239,68,68,0.06)' }}>
        <Ban className="w-4 h-4 text-red-400/60" />
        <span className="text-red-400/70 text-sm font-semibold">Class Ended</span>
      </div>
    );
  }

  // Too early — show countdown warning
  if (isUpcoming) {
    return (
      <div className="w-full space-y-1.5">
        <div className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold text-amber-400/80 border border-amber-500/20"
          style={{ background: 'rgba(245,158,11,0.07)' }}>
          <Timer className="w-4 h-4" />
          <span className="text-sm">Opens in {countdown}</span>
        </div>
        <p className="text-center text-xs text-white/30 flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-500/40" />
          Link unlocks 5 min before class starts
        </p>
      </div>
    );
  }

  // ✅ Window is open — active join link
  return (
    <a
      href={b.meetingLink}
      target="_blank"
      rel="noreferrer"
      className="w-full py-3 rounded-2xl font-bold text-center transition-all hover:-translate-y-0.5 shadow-lg flex items-center justify-center gap-2"
      style={{
        background: 'linear-gradient(135deg, #10B981, #059669)',
        boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
        color: 'white',
      }}
    >
      <ExternalLink className="w-4 h-4" /> Join Virtual Class
    </a>
  );
}

function CardPaymentModal({ booking, onClose, onSuccess }: { booking: any; onClose: () => void; onSuccess: () => void }) {

  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [paying, setPaying] = useState(false);

  const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v: string) => {
    const n = v.replace(/\D/g, '').slice(0, 4);
    return n.length >= 3 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 16) { toast.error('Enter a valid 16-digit card number'); return; }
    if (!cardHolder.trim()) { toast.error('Enter card holder name'); return; }
    if (expiry.length < 5) { toast.error('Enter a valid expiry (MM/YY)'); return; }
    if (cvv.length < 3) { toast.error('Enter a valid CVV'); return; }
    setPaying(true);
    try {
      await bookingAPI.pay(booking.id);
      toast.success('Payment successful! 🎉');
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || 'Payment failed');
    } finally { setPaying(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-[#100d1f] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(59,130,246,0.1))' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5 text-[#6C63FF]" />
              <h2 className="text-xl font-bold text-white">Secure Payment</h2>
            </div>
            <p className="text-white/60 text-sm">LKR {booking.price} — {booking.subject} with {booking.tutorName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handlePay} className="p-6 space-y-4">
          {/* Card Preview Strip */}
          <div className="rounded-2xl p-4 mb-2" style={{ background: 'linear-gradient(135deg, #1a1535, #0d1a2e)', border: '1px solid rgba(108,99,255,0.3)' }}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-1">
                <div className="w-5 h-5 rounded-full bg-amber-400/80" />
                <div className="w-5 h-5 rounded-full bg-amber-600/50 -ml-2" />
              </div>
              <Lock className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-white font-mono text-lg tracking-widest mb-2">{cardNumber || '•••• •••• •••• ••••'}</p>
            <div className="flex justify-between text-xs text-white/50">
              <span>{cardHolder || 'CARD HOLDER'}</span>
              <span>{expiry || 'MM/YY'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Card Holder Name</label>
            <input value={cardHolder} onChange={e => setCardHolder(e.target.value)} placeholder="John Doe" required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#6C63FF] transition-colors" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Card Number</label>
            <input value={cardNumber} onChange={e => setCardNumber(formatCard(e.target.value))} placeholder="1234 5678 9012 3456" required maxLength={19}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono placeholder-white/30 outline-none focus:border-[#6C63FF] transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Expiry</label>
              <input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" maxLength={5} required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono placeholder-white/30 outline-none focus:border-[#6C63FF] transition-colors" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide">CVV</label>
              <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="•••" maxLength={4} required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono placeholder-white/30 outline-none focus:border-[#6C63FF] transition-colors" />
            </div>
          </div>

          <button type="submit" disabled={paying}
            className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 mt-2"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #3B82F6)', boxShadow: '0 8px 24px rgba(108,99,255,0.4)' }}>
            {paying ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</> : <><Lock className="w-4 h-4" /> Pay LKR {booking.price} Securely</>}
          </button>
          <p className="text-center text-xs text-white/30 flex items-center justify-center gap-1 mt-1">
            <Lock className="w-3 h-3" /> 256-bit SSL encryption • Demo payment
          </p>
        </form>
      </div>
    </div>
  );
}

function EditBookingModal({
  booking,
  onClose,
  onSaved,
}: {
  booking: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dt = booking?.dateTime ? new Date(booking.dateTime) : null;
  const toDateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');
  const toTimeInput = (d: Date | null) => (d ? d.toISOString().slice(11, 16) : '');

  const todayMin = (() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10); // YYYY-MM-DD
  })();

  const [form, setForm] = useState({
    subject: booking?.subject || '',
    date: booking?.preferredDate || toDateInput(dt),
    time: booking?.preferredTime || toTimeInput(dt),
  });
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState<string>('');

  const validateDate = (value: string) => {
    if (!value) {
      setDateError('');
      return true;
    }
    if (value < todayMin) {
      setDateError('Booking date cannot be earlier than today');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const subject = form.subject.trim();
    if (!subject) return toast.error('Subject is required');
    if (!form.date) return toast.error('Preferred date is required');
    if (!form.time) return toast.error('Preferred time is required');
    if (!validateDate(form.date)) return toast.error('Booking date cannot be earlier than today');

    setSaving(true);
    try {
      const dateTime = `${form.date}T${form.time}:00`;
      await bookingAPI.updatePending(booking.id, {
        subject,
        preferredDate: form.date,
        preferredTime: form.time,
        dateTime,
      });
      toast.success('Booking request updated');
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-[#100d1f] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(108,99,255,0.15))' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Pencil className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">Edit Request</h2>
            </div>
            <p className="text-white/60 text-sm">Only pending requests can be edited.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Subject</label>
            <input
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#6C63FF] transition-colors"
              placeholder="e.g. Mathematics"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Preferred date</label>
              <input
                type="date"
                min={todayMin}
                value={form.date}
                onChange={e => {
                  const v = e.target.value;
                  setForm({ ...form, date: v });
                  validateDate(v);
                  if (v && v < todayMin) toast.error('Booking date cannot be earlier than today');
                }}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#6C63FF] transition-colors [color-scheme:dark]"
              />
              {dateError && <p className="mt-1 text-xs text-red-400">{dateError}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Preferred time</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#6C63FF] transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 mt-2"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #6C63FF)', boxShadow: '0 8px 24px rgba(245,158,11,0.25)' }}
          >
            {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export function StudentBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<any | null>(null);
  const [editModal, setEditModal] = useState<any | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = async () => {
    try {
      const res = await bookingAPI.getStudentBookings();
      setBookings(res.bookings || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load bookings');
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white/5 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pending = bookings.filter(b => b.status === 'PENDING');
  const accepted = bookings.filter(b => b.status === 'ACCEPTED');
  const activeBookingsCount = pending.length + accepted.length;

  const statusBadge = (b: any) => {
    if (b.status === 'PENDING') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</span>;
    if (b.status === 'ACCEPTED' && b.paymentStatus === 'PENDING') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">✓ Accepted — Pay Now</span>;
    if (b.paymentStatus === 'PAID') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">✓ Paid</span>;
    if (b.status === 'REJECTED') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">Rejected</span>;
    if (b.status === 'CANCELLED') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">Cancelled</span>;
    return null;
  };

  const handleCancel = async (b: any) => {
    if (!b?.id) return;
    setCancellingId(b.id);
    try {
      await bookingAPI.cancelBooking(b.id);
      toast.success('Booking request cancelled');
      loadBookings();
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel request');
    } finally {
      setCancellingId(null);
    }
  };

  const BookingCard = ({ b }: { b: any }) => (
    <div className="relative rounded-3xl overflow-hidden border border-white/8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/20"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}>
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{
        background: b.paymentStatus === 'PAID' ? 'linear-gradient(90deg, #10B981, #059669)' :
          b.status === 'ACCEPTED' ? 'linear-gradient(90deg, #6C63FF, #3B82F6)' :
          b.status === 'REJECTED' ? 'linear-gradient(90deg, #EF4444, #DC2626)' :
          'linear-gradient(90deg, #F59E0B, #D97706)'
      }} />
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-5 justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.3), rgba(59,130,246,0.2))' }}>
                {b.classFormat === 'Online' ? <Video className="w-6 h-6 text-blue-400" /> : <Calendar className="w-6 h-6 text-rose-400" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{b.subject} — {b.classType}</h3>
                <p className="text-white/60 text-sm">with <span className="text-white font-semibold">{b.tutorName}</span></p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {statusBadge(b)}
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/70 border border-white/10 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(b.dateTime).toLocaleString()}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/70 border border-white/10">
                {b.classFormat}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                LKR {b.price}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end justify-center gap-3 min-w-[180px]">
            {b.status === 'ACCEPTED' && b.paymentStatus === 'PENDING' && (
              <button onClick={() => setPayModal(b)}
                className="w-full py-3 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-lg flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #6C63FF, #3B82F6)', boxShadow: '0 8px 24px rgba(108,99,255,0.35)' }}>
                <CreditCard className="w-4 h-4" /> Pay Now
              </button>
            )}
            {b.status === 'PENDING' && (
              <div className="w-full space-y-2">
                <button
                  onClick={() => setEditModal(b)}
                  className="w-full py-2.5 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-lg flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.12))', border: '1px solid rgba(245,158,11,0.35)' }}
                >
                  <Pencil className="w-4 h-4 text-amber-300" /> Edit Request
                </button>
                <button
                  onClick={() => handleCancel(b)}
                  disabled={cancellingId === b.id}
                  className="w-full py-2.5 rounded-2xl font-bold text-white/90 transition-all hover:-translate-y-0.5 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.12))', border: '1px solid rgba(239,68,68,0.35)' }}
                >
                  {cancellingId === b.id ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Cancelling...</> : <><Trash2 className="w-4 h-4 text-red-300" /> Cancel</>}
                </button>
              </div>
            )}
            {b.paymentStatus === 'PAID' && b.classFormat === 'Online' && (
              <JoinButton b={b} />
            )}
            {b.paymentStatus === 'PAID' && !b.meetingLink && (
              <div className="flex items-center gap-2 text-green-400 font-semibold">
                <CheckCircle className="w-5 h-5" /> Payment Complete
              </div>
            )}
            {b.paymentStatus === 'PAID' && (
              <button
                onClick={() => navigate(`/student/learning/${b.tutorId}`)}
                className="w-full py-3 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-lg flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.3), rgba(59,130,246,0.25))', border: '1px solid rgba(108,99,255,0.4)' }}
              >
                <GraduationCap className="w-4 h-4 text-[#6C63FF]" />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa, #60a5fa)' }}>
                  Access Learning Materials
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#06040f] p-6 md:p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 mb-8 text-white/60 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.3), rgba(59,130,246,0.2))' }}>
            <Calendar className="w-6 h-6 text-[#6c63ff]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Bookings</h1>
            <p className="text-white/50 text-sm">{activeBookingsCount} active booking{activeBookingsCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-3xl p-12 text-center border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No bookings yet. Head to a tutor's profile to book a class!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {accepted.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4 text-blue-400">📋 Accepted ({accepted.length})</h2>
                <div className="space-y-4">{accepted.map(b => <BookingCard key={b.id} b={b} />)}</div>
              </div>
            )}
            {pending.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4 text-amber-400">⏳ Pending ({pending.length})</h2>
                <div className="space-y-4">{pending.map(b => <BookingCard key={b.id} b={b} />)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {payModal && (
        <CardPaymentModal
          booking={payModal}
          onClose={() => setPayModal(null)}
          onSuccess={() => { setPayModal(null); loadBookings(); }}
        />
      )}

      {editModal && (
        <EditBookingModal
          booking={editModal}
          onClose={() => setEditModal(null)}
          onSaved={() => { setEditModal(null); loadBookings(); }}
        />
      )}
    </div>
  );
}
