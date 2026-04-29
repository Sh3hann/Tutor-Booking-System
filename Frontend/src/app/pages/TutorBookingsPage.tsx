import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { bookingAPI } from '../utils/api';
import { toast } from 'sonner';
import {
  Calendar, ArrowLeft, Clock, Video, Info, CheckCircle2,
  StopCircle, ExternalLink, AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';

export function TutorBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentModal, setStudentModal] = useState<any | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState<any | null>(null); // booking to confirm end

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = async () => {
    try {
      const res = await bookingAPI.getTutorBookings();
      setBookings(res.bookings || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load bookings');
    } finally { setLoading(false); }
  };

  const handleAccept = async (id: string) => {
    try {
      await bookingAPI.accept(id);
      toast.success('Booking accepted');
      loadBookings();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update booking');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await bookingAPI.reject(id);
      toast.success('Booking rejected');
      loadBookings();
    } catch (e: any) {
      toast.error(e.message || 'Failed to reject booking');
    }
  };

  const handleEndClass = async (id: string) => {
    setEndingId(id);
    try {
      await bookingAPI.markDone(id);
      toast.success('Class marked as ended — student join link is now blocked 🔒');
      setConfirmEnd(null);
      loadBookings();
    } catch (e: any) {
      toast.error(e.message || 'Failed to end class');
    } finally { setEndingId(null); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06040f] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingBookings  = bookings.filter(b => b.status === 'PENDING');
  // Active = accepted + paid + NOT yet ended
  const activeBookings   = bookings.filter(b => b.status === 'ACCEPTED' && b.paymentStatus === 'PAID' && !b.completedAt);
  // Ended = completed
  const endedBookings    = bookings.filter(b => !!b.completedAt);

  return (
    <div className="min-h-screen bg-[#06040f] p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/tutor/dashboard')}
          className="flex items-center gap-2 mb-6 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-[#6c63ff]" /> Class Bookings
        </h1>

        <div className="space-y-10">

          {/* ── Pending Requests ── */}
          <div>
            <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">
              ⏳ Pending Requests ({pendingBookings.length})
            </h2>
            {pendingBookings.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white/5 border border-white/10 opacity-60">
                <Clock className="w-10 h-10 mx-auto mb-3 text-[#6c63ff]/50" />
                <p className="italic">No incoming requests right now.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingBookings.map(b => (
                  <div key={b.id}
                    className="bg-white/5 border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{b.subject} - {b.classType}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-white/60">Student: <span className="text-white font-medium">{b.studentName}</span></p>
                        {b.studentDetails && (
                          <button onClick={() => setStudentModal({ name: b.studentName, ...b.studentDetails })}
                            className="p-1 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 transition-colors" title="View Student Profile">
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-lg">
                          <Clock className="w-4 h-4 text-amber-400" /> {new Date(b.dateTime).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-lg">
                          {b.classFormat === 'Online' ? <Video className="w-4 h-4 text-blue-400" /> : <Calendar className="w-4 h-4 text-rose-400" />}
                          {b.classFormat}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button onClick={() => handleAccept(b.id)}
                        className="flex-1 py-2 px-6 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 rounded-xl font-bold transition-all">
                        Accept
                      </button>
                      <button onClick={() => handleReject(b.id)}
                        className="flex-1 py-2 px-6 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-bold transition-all">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Active Classes (Paid, not ended) ── */}
          <div>
            <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              Active Classes ({activeBookings.length})
            </h2>
            {activeBookings.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white/5 border border-white/10 opacity-60">
                <Video className="w-10 h-10 mx-auto mb-3 text-green-500/30" />
                <p className="italic">No active classes right now.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeBookings.map(b => {
                  const classTime = new Date(b.dateTime).getTime();
                  const openAt    = classTime - 5 * 60 * 1000;
                  const now       = Date.now();
                  const inWindow  = now >= openAt;
                  return (
                    <div key={b.id}
                      className="rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center border border-green-500/25"
                      style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.07),rgba(5,150,105,0.04))' }}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold">{b.subject} - {b.classType}</h3>
                          {inWindow && (
                            <span className="text-xs font-bold text-green-400 bg-green-500/15 border border-green-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <p className="text-white/60">Student: <span className="text-white font-medium">{b.studentName}</span></p>
                          {b.studentDetails && (
                            <button onClick={() => setStudentModal({ name: b.studentName, ...b.studentDetails })}
                              className="p-1 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 transition-colors">
                              <Info className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-lg">
                            <Clock className="w-4 h-4 text-green-400" /> {new Date(b.dateTime).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-lg">
                            <Video className="w-4 h-4 text-blue-400" /> {b.classFormat}
                          </span>
                          {b.meetingLink && (
                            <a href={b.meetingLink} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-lg hover:bg-blue-500/20 transition-colors text-xs font-semibold">
                              <ExternalLink className="w-3.5 h-3.5" /> Open Meeting
                            </a>
                          )}
                        </div>
                      </div>

                      {/* End Class Button */}
                      <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                        <button
                          onClick={() => setConfirmEnd(b)}
                          disabled={endingId === b.id}
                          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50 shadow-lg"
                          style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.25),rgba(239,68,68,0.15))', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5' }}>
                          <StopCircle className="w-4 h-4" />
                          End Class
                        </button>
                        <p className="text-xs text-white/30 text-right">
                          Ending blocks student's join link
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Ended Classes ── */}
          {endedBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2 text-white/50">
                ✓ Completed Classes ({endedBookings.length})
              </h2>
              <div className="grid gap-3">
                {endedBookings.map(b => (
                  <div key={b.id}
                    className="rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center border border-white/8 opacity-70"
                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <CheckCircle2 className="w-6 h-6 text-green-500/60 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white/70">{b.subject} — {b.studentName}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        Ended {new Date(b.completedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs text-white/30 font-semibold px-3 py-1 rounded-full border border-white/8 bg-white/3">
                      LKR {b.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Confirm End Class Modal ── */}
      <Dialog open={!!confirmEnd} onOpenChange={() => setConfirmEnd(null)}>
        <DialogContent className="bg-[#0b0914] border-white/10 shadow-2xl text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <StopCircle className="w-5 h-5" /> End Class?
            </DialogTitle>
            <DialogDescription className="text-white/60 space-y-2 pt-1">
              <p>You are about to end the session for:</p>
              <p className="text-white font-semibold">{confirmEnd?.subject} with {confirmEnd?.studentName}</p>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-300/80 text-sm">
                  This will immediately block the student's "Join Virtual Class" link. This cannot be undone.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setConfirmEnd(null)} className="flex-1 border-white/15 text-white/70 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={() => handleEndClass(confirmEnd.id)}
              disabled={endingId === confirmEnd?.id}
              className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 font-bold"
            >
              {endingId === confirmEnd?.id
                ? <><div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> Ending…</>
                : <><StopCircle className="w-4 h-4" /> Yes, End Class</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Student Profile Modal ── */}
      <Dialog open={!!studentModal} onOpenChange={() => setStudentModal(null)}>
        <DialogContent className="bg-[#0b0914] border-white/10 shadow-2xl backdrop-blur-2xl text-white">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
            <DialogDescription className="text-white/60">
              Details for {studentModal?.name}
            </DialogDescription>
          </DialogHeader>
          {studentModal && (
            <div className="space-y-4 my-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-xs text-white/50 mb-1">Grade</p>
                  <p className="font-medium">{studentModal.grade || 'Not specified'}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-xs text-white/50 mb-1">Age</p>
                  <p className="font-medium">{studentModal.age || 'Not specified'}</p>
                </div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <p className="text-xs text-white/50 mb-1">Student Contact</p>
                <p className="font-medium">{studentModal.contactNumber || 'Not specified'}</p>
                <p className="text-sm text-white/70">{studentModal.email}</p>
              </div>
              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <p className="text-xs text-amber-500/70 mb-1">Parent / Guardian Details</p>
                <p className="font-medium text-amber-400">{studentModal.parentName || 'Not specified'}</p>
                <p className="text-sm text-amber-400/80">{studentModal.parentContact}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setStudentModal(null)} className="w-full">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
