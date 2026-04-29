import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { getTutorDetails, type TutorSearchResult } from '../utils/studentSearchApi';
import { chatApi } from '../utils/chatApi';
import { bookingAPI } from '../utils/api';
import { toast } from 'sonner';
import { ArrowLeft, GraduationCap, Star, Video, MapPin, Phone, Clock, MessageSquare, CheckCircle, CalendarDays, X } from 'lucide-react';

interface TutorDetail extends TutorSearchResult {
  reviews?: { id: string; rating: number; comment: string; createdAt: string; studentName: string | null }[];
}

function RatingStars({ avgRating, ratingCount }: { avgRating: number; ratingCount: number }) {
  const full = Math.floor(avgRating);
  const empty = 5 - full;
  return (
    <div className="flex items-center gap-1">
      {[...Array(full)].map((_, i) => <Star key={`f-${i}`} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
      {[...Array(empty)].map((_, i) => <Star key={`e-${i}`} className="w-4 h-4 text-white/70 text-gray-300" />)}
      <span className="ml-1 text-sm text-white/60 text-white/70">{avgRating.toFixed(1)} ({ratingCount} reviews)</span>
    </div>
  );
}

function getVideoEmbedUrl(url: string): string {
  if (!url) return '';
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

export function TutorPublicProfile() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState<TutorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'success' | 'loading'>('idle');
  const [bookingForm, setBookingForm] = useState({
    subject: '', date: '', time: ''
  });
  const [bookingDateError, setBookingDateError] = useState<string>('');

  const todayMin = (() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10); // YYYY-MM-DD
  })();

  const validateBookingDate = (value: string) => {
    if (!value) {
      setBookingDateError('');
      return true;
    }
    if (value < todayMin) {
      setBookingDateError('Booking date cannot be earlier than today');
      return false;
    }
    setBookingDateError('');
    return true;
  };

  useEffect(() => {
    const load = async () => {
      if (!tutorId) { navigate('/student/search'); return; }
      setLoading(true);
      try {
        const detail = await getTutorDetails(tutorId);
        setTutor(detail as TutorDetail);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load profile');
        navigate('/student/search');
      } finally { setLoading(false); }
    };
    load();
  }, [tutorId, navigate]);

  const handleBookClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.date || !bookingForm.time || !bookingForm.subject) {
      toast.error('Please fill in Date, Time, and Subject.'); 
      return; 
    }
    if (!validateBookingDate(bookingForm.date)) {
      toast.error('Booking date cannot be earlier than today');
      return;
    }
    
    setBookingStatus('loading');
    try {
      const dateTimeString = `${bookingForm.date}T${bookingForm.time}:00`;
      await bookingAPI.create({
        tutorId: tutorId!,
        subject: bookingForm.subject,
        classType: 'Individual',
        classFormat: 'Online',
        dateTime: dateTimeString,
        price: tutor?.hourlyRate || 0
      });
      setBookingStatus('success');
      toast.success('Wait for the tutor to accept. Check "My Bookings" in your dashboard.');
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingStatus('idle');
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send booking request.');
      setBookingStatus('idle');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen   bg-white/5 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#0EA5E9] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!tutor) return null;

  const videoEmbedUrl = tutor.introVideoUrl ? getVideoEmbedUrl(tutor.introVideoUrl) : '';

  return (
    <div className="min-h-screen   bg-white/5">
      {/* Back Nav */}
      <div className="sticky top-0 z-10 bg-[#06040f]/90 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3 max-w-5xl">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/5 text-white/70 hover:scale-110 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-white/50 text-sm">Back</span>
          <span className="text-white/70">/</span>
          <span className="text-white text-sm font-medium">{tutor.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Hero */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/8 border-white/6 shadow-sm">
              <div className="flex items-start gap-5">
                <div className="w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', border: '3px solid rgba(56,189,248,0.35)' }}>
                  {tutor.photoUrl ? (
                    <img src={tutor.photoUrl} alt={tutor.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-3xl font-bold text-white">{tutor.name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-white text-white mb-1">{tutor.name}</h1>
                  {tutor.institute && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-white/5 border border-white/10 w-fit">
                      {tutor.institute.photo ? (
                        <img src={tutor.institute.photo} alt={tutor.institute.name} className="w-6 h-6 rounded-md object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-[#0EA5E9]/20 flex items-center justify-center text-[10px] font-bold text-[#0EA5E9]">
                          {tutor.institute.name[0]}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-white/90">{tutor.institute.name}</span>
                    </div>
                  )}
                  {tutor.location && (
                    <div className="flex items-center gap-1 mb-2">
                      <MapPin className="w-4 h-4 text-white/60 text-white/50" />
                      <span className="text-sm text-white/60 text-white/50">{tutor.location}</span>
                    </div>
                  )}
                  <RatingStars avgRating={tutor.avgRating ?? 0} ratingCount={tutor.ratingCount ?? 0} />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tutor.hourlyRate && tutor.hourlyRate > 0 && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold dark:bg-[#0EA5E9]/20 bg-[#0EA5E9]/10 dark:text-[#38BDF8] text-[#0EA5E9]">
                        LKR {tutor.hourlyRate}/hr
                      </span>
                    )}
                    {videoEmbedUrl && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold dark:bg-pink-500/10 bg-pink-50 dark:text-pink-400 text-pink-600 flex items-center gap-1">
                        <Video className="w-3 h-3" /> Teaching Video
                      </span>
                    )}
                    {(tutor.classTypes || []).map((c) => (
                      <span key={c} className="px-3 py-1 rounded-full text-sm  bg-white/8 text-white/80 text-white/70">{c}</span>
                    ))}
                    {(tutor.classFormats || []).map((c) => (
                      <span key={c} className="px-3 py-1 rounded-full text-sm  bg-white/8 text-white/80 text-white/70">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
              {tutor.bio && (
                <div className="mt-5 pt-5 border-t border-white/8 border-white/6">
                  <h3 className="font-semibold text-white text-white mb-2">About</h3>
                  <p className="text-sm text-white/80 text-white/70 whitespace-pre-line leading-relaxed">{tutor.bio}</p>
                </div>
              )}
            </div>

            {/* Teaching Video */}
            {videoEmbedUrl && (
              <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/8 border-white/6 shadow-sm">
                <h3 className="font-semibold text-white text-white mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-pink-500" /> Teaching Demo Video
                </h3>
                <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                  <iframe src={videoEmbedUrl} title="Tutor teaching video" className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              </div>
            )}

            {/* Subjects */}
            {tutor.subjects && tutor.subjects.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/8 border-white/6 shadow-sm">
                <h3 className="font-semibold text-white text-white mb-4">Subjects & Mediums</h3>
                <div className="flex flex-wrap gap-2">
                  {tutor.subjects.filter((subj: any, index: number, self: any[]) => 
                    index === self.findIndex((t) => (
                      (typeof t === 'object' ? t.subject : t) === (typeof subj === 'object' ? subj.subject : subj)
                    ))
                  ).map((subj: any, idx: number) => (
                    <span key={idx} className="px-3 py-2 rounded-xl text-sm font-medium  bg-[#0EA5E9]/5 dark:text-[#38BDF8] text-[#0EA5E9] border dark:border-[#0EA5E9]/20 border-[#0EA5E9]/10">
                      {typeof subj === 'object' && subj?.subject
                        ? `${subj.subject}${(subj.mediums || []).length ? ` (${(subj.mediums || []).join(', ')})` : ''}`
                        : String(subj)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timetable */}
            {tutor.timetable && (
              <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/8 border-white/6 shadow-sm">
                <h3 className="font-semibold text-white text-white mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#0EA5E9]" /> Available Time Slots
                </h3>
                <p className="text-sm text-white/80 text-white/70 whitespace-pre-line">{tutor.timetable}</p>
              </div>
            )}

            {/* Qualifications */}
            {Array.isArray(tutor.qualifications) && tutor.qualifications.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/8 border-white/6 shadow-sm">
                <h3 className="font-semibold text-white text-white mb-4">Qualifications</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {tutor.qualifications.map((q: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3   bg-white/5 rounded-xl border border-white/8 border-white/6">
                      {q.photo && <img src={q.photo} alt={q.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                      <p className="text-sm font-medium text-white text-white">{q.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {Array.isArray(tutor.reviews) && tutor.reviews.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/8 border-white/6 shadow-sm">
                <h3 className="font-semibold text-white text-white mb-4">Student Reviews</h3>
                <div className="space-y-4">
                  {tutor.reviews.map((r) => (
                    <div key={r.id} className="pb-4 border-b border-white/8 border-white/6 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold">
                            {(r.studentName || 'S')[0]}
                          </div>
                          <span className="font-semibold text-sm text-white text-white">{r.studentName || 'Student'}</span>
                          <div className="flex gap-0.5">
                            {[...Array(r.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                          </div>
                        </div>
                        <span className="text-xs text-white/50 text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      {r.comment && <p className="text-sm text-white/80 text-white/70">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Chat CTA */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/8 border-white/6 shadow-sm sticky top-20">
              <h3 className="font-semibold text-white text-white mb-4">Connect with {tutor.name.split(' ')[0]}</h3>
              {tutor.contactPhone && (
                <div className="flex items-center gap-2 mb-4 text-sm text-white/60 text-white/50">
                  <Phone className="w-4 h-4" /> {tutor.contactPhone}
                </div>
              )}
              <button onClick={() => navigate(`/student/chat/${tutorId}`)}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:-translate-y-0.5 shadow-lg flex items-center justify-center gap-2 mb-3"
                style={{ background: 'linear-gradient(135deg, #0EA5E9, #3B82F6)' }}>
                <MessageSquare className="w-4 h-4" /> Send a Message
              </button>

              {/* Book a Class CTA */}
              <div className="pt-4 border-t border-white/8 border-white/6">
                <h4 className="font-medium text-white text-white mb-3 text-sm">📅 Book a Class</h4>
                <button onClick={() => setShowBookingModal(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold dark:bg-green-500/20 bg-green-500/10 dark:text-green-400 text-green-600 hover:scale-105 transition-transform border border-green-500/20">
                  <CalendarDays className="w-4 h-4 inline mr-2" /> Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-[#1a1528] rounded-3xl w-full max-w-md border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#0EA5E9]" /> Book {tutor.name.split(' ')[0]}
              </h2>
              <button onClick={() => setShowBookingModal(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            {bookingStatus === 'success' ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Booking Requested!</h3>
                <p className="text-white/60 mb-6">The tutor will review your request. Navigate to 'My Bookings' in your dashboard to check the status and pay.</p>
                <button onClick={() => navigate('/student/dashboard')} className="px-6 py-2 rounded-xl bg-white/10 text-white font-semibold">Go to Dashboard</button>
              </div>
            ) : (
              <form onSubmit={handleBookClass} className="p-6 space-y-4">
                <div>
                  <Label className="text-white/80">Subject</Label>
                  <select required value={bookingForm.subject} onChange={e => setBookingForm({...bookingForm, subject: e.target.value})}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-[#0EA5E9] [color-scheme:dark]">
                    <option value="" disabled className="bg-[#1a1528]">Select Subject</option>
                    {(tutor.subjects || []).map((s: any, i: number) => {
                      const name = typeof s === 'object' ? s.subject : s;
                      return <option key={i} value={name} className="bg-[#1a1528]">{name}</option>
                    })}
                  </select>
                </div>
                <div>
                  <Label className="text-white/80">Subject ID</Label>
                  <textarea required value={bookingForm.subjectId} onChange={e => setBookingForm({...bookingForm, subjectId: e.target.value})}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-[#0EA5E9] [color-scheme:dark]" placeholder="E.g. Chapter 5 of Grade 10 Math textbook, or past paper questions you want help with" />

                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/80">Date</Label>
                    <input
                      type="date"
                      required
                      min={todayMin}
                      value={bookingForm.date}
                      onChange={e => {
                        const v = e.target.value;
                        setBookingForm({ ...bookingForm, date: v });
                        validateBookingDate(v);
                        if (v && v < todayMin) toast.error('Booking date cannot be earlier than today');
                      }}
                      className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-[#0EA5E9] [color-scheme:dark]" />
                    {bookingDateError && <p className="mt-1 text-xs text-red-400">{bookingDateError}</p>}
                  </div>
                  <div>
                    <Label className="text-white/80">Start Time</Label>
                    <input type="time" required value={bookingForm.time} onChange={e => setBookingForm({...bookingForm, time: e.target.value})}
                      className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-[#0EA5E9] [color-scheme:dark]" />
                  </div>
                </div>
                {/* Online only notice */}
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                  <Video className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <p className="text-sm text-blue-300">Online Individual class · 1 hour session · Meeting link provided after payment</p>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <span className="text-white/60">Estimated Cost</span>
                    <span className="font-bold text-lg text-[#0EA5E9]">LKR {tutor.hourlyRate || 0}/hr</span>
                  </div>
                  <button type="submit" disabled={bookingStatus === 'loading'}
                    className="w-full py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #0EA5E9, #3B82F6)', color: 'white' }}>
                    {bookingStatus === 'loading' ? 'Sending Request...' : 'Confirm Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

