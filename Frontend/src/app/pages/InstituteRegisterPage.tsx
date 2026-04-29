import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Building2, User, Mail, Lock, Phone, Eye, EyeOff, ArrowLeft,
  CheckCircle2, ArrowRight, GraduationCap, Hash, MapPin, FileText, LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';

/* ── Helper: themed styles ───────────────────────────────────── */
function useStyles() {
  const { isDark } = useTheme();
  return {
    isDark,
    bg:        isDark ? '#000000'                : '#F2F2F7',
    card:      isDark ? '#1C1C1E'                : '#FFFFFF',
    border:    isDark ? 'rgba(84,84,88,0.50)'    : 'rgba(60,60,67,0.20)',
    label:     isDark ? 'rgba(255,255,255,0.92)' : '#1C1C1E',
    secondary: isDark ? 'rgba(235,235,245,0.60)' : 'rgba(60,60,67,0.60)',
    blue:      isDark ? '#0A84FF'                : '#007AFF',
    green:     isDark ? '#30D158'                : '#34C759',
    inputBg:   isDark ? 'rgba(44,44,46,0.80)'    : '#FFFFFF',
    shadow:    isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08)',
  };
}

const BENEFITS = [
  ['Connect with Tutors',      'Tutors can request to join your institute and appear under your brand'],
  ['Showcase Your Institute',  'Add photos, timetables, location and a full profile page'],
  ['Increase Discoverability', 'Students searching for institutes will find you first'],
  ['Manage Your Roster',       'Approve or reject tutor join requests with one click'],
];

export function InstituteRegisterPage() {
  const navigate = useNavigate();
  const s = useStyles();

  const [step, setStep]         = useState<1 | 2 | 'done'>(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const [form, setForm] = useState({
    fullName:           '',   // Manager's full name
    registrationNumber: '',   // Institute registration number (e.g. Ed/2024/001)
    email:              '',
    password:           '',
    phone:              '',
    instituteName:      '',
    location:           '',
    description:        '',
  });

  const update = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  /* ── Step 1 validation ── */
  const handleStep1 = () => {
    if (!form.fullName.trim())                { toast.error('Full name is required'); return; }
    if (!form.registrationNumber.trim())      { toast.error('Institute registration number is required'); return; }
    if (!form.email.includes('@'))            { toast.error('Valid email is required'); return; }
    if (form.password.length < 6)             { toast.error('Password must be at least 6 characters'); return; }
    setStep(2);
  };

  /* ── Step 2 submit ── */
  const handleSubmit = async () => {
    if (!form.instituteName.trim()) { toast.error('Institute name is required'); return; }
    setLoading(true);
    try {
      const host = window.location.hostname;
      const base = `http://${host}:3001/api`;

      const regRes = await fetch(`${base}/tutors/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName:           form.fullName,
          email:              form.email,
          password:           form.password,
          phone:              form.phone,
          // Institute-specific fields stored in the profile request
          isInstituteManager:       true,
          instituteRegistrationNo:  form.registrationNumber,
          instituteName:            form.instituteName,
          instituteLocation:        form.location,
          instituteDescription:     form.description,
        }),
      });
      const data = await regRes.json();
      if (!regRes.ok) throw new Error(data.error || data.message || 'Registration failed');

      toast.success('Registration submitted! Your account is pending admin review.');
      setStep('done');
    } catch (e: any) {
      toast.error(e.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared styles ── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    background: s.inputBg,
    border: `1px solid ${s.border}`,
    color: s.label,
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'border-color 0.18s, box-shadow 0.18s',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', sans-serif",
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: s.secondary,
    marginBottom: '0.5rem',
    letterSpacing: '-0.005em',
  };
  const focusIn  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = s.blue;
    e.target.style.boxShadow   = `0 0 0 3px ${s.blue}20`;
  };
  const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = s.border;
    e.target.style.boxShadow   = 'none';
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: s.bg,
        color: s.label,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', 'Inter', sans-serif",
      }}
    >
      {/* ── Navbar ── */}
      <nav style={{
        background: s.isDark ? 'rgba(0,0,0,0.85)' : 'rgba(242,242,247,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${s.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between h-[54px]">
          <Link to="/" className="flex items-center gap-2">
            <div style={{ width: 30, height: 30, borderRadius: 9, background: s.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 700, letterSpacing: '-0.02em', color: s.label, fontSize: '0.9375rem' }}>TutorHub</span>
          </Link>
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm" style={{ color: s.blue, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft style={{ width: 15, height: 15 }} /> Back to Home
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* ── LEFT: Info Panel ── */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.3rem 0.85rem', borderRadius: 9999, background: s.isDark ? 'rgba(14,165,233,0.14)' : 'rgba(0,122,255,0.08)', border: `1px solid ${s.blue}30`, fontSize: '0.8125rem', fontWeight: 600, color: s.blue, letterSpacing: '-0.01em', marginBottom: '1.25rem' }}>
              <Building2 style={{ width: 12, height: 12 }} /> Institute Manager Registration
            </div>
            <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: '1rem', color: s.label }}>
              Register Your <span style={{ color: s.blue }}>Institute</span> on TutorHub
            </h1>
            <p style={{ color: s.secondary, lineHeight: 1.7, marginBottom: '2rem', fontSize: '1rem' }}>
              Create an institute manager account and request your institute to be listed. Once admin approves, tutors can apply to join and students can discover you.
            </p>

            <div className="space-y-4">
              {BENEFITS.map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <CheckCircle2 style={{ width: 18, height: 18, color: s.green, flexShrink: 0, marginTop: 3 }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: s.label, letterSpacing: '-0.01em' }}>{title}</p>
                    <p style={{ fontSize: '0.8125rem', color: s.secondary, lineHeight: 1.5, marginTop: 2 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Step indicator */}
            {step !== 'done' && (
              <div className="flex items-center gap-3 mt-10">
                {[1, 2].map(n => (
                  <div key={n} className="flex items-center gap-2">
                    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem', background: (step as number) >= n ? s.blue : (s.isDark ? 'rgba(84,84,88,0.40)' : 'rgba(60,60,67,0.14)'), color: (step as number) >= n ? '#fff' : s.secondary, transition: 'all 0.2s' }}>
                      {(step as number) > n ? '✓' : n}
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: step === n ? s.label : s.secondary }}>
                      {n === 1 ? 'Account Details' : 'Institute Info'}
                    </span>
                    {n < 2 && <div style={{ width: 32, height: 1, background: (step as number) > n ? s.blue : s.border }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Form / Success ── */}
          <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: '1.25rem', padding: '2rem', boxShadow: s.shadow }}>

            {/* ═══ STEP 1: Account Details ═══ */}
            {step === 1 && (
              <>
                <h2 style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', color: s.label, marginBottom: '1.5rem' }}>
                  Account Details
                </h2>

                <div className="space-y-4">
                  {/* Manager Full Name */}
                  <div>
                    <label style={labelStyle}><User style={{ width: 12, height: 12, display: 'inline', marginRight: 5 }} />Manager Full Name *</label>
                    <input value={form.fullName} onChange={update('fullName')}
                      placeholder="e.g. Roshan Perera"
                      style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </div>

                  {/* Registration Number */}
                  <div>
                    <label style={labelStyle}><Hash style={{ width: 12, height: 12, display: 'inline', marginRight: 5 }} />Institute Registration Number *</label>
                    <input value={form.registrationNumber} onChange={update('registrationNumber')}
                      placeholder="e.g. Ed/2024/001 or MOE-12345"
                      style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    <p style={{ fontSize: '0.75rem', color: s.secondary, marginTop: 4 }}>
                      Official registration / NIC number issued by the Ministry of Education or your local authority.
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label style={labelStyle}><Mail style={{ width: 12, height: 12, display: 'inline', marginRight: 5 }} />Email Address *</label>
                    <input type="email" value={form.email} onChange={update('email')}
                      placeholder="you@example.com"
                      style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={labelStyle}><Phone style={{ width: 12, height: 12, display: 'inline', marginRight: 5 }} />Phone (optional)</label>
                    <input type="tel" value={form.phone} onChange={update('phone')}
                      placeholder="+94 77 123 4567"
                      style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={labelStyle}><Lock style={{ width: 12, height: 12, display: 'inline', marginRight: 5 }} />Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={form.password} onChange={update('password')}
                        placeholder="Min. 6 characters"
                        style={{ ...inputStyle, paddingRight: '2.75rem' }}
                        onFocus={focusIn} onBlur={focusOut}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: s.secondary, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStep1}
                  style={{ marginTop: '1.75rem', width: '100%', padding: '0.8rem', borderRadius: '0.875rem', background: s.blue, color: '#fff', fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.01em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 16px ${s.blue}44`, transition: 'opacity 0.18s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  Continue <ArrowRight style={{ width: 15, height: 15 }} />
                </button>

                <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8125rem', color: s.secondary }}>
                  Already registered?{' '}
                  <Link to="/institute/login" style={{ color: s.blue, fontWeight: 600 }}>
                    Institute Manager Sign In
                  </Link>
                </p>
              </>
            )}

            {/* ═══ STEP 2: Institute Info ═══ */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 4, color: s.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', padding: 0 }}>
                    <ArrowLeft style={{ width: 15, height: 15 }} /> Back
                  </button>
                  <h2 style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', color: s.label }}>
                    Institute Details
                  </h2>
                </div>

                {/* Info banner */}
                <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: s.isDark ? 'rgba(14,165,233,0.10)' : 'rgba(0,122,255,0.06)', border: `1px solid ${s.blue}25`, marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.8125rem', color: s.blue, lineHeight: 1.55 }}>
                    ℹ️ Your institute details will be reviewed by the admin. Once approved, your institute page will go live and tutors can join.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Institute Name */}
                  <div>
                    <label style={labelStyle}><Building2 style={{ width: 12, height: 12, display: 'inline', marginRight: 5 }} />Institute Name *</label>
                    <input value={form.instituteName} onChange={update('instituteName')}
                      placeholder="e.g. Royal Educational Institute"
                      style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </div>

                  {/* Location */}
                  <div>
                    <label style={labelStyle}><MapPin style={{ width: 12, height: 12, display: 'inline', marginRight: 5 }} />Location</label>
                    <input value={form.location} onChange={update('location')}
                      placeholder="e.g. 42 Colombo Road, Gampaha"
                      style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </div>

                  {/* Description */}
                  <div>
                    <label style={labelStyle}><FileText style={{ width: 12, height: 12, display: 'inline', marginRight: 5 }} />Description</label>
                    <textarea
                      value={form.description}
                      onChange={update('description')}
                      rows={4}
                      placeholder="Tell students about your institute, teaching philosophy, subjects offered..."
                      style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                      onFocus={focusIn} onBlur={focusOut}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ marginTop: '1.75rem', width: '100%', padding: '0.8rem', borderRadius: '0.875rem', background: s.green, color: '#fff', fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.01em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 16px ${s.green}44`, opacity: loading ? 0.6 : 1, transition: 'opacity 0.18s' }}>
                  {loading ? 'Submitting…' : <><CheckCircle2 style={{ width: 15, height: 15 }} /> Submit Registration</>}
                </button>
              </>
            )}

            {/* ═══ DONE: Success screen ═══ */}
            {step === 'done' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: s.isDark ? 'rgba(48,209,88,0.15)' : 'rgba(52,199,89,0.12)', border: `2px solid ${s.green}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <CheckCircle2 style={{ width: 36, height: 36, color: s.green }} />
                </div>

                <h2 style={{ fontWeight: 700, fontSize: '1.375rem', letterSpacing: '-0.02em', color: s.label, marginBottom: '0.75rem' }}>
                  Registration Submitted!
                </h2>
                <p style={{ color: s.secondary, lineHeight: 1.6, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Your account has been created and your institute registration request has been sent to the admin for review.
                </p>
                <p style={{ color: s.secondary, lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.875rem' }}>
                  Once approved, you'll be able to log in as an institute manager and manage your institute's profile, tutors, and more.
                </p>

                {/* What's next */}
                <div style={{ padding: '1rem', borderRadius: '0.875rem', background: s.isDark ? 'rgba(14,165,233,0.10)' : 'rgba(0,122,255,0.06)', border: `1px solid ${s.blue}25`, marginBottom: '1.5rem', textAlign: 'left' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: s.blue, marginBottom: '0.5rem' }}>What happens next?</p>
                  <ul style={{ fontSize: '0.8125rem', color: s.secondary, lineHeight: 1.7, paddingLeft: '1rem', margin: 0 }}>
                    <li>Admin reviews your registration &amp; institute details</li>
                    <li>Your institute page will be created &amp; set live</li>
                    <li>You can then log in and manage your institute</li>
                    <li>Tutors can request to join your institute</li>
                  </ul>
                </div>

                {/* Sign In button */}
                <button
                  onClick={() => navigate('/institute/login')}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '0.875rem', background: s.blue, color: '#fff', fontWeight: 700, fontSize: '0.9375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 16px ${s.blue}44`, transition: 'opacity 0.18s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  <LogIn style={{ width: 15, height: 15 }} /> Sign In as Institute Manager
                </button>

                <p style={{ marginTop: '0.875rem', fontSize: '0.8125rem', color: s.secondary }}>
                  You'll need admin approval before your first login is active.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
