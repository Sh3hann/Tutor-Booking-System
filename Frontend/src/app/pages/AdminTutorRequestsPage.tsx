import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { getStoredUser, getStoredToken } from '../utils/authService';
import { adminBackendApi } from '../utils/adminApi';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { ArrowLeft, Check, X, Eye, Calendar, Mail, User, Info, MapPin, Phone } from 'lucide-react';

export function AdminTutorRequestsPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<any | null>(null);
  const [rejectModal, setRejectModal] = useState<{ request: any; reason: string } | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user || (user.role || '').toLowerCase() !== 'admin') {
      navigate('/admin/login');
      return;
    }
    load();
  }, [navigate]);

  const load = async () => {
    try {
      const res = await adminBackendApi.getTutorRequests('PENDING');
      setRequests(res.requests || []);
    } catch (e) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (req: any) => {
    try {
      await adminBackendApi.approveTutorRequest(req.id);
      toast.success('Request approved');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve');
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal?.request) return;
    try {
      await adminBackendApi.rejectTutorRequest(rejectModal.request.id, rejectModal.reason);
      toast.success('Request rejected');
      setRejectModal(null);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to reject');
    }
  };

  const headingColor = isDark ? '#ffffff' : '#0f0e1a';
  const subColor = isDark ? '#8888AA' : '#555292';
  const cardStyle = isDark
    ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem' }
    : { background: '#eeebf5', border: '1px solid #a8a4c6', borderRadius: '1rem', boxShadow: '0 2px 16px rgba(60,50,140,0.1)' };
  const tableHeadTxt = isDark ? '#777799' : '#4a4770';
  const cellTxt = isDark ? '#ffffff' : '#0f0e1a';
  const dialogBg = isDark
    ? { background: '#0b0914', border: '1px solid rgba(255,255,255,0.1)' }
    : { background: '#edeaf8', border: '1px solid #a8a4c6' };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl" style={{ color: subColor }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" asChild style={{ color: headingColor }}>
            <Link to="/admin/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold" style={{ color: headingColor }}>Profile Requests</h1>
        </div>

        <div style={cardStyle} className="overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#b8b4d0' }}>
            <h2 className="text-lg font-semibold" style={{ color: headingColor }}>Pending Requests</h2>
            <p className="text-sm mt-0.5" style={{ color: subColor }}>Approve or reject new tutor profiles. Approved tutors become visible to students.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: isDark ? 'transparent' : '#e4e0ed' }}>
                <tr>
                  {['Tutor', 'Email', 'Submitted', 'Status', 'Actions'].map((h, i) => (
                    <th key={h} className={`px-6 py-3 text-left font-semibold ${i === 4 ? 'text-right' : ''}`} style={{ color: tableHeadTxt }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r, idx) => (
                  <tr key={r.id} style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #c8c4e0', background: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.01)' : 'rgba(168,164,198,0.15)') }}>
                    <td className="px-6 py-4 font-medium" style={{ color: cellTxt }}>{r.tutorName || '-'}</td>
                    <td className="px-6 py-4" style={{ color: subColor }}>{r.tutorEmail}</td>
                    <td className="px-6 py-4" style={{ color: subColor }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#6C63FF22', color: '#6C63FF' }}>{r.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetailModal(r)} className="p-1.5 rounded-lg hover:bg-[#6C63FF]/10 text-[#6C63FF]" title="View details"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleApprove(r)} className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-500" title="Approve"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setRejectModal({ request: r, reason: '' })} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500" title="Reject"><X className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12" style={{ color: subColor }}>No pending requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        <Dialog open={!!detailModal} onOpenChange={() => setDetailModal(null)}>
          <DialogContent className="max-w-lg shadow-2xl backdrop-blur-2xl" style={dialogBg}>
            <DialogHeader>
              <DialogTitle style={{ color: headingColor }}>Request Details</DialogTitle>
              <DialogDescription style={{ color: subColor }}>{detailModal?.tutorName} ({detailModal?.tutorEmail})</DialogDescription>
            </DialogHeader>
            {detailModal && (
              <div className="space-y-4 my-2">
                {[
                  { icon: Mail, label: 'Email', value: detailModal.tutorEmail },
                  { icon: Calendar, label: 'Submitted', value: detailModal.createdAt ? new Date(detailModal.createdAt).toLocaleString() : '-' },
                  { icon: Phone, label: 'Contact', value: detailModal.submittedData?.contactPhone || '—' },
                  { icon: MapPin, label: 'Location', value: detailModal.submittedData?.location || '—' },
                  { icon: User, label: 'Bio', value: detailModal.submittedData?.bio || 'No bio provided' },
                  { icon: Info, label: 'Hourly Rate', value: detailModal.submittedData?.hourlyRate ? `LKR ${detailModal.submittedData.hourlyRate}` : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: isDark ? 'rgba(108,99,255,0.15)' : '#ddd9f0' }}>
                      <Icon className="w-4 h-4" style={{ color: '#6C63FF' }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-0.5" style={{ color: subColor }}>{label}</p>
                      <p className="text-sm font-medium" style={{ color: cellTxt }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDetailModal(null)} style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#b8b4d0', color: headingColor }}>Close</Button>
              <Button variant="destructive" onClick={() => { setRejectModal({ request: detailModal, reason: '' }); setDetailModal(null); }}>Reject</Button>
              <Button onClick={() => { handleApprove(detailModal); setDetailModal(null); }} style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)', color: '#fff', border: 'none' }}>Approve</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
          <DialogContent className="shadow-2xl backdrop-blur-2xl" style={dialogBg}>
            <DialogHeader>
              <DialogTitle style={{ color: '#EF4444' }}>Reject Request</DialogTitle>
              <DialogDescription style={{ color: subColor }}>User: {rejectModal?.request?.tutorName}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 my-4">
              <p className="text-sm font-medium" style={{ color: headingColor }}>Rejection reason (optional)</p>
              <textarea
                className="w-full h-24 px-3 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/50"
                placeholder="e.g. Incomplete qualifications or bio too short..."
                value={rejectModal?.reason ?? ''}
                style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #b8b4d0', color: headingColor }}
                onChange={(e) => setRejectModal((p: any) => p ? { ...p, reason: e.target.value } : null)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectModal(null)} style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#b8b4d0', color: headingColor }}>Cancel</Button>
              <Button variant="destructive" onClick={handleRejectSubmit}>Confirm Reject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
