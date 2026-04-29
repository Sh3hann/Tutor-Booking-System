import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { subscriptionAPI } from '../utils/api';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Lock, CheckCircle, Shield } from 'lucide-react';

export function TutorSubscribePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = (searchParams.get('plan') || 'monthly') as 'monthly' | 'annual';
  const { user } = useChatAuth();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) { navigate('/tutor/login'); return null; }

  const planLabel = plan === 'annual' ? 'Annual' : 'Monthly';
  const planPrice = plan === 'annual' ? 'LKR 20, 000' : 'LKR 3,000';
  const planPeriod = plan === 'annual' ? '/year' : '/month';
  const planFeatures = plan === 'annual'
    ? ['Profile visible to 10k+ students', 'Unlimited chat requests', 'Save LKR 20,000 vs monthly', '365-day access']
    : ['Profile visible to 10k+ students', 'Unlimited chat requests', 'Cancel anytime', '30-day access'];

  const formatCardNumber = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber.trim() || !expiry.trim() || !cvc.trim() || !name.trim()) {
      toast.error('Please fill in all card details');
      return;
    }
    const expiryParts = expiry.split('/');
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      toast.error('Invalid expiry date (MM/YY)');
      return;
    }
    setSubmitting(true);
    try {
      await subscriptionAPI.subscribe(plan);
      toast.success(`🎉 Subscribed to ${planLabel} plan! You're now visible to students.`);
      navigate('/tutor/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen   bg-white/5 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/tutor/dashboard')}
          className="flex items-center gap-2 text-white/60 text-white/70 hover:text-[#6C63FF] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Plan Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/8 border-white/6 shadow-lg sticky top-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #6C63FF, #3B82F6)' }}>
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white text-white mb-1">{planLabel} Plan</h2>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-white text-white">{planPrice}</span>
                <span className="text-white/60 text-white/50">{planPeriod}</span>
              </div>
              {plan === 'annual' && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500 font-medium">Save 50% vs monthly plan</span>
                </div>
              )}
              <ul className="space-y-3 mb-6">
                {planFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80 text-white/70">
                    <CheckCircle className="w-4 h-4 text-[#6C63FF] flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl  bg-white/5 border border-white/8 border-white/6">
                <Shield className="w-4 h-4 text-white/60 text-white/50" />
                <span className="text-xs text-white/60 text-white/50">Simulated payment — no real charge</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/8 border-white/6 shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-[#6C63FF]" />
                <h2 className="text-xl font-bold text-white text-white">Payment Details</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80 text-white/90">Name on Card</label>
                  <Input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required
                    className="h-12   border-white/10 text-white dark:placeholder:text-white/50 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80 text-white/90">Card Number</label>
                  <div className="relative">
                    <Input
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      required
                      className="h-12 pr-12   border-white/10 text-white dark:placeholder:text-white/50 rounded-xl font-mono"
                    />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 text-gray-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/80 text-white/90">Expiry (MM/YY)</label>
                    <Input
                      placeholder="12/27"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      required
                      className="h-12   border-white/10 text-white dark:placeholder:text-white/50 rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/80 text-white/90">CVC</label>
                    <Input
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      required
                      className="h-12   border-white/10 text-white dark:placeholder:text-white/50 rounded-xl font-mono"
                    />
                  </div>
                </div>

                {/* Card Preview */}
                {cardNumber && (
                  <div className="rounded-2xl p-5 relative overflow-hidden text-white"
                    style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #3B82F6 50%, #06B6D4 100%)' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-8 -translate-y-8" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-4 translate-y-4" />
                    <CreditCard className="w-8 h-8 mb-4 opacity-80" />
                    <p className="font-mono text-lg tracking-widest mb-2">
                      {cardNumber.padEnd(19, '·').match(/.{1,5}/g)?.join(' ') || cardNumber}
                    </p>
                    <div className="flex justify-between text-sm opacity-80">
                      <span>{name || 'Card Holder'}</span>
                      <span>{expiry || 'MM/YY'}</span>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="w-full h-12 rounded-xl text-base font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #6C63FF, #3B82F6)' }}>
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : `Pay ${planPrice} — Subscribe ${planLabel}`}
                </button>
              </form>

              <p className="text-center mt-4 text-xs text-white/50 text-gray-400">
                🔒 This is a simulated payment. No real charge will be made.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
