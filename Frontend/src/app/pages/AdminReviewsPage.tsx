import { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import { toast } from 'sonner';
import { Link } from 'react-router';
import { Star, MessageSquare, Trash2, CalendarDays, ArrowLeft } from 'lucide-react';

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getReviews();
      setReviews(res.reviews || []);
    } catch (err: any) {
      toast.error('Failed to load reviews');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    try {
      await adminAPI.deleteReview(id);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err: any) {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-[#2A2A3E] pb-4">
          <Link to="/admin/dashboard"
            className="p-2.5 rounded-xl transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#9999CC' }}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Star className="w-5 h-5" style={{ color: '#F59E0B' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Review Management</h1>
              <p className="text-sm" style={{ color: '#8888AA' }}>
                Monitor ratings and moderate negative or inappropriate feedback.
              </p>
            </div>
          </div>
        </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: '#444466' }} />
          <p style={{ color: '#8888AA' }}>No reviews found across the platform.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((r, i) => (
            <div key={r.id || i} className="p-5 flex flex-col sm:flex-row gap-5 rounded-2xl transition-all hover:bg-white/5 backdrop-blur-lg"
                 style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.05)' }}>
              
              {/* Rating & Identity */}
              <div className="sm:w-64 flex-shrink-0 space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4" 
                          fill={s <= (r.rating || 0) ? '#F59E0B' : 'transparent'} 
                          color={s <= (r.rating || 0) ? '#F59E0B' : '#444466'} />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">To: <span style={{color: '#6C63FF'}}>{r.tutorName}</span></p>
                  <p className="text-xs" style={{ color: '#666688' }}>From: {r.studentName}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: '#555577' }}>
                  <CalendarDays className="w-3.5 h-3.5" />
                  {new Date(r.createdAt || new Date()).toLocaleDateString([], { 
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>

              {/* Review Content */}
              <div className="flex-1">
                <p className="text-sm text-gray-200 leading-relaxed italic border-l-2 pl-4 py-1"
                   style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  "{r.comment || 'No comment provided.'}"
                </p>
              </div>

              {/* Action */}
              <div className="flex flex-col items-end justify-start sm:w-24">
                <button
                  onClick={() => handleDelete(r.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:-translate-y-0.5 transition-all"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
