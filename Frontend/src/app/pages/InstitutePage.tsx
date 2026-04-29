import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { instituteAPI } from '../utils/api';
import { getStoredUser } from '../utils/authService';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Clock, GraduationCap, Star, Building2, Users, Settings, Shield } from 'lucide-react';

function RatingStars({ avg }: { avg: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
      ))}
    </div>
  );
}

export function InstitutePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [institute, setInstitute] = useState<any>(null);
  const [tutors, setTutors] = useState<any[]>([]);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);

  const storedUser = getStoredUser();
  const isAdmin = storedUser?.role === 'admin';

  useEffect(() => {
    if (!id) return;
    instituteAPI.getWithManagerFlag(id)
      .then(res => {
        setInstitute(res.institute);
        setTutors(res.tutors || []);
        setIsManager(res.isManager || false);
      })
      .catch(() => toast.error('Failed to load institute'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#06040f] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!institute) return (
    <div className="min-h-screen bg-[#06040f] flex items-center justify-center text-white/50">
      Institute not found.
    </div>
  );

  return (
    <div className="min-h-screen bg-[#06040f] text-white">
      {/* ── Hero Banner ── */}
      <div className="relative h-72 md:h-96 overflow-hidden bg-[#0d1a2e]">
        {institute.banner ? (
          <>
            <img src={institute.banner} alt={`${institute.name} banner`} className="absolute inset-0 w-full h-full object-cover opacity-60" />
            {/* Strong gradient so text at bottom is always readable */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 50%, rgba(6,4,15,0.97) 100%)' }} />
          </>
        ) : institute.photo ? (
          <>
            <img src={institute.photo} alt={institute.name} className="absolute inset-0 w-full h-full object-cover opacity-20 transform scale-110" style={{ filter: 'blur(30px)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(6,4,15,0.98) 100%)' }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0f0c2e,#06040f)' }} />
        )}
        {/* Extra bottom fade to page bg */}
        <div className="absolute inset-x-0 bottom-0 h-32" style={{ background: 'linear-gradient(to bottom, transparent, #06040f)' }} />

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="absolute top-5 left-5 flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm transition-all hover:-translate-x-0.5"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Settings button for manager / admin */}
        {(isManager || isAdmin) && (
          <button onClick={() => navigate(`/institute/${id}/settings`)}
            className="absolute top-5 right-5 flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,rgba(108,99,255,0.75),rgba(59,130,246,0.6))', backdropFilter: 'blur(12px)', border: '1px solid rgba(108,99,255,0.5)' }}>
            <Settings className="w-4 h-4" />
            Manage Settings
          </button>
        )}

        {/* ── Institute name block (frosted glass pill at bottom) ── */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 pt-4">
          <div className="flex items-end gap-4">
            {/* Logo badge */}
            <div className="w-18 h-18 min-w-[4.5rem] min-h-[4.5rem] rounded-2xl border-2 border-white/25 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xl"
              style={{ background: 'rgba(108,99,255,0.35)', backdropFilter: 'blur(16px)' }}>
              {institute.photo
                ? <img src={institute.photo} alt="" className="w-full h-full object-cover" />
                : <Building2 className="w-9 h-9 text-white/70" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight"
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
                  {institute.name}
                </h1>
                {institute.managerId && (
                  <span className="text-xs font-bold text-white px-3 py-1 rounded-full flex items-center gap-1 flex-shrink-0"
                    style={{ background: 'rgba(108,99,255,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(108,99,255,0.5)' }}>
                    <Shield className="w-3 h-3" /> Managed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {institute.location && (
                  <span className="flex items-center gap-1.5 text-white/90 text-sm font-medium"
                    style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
                    <MapPin className="w-4 h-4 text-[#6C63FF]" /> {institute.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-white/90 text-sm font-medium"
                  style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
                  <Users className="w-4 h-4 text-[#6C63FF]" /> {tutors.length} tutor{tutors.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-8">

          {/* ── Left: Info ── */}
          <div className="md:col-span-1 space-y-5">
            {institute.description && (
              <div className="rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h2 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#6C63FF]" /> About
                </h2>
                <p className="text-white/60 text-sm leading-relaxed">{institute.description}</p>
              </div>
            )}

            {institute.location && (
              <div className="rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h2 className="font-bold text-white mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#6C63FF]" /> Location
                </h2>
                <p className="text-white/60 text-sm">{institute.location}</p>
              </div>
            )}

            {institute.timetable && (
              <div className="rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h2 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#6C63FF]" /> Timetable
                </h2>
                <pre className="text-white/60 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {institute.timetable}
                </pre>
              </div>
            )}

            {institute.managerName && (
              <div className="rounded-2xl p-5 border border-[#6C63FF]/20"
                style={{ background: 'rgba(108,99,255,0.05)' }}>
                <h2 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#6C63FF]" /> Institute Manager
                </h2>
                <p className="text-white/60 text-sm">{institute.managerName}</p>
              </div>
            )}
          </div>

          {/* ── Right: Tutors ── */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-[#6C63FF]" />
              Tutors at {institute.name}
              <span className="text-sm font-normal text-white/40">({tutors.length})</span>
            </h2>

            {tutors.length === 0 ? (
              <div className="rounded-2xl border border-white/8 p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <GraduationCap className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">No tutors linked to this institute yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {tutors.map(tutor => (
                  <div key={tutor.id}
                    className="rounded-2xl border border-white/8 p-5 hover:-translate-y-0.5 transition-all hover:shadow-xl hover:shadow-purple-900/20 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))' }}
                    onClick={() => navigate(`/student/tutor/${tutor.id}`)}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)' }}>
                        {tutor.photoUrl
                          ? <img src={tutor.photoUrl} alt={tutor.name} className="w-full h-full object-cover" />
                          : <span className="text-white font-bold text-lg">{(tutor.name || '?')[0]}</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{tutor.name}</p>
                        {tutor.location && (
                          <p className="text-xs text-white/40 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {tutor.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <RatingStars avg={tutor.avgRating || 0} />
                      <span className="text-xs text-white/40">{(tutor.avgRating || 0).toFixed(1)} ({tutor.ratingCount || 0})</span>
                    </div>

                    {(tutor.subjects || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tutor.subjects.slice(0, 3).map((s: any, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-lg bg-[#6C63FF]/10 text-[#a099ff]">
                            {typeof s === 'object' ? s.subject : String(s)}
                          </span>
                        ))}
                        {tutor.subjects.length > 3 && (
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-white/5 text-white/40">
                            +{tutor.subjects.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {tutor.instituteTimetable && (
                      <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-[#a099ff] uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5" /> Institute Timetable
                        </div>
                        <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono leading-relaxed m-0">
                          {tutor.instituteTimetable}
                        </pre>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        {tutor.hourlyRate ? `LKR ${tutor.hourlyRate}/hr` : 'Rate not set'}
                      </span>
                      <span className="text-xs text-[#6C63FF] font-semibold">View Profile →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
