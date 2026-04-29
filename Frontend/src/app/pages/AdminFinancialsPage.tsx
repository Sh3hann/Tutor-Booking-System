import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { adminAPI } from '../utils/api';
import { toast } from 'sonner';
import { ArrowLeft, TrendingUp, PieChart, Activity, Trash2 } from 'lucide-react';

export function AdminFinancialsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await adminAPI.getFinancials();
      setData(res);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load financials');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription payment history?')) return;
    try {
      await adminAPI.deleteSubscriptionPayment(id);
      toast.success('Subscription payment history deleted');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking payment history?')) return;
    try {
      await adminAPI.deleteBookingPayment(id);
      toast.success('Booking payment history deleted');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white/5 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { revenue, stats } = data || { 
    revenue: { bookings: 0, subscriptions: 0, total: 0 }, 
    stats: { totalPaidBookings: 0, totalPaidSubscriptions: 0 } 
  };

  return (
    <div className="min-h-screen bg-[#06040f] p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 mb-6 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <PieChart className="w-8 h-8 text-[#6c63ff]" /> Platform Revenue
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Total Revenue */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden col-span-1 md:col-span-3 lg:col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6c63ff]/20 rounded-full blur-3xl -mt-10 -mr-10" />
            <h3 className="text-white/60 font-medium mb-1">Total Gross Revenue</h3>
            <div className="text-4xl font-extrabold text-[#6c63ff]">LKR {revenue.total.toLocaleString()}</div>
            <div className="mt-4 flex items-center gap-2 text-sm text-[#6c63ff]/80">
              <TrendingUp className="w-4 h-4" /> Overall platform income
            </div>
          </div>
          
          {/* Subscriptions */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mt-10 -mr-10" />
            <h3 className="text-white/60 font-medium mb-1">Subscriptions (Tutors)</h3>
            <div className="text-3xl font-bold text-purple-400 mb-2">LKR {revenue.subscriptions.toLocaleString()}</div>
            <div className="text-sm text-white/50">Active Paid Plans: <span className="text-white">{stats.totalPaidSubscriptions}</span></div>
          </div>

          {/* Bookings */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mt-10 -mr-10" />
            <h3 className="text-white/60 font-medium mb-1">Booking Fees (10%)</h3>
            <div className="text-3xl font-bold text-green-400 mb-2">LKR {revenue.bookings.toLocaleString()}</div>
            <div className="text-sm text-white/50">Paid Bookings: <span className="text-white">{stats.totalPaidBookings}</span></div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" /> Platform Financial Health
            </h3>
            <p className="text-white/60 max-w-lg">
              The platform generates revenue through a 10% service charge on all successful bookings and fixed subscription fees from registered tutors.
            </p>
          </div>
          <div className="w-24 h-24 rounded-full border-8 border-white/5 border-l-[#6c63ff] border-t-purple-500 flex items-center justify-center">
            <span className="font-bold text-sm">Active</span>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="mt-12 space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" /> Subscription Payments
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-white/60 text-sm">
                  <tr>
                    <th className="p-4 rounded-tl-xl">Date</th>
                    <th className="p-4">Tutor</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Amount (LKR)</th>
                    <th className="p-4 rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data?.subscriptionHistory && data.subscriptionHistory.length > 0 ? (
                    data.subscriptionHistory.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-white/80">{new Date(sub.date).toLocaleDateString()}</td>
                        <td className="p-4 font-medium">{sub.tutorName}</td>
                        <td className="p-4 capitalize">{sub.plan}</td>
                        <td className="p-4 text-purple-400 font-medium">+{sub.amount.toLocaleString()}</td>
                        <td className="p-4">
                          <button onClick={() => handleDeleteSubscription(sub.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="p-8 text-center text-white/40">No subscription history found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" /> Student Booking Payments
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-white/60 text-sm">
                  <tr>
                    <th className="p-4 rounded-tl-xl">Date</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Tutor</th>
                    <th className="p-4">Service Charge (10%)</th>
                    <th className="p-4 rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data?.bookingHistory && data.bookingHistory.length > 0 ? (
                    data.bookingHistory.map((booking: any) => (
                      <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-white/80">{new Date(booking.date).toLocaleDateString()}</td>
                        <td className="p-4 font-medium">{booking.studentName}</td>
                        <td className="p-4 text-white/80">{booking.tutorName}</td>
                        <td className="p-4 text-green-400 font-medium">+{booking.amount.toLocaleString()}</td>
                        <td className="p-4">
                          <button onClick={() => handleDeleteBooking(booking.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="p-8 text-center text-white/40">No booking history found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
