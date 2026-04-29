import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { bookingAPI } from '../utils/api';
import { toast } from 'sonner';
import { DollarSign, ArrowLeft, TrendingUp, CheckCircle } from 'lucide-react';

export function TutorFinancialsPage() {
  const navigate = useNavigate();
  const [earningsData, setEarningsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const res = await bookingAPI.getEarnings();
      setEarningsData(res);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white/5 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { totalEarnings, completedCount, paidBookings } = earningsData || { totalEarnings: 0, completedCount: 0, paidBookings: [] };

  return (
    <div className="min-h-screen bg-[#06040f] p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/tutor/dashboard')} className="flex items-center gap-2 mb-6 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-400" /> Financial Dashboard
        </h1>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mt-10 -mr-10" />
            <h3 className="text-white/60 font-medium mb-1">Total Earnings</h3>
            <div className="text-4xl font-extrabold text-green-400">LKR {totalEarnings.toLocaleString()}</div>
            <div className="mt-4 flex items-center gap-2 text-sm text-green-400/80">
              <TrendingUp className="w-4 h-4" /> +100% since last month
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mt-10 -mr-10" />
            <h3 className="text-white/60 font-medium mb-1">Completed Classes</h3>
            <div className="text-4xl font-extrabold text-blue-400">{completedCount}</div>
            <div className="mt-4 flex items-center gap-2 text-sm text-blue-400/80">
              Classes marked as finished
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Recent Paid Bookings</h2>
          {paidBookings.length === 0 ? (
            <p className="text-white/50 italic">No paid bookings yet.</p>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#1a1528]">
                  <tr>
                    <th className="p-4 text-white/60 font-medium border-b border-white/10">Date</th>
                    <th className="p-4 text-white/60 font-medium border-b border-white/10">Student</th>
                    <th className="p-4 text-white/60 font-medium border-b border-white/10">Subject</th>
                    <th className="p-4 text-white/60 font-medium border-b border-white/10 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paidBookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm">{new Date(b.dateTime).toLocaleDateString()}</td>
                      <td className="p-4 font-medium">{b.studentName}</td>
                      <td className="p-4 text-sm text-white/80">{b.subject} ({b.classType})</td>
                      <td className="p-4 text-right font-bold text-green-400">LKR {Number(b.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
