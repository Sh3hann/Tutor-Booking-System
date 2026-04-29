import { useNavigate } from 'react-router';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { subscriptionAPI } from '../utils/api';
import { toast } from 'sonner';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

export function TutorPlansPage() {
  const navigate = useNavigate();
  const { user } = useChatAuth();
  const [acceptingTrial, setAcceptingTrial] = useState(false);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  useEffect(() => {
    if (user) {
      subscriptionAPI.getSubscription(user.id).then(res => {
        setHasActiveSub(!!res?.subscription?.active);
      }).catch(() => {});
    }
  }, [user]);

  const handleAcceptTrial = async () => {
    setAcceptingTrial(true);
    try {
      await subscriptionAPI.acceptTrial();
      toast.success('Free trial started! Your profile is now visible to students.');
      navigate('/tutor/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start free trial');
    } finally {
      setAcceptingTrial(false);
    }
  };

  return (
    <div className="min-h-screen   bg-white/5 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/tutor/dashboard')}
          className="flex items-center gap-2 text-white/60 text-white/70 hover:text-[#6C63FF] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white text-white mb-4">Choose a Plan</h1>
          <p className="text-lg text-white/60 text-white/50 max-w-2xl mx-auto">
            Get visible to students, receive chat requests, and grow your tutoring business.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Trial */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border-2 dark:border-green-500/30 border-green-200 shadow-xl relative transform hover:-translate-y-2 transition-transform">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-sm font-bold bg-green-500 text-white">
              RECOMMENDED
            </div>
            <h3 className="text-2xl font-bold text-white text-white mb-2 mt-4">Free Trial</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-green-500">LKR 0</span>
            </div>
            <p className="text-sm text-white/60 text-white/50 mb-6 pb-6 border-b border-white/10 border-white/6">
              30 days • No card needed
            </p>
            <ul className="space-y-4 mb-8">
              {['Profile visible to students', 'Receive chat requests', 'Full access for 30 days'].map(f => (
                <li key={f} className="flex items-start gap-3 text-sm text-white/80 text-white/70">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <button onClick={handleAcceptTrial} disabled={acceptingTrial || hasActiveSub}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              {hasActiveSub ? 'Already Active' : acceptingTrial ? 'Starting...' : 'Start Free Trial'}
            </button>
          </div>

          {/* Monthly */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/8 border-white/6 shadow-xl relative transform hover:-translate-y-2 transition-transform">
            <h3 className="text-2xl font-bold text-white text-white mb-2 mt-4">Monthly</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-white text-white">LKR 3,000</span>
              <span className="text-white/60 text-white/50">/mo</span>
            </div>
            <p className="text-sm text-white/60 text-white/50 mb-6 pb-6 border-b border-white/10 border-white/6">
              Cancel anytime
            </p>
            <ul className="space-y-4 mb-8">
              {['Profile visible to 10k+ students', 'Unlimited student messages', 'Cancel anytime'].map(f => (
                <li key={f} className="flex items-start gap-3 text-sm text-white/80 text-white/70">
                  <CheckCircle className="w-5 h-5 text-[#6C63FF] flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/tutor/subscribe?plan=monthly')}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #3B82F6)' }}>
              Subscribe Monthly
            </button>
          </div>

          {/* Annual */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border-2 dark:border-[#6C63FF]/50 border-[#6C63FF]/50 shadow-xl relative transform hover:-translate-y-2 transition-transform overflow-visible">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-sm font-bold text-white"
                 style={{ background: 'linear-gradient(135deg, #7C3AED, #6C63FF)' }}>
              SAVE 50%
            </div>
            <h3 className="text-2xl font-bold text-white text-white mb-2 mt-4">Annual</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-white text-white">LKR 18,000</span>
              <span className="text-white/60 text-white/50">/yr</span>
            </div>
            <p className="text-sm text-white/60 text-white/50 mb-6 pb-6 border-b border-white/10 border-white/6">
              Only LKR 1,500/mo
            </p>
            <ul className="space-y-4 mb-8">
              {['Profile visible to 10k+ students', 'Unlimited student messages', 'Save LKR 18,000 vs monthly', 'Priority support'].map(f => (
                <li key={f} className="flex items-start gap-3 text-sm text-white/80 text-white/70">
                  <CheckCircle className="w-5 h-5 text-[#6C63FF] flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/tutor/subscribe?plan=annual')}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-lg shadow-[#6C63FF]/25"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6C63FF)' }}>
              Subscribe Annual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
