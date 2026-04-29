/**
 * SearchTutors - Student filtering UI with dark mode, video badge, and redesigned cards.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { searchTutors, submitReview, type TutorSearchResult } from '../utils/studentSearchApi';
import { toast } from 'sonner';
import { getEffectiveCategories, getEffectiveSubjectsByCategory } from '../data/subjectsStore';
import { MEDIUMS, CLASS_TYPES, CLASS_FORMATS } from '../data/subjects';
import { ArrowLeft, MessageSquare, GraduationCap, Star, Search, Video, MapPin, Filter, X, Building2 } from 'lucide-react';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { instituteAPI } from '../utils/api';

function formatHourlyRate(tutor: TutorSearchResult): string {
  const raw = tutor.hourlyRate ?? (tutor as any).rate ?? (tutor as any).pricePerHour ?? (tutor as any).price;
  const n = Number(raw);
  if (raw == null || raw === '' || Number.isNaN(n) || n <= 0) return 'Rate not set';
  return `LKR ${n}/hr`;
}

function RatingStars({ avgRating, size = 'md' }: { avgRating: number; size?: 'sm' | 'md' }) {
  const full = Math.floor(avgRating);
  const empty = 5 - full;
  const cls = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(full)].map((_, i) => <Star key={`f-${i}`} className={`${cls} fill-amber-400 text-amber-400`} />)}
      {[...Array(empty)].map((_, i) => <Star key={`e-${i}`} className={`${cls} text-white/70 text-gray-300`} />)}
    </div>
  );
}

export function SearchTutors() {
  const navigate = useNavigate();
  const { user } = useChatAuth();
  const [category, setCategory] = useState('all');
  const [subject, setSubject] = useState('all');
  const [medium, setMedium] = useState('all');
  const [classType, setClassType] = useState('all');
  const [classFormat, setClassFormat] = useState('all');
  const [tutors, setTutors] = useState<TutorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [ratingModal, setRatingModal] = useState<{ tutor: TutorSearchResult } | null>(null);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [minRating, setMinRating] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState<TutorSearchResult | null>(null);
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<string>('all'); // 'all' | 'none' | institute.id

  const subjectsByCategory = getEffectiveSubjectsByCategory();
  const categories = getEffectiveCategories();
  const availableSubjects = (category && category !== 'all') ? subjectsByCategory[category] || [] : [];

  // Load institutes for filter chips
  useEffect(() => {
    instituteAPI.list().then(res => setInstitutes(res.institutes || [])).catch(() => {});
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const p = (v: string) => v === 'all' ? '' : v;
      const params = { category: p(category), subject: p(subject), medium: p(medium), classType: p(classType), classFormat: p(classFormat) };
      const result = await searchTutors(params);
      let foundTutors = result.tutors || [];
      const minR = parseFloat(minRating);
      if (!isNaN(minR) && minR > 0) foundTutors = foundTutors.filter((t) => (t.avgRating ?? 0) >= minR);
      setTutors(foundTutors);
    } catch (err: any) {
      toast.error(err.message || 'Search failed');
    } finally { setLoading(false); }
  };

  const handleClearFilters = () => {
    setCategory('all'); setSubject('all'); setMedium('all'); setClassType('all'); setClassFormat('all'); setMinRating('all');
    setSelectedInstitute('all');
    setTutors([]); setSearched(false);
  };

  const openRatingModal = (tutor: TutorSearchResult) => {
    if (!user) { toast.error('Please log in to rate a tutor'); return; }
    if ((user.role || '').toLowerCase() !== 'student') { toast.error('Only students can rate tutors'); return; }
    setRatingModal({ tutor });
    setRatingStars(0);
    setRatingComment('');
  };

  const handleSubmitRating = async () => {
    if (!ratingModal || ratingStars < 1 || ratingStars > 5) { toast.error('Please select 1–5 stars'); return; }
    setSubmittingRating(true);
    try {
      await submitReview(ratingModal.tutor.id, ratingStars, ratingComment);
      toast.success('Review submitted! Thank you ⭐');
      setRatingModal(null);
      await handleSearch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally { setSubmittingRating(false); }
  };

  const hasActiveFilters = category !== 'all' || subject !== 'all' || medium !== 'all' || classType !== 'all' || classFormat !== 'all' || minRating !== 'all' || selectedInstitute !== 'all';

  // Filter tutors by selected institute on the client side
  const displayedTutors = selectedInstitute === 'all'
    ? tutors
    : selectedInstitute === 'none'
      ? tutors.filter(t => !t.instituteId || t.instituteId === 'none')
      : tutors.filter(t => t.instituteId === selectedInstitute);

  return (
    <div className="min-h-screen page-enter">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-header">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4 max-w-6xl">
          <button onClick={() => navigate('/student/dashboard')}
            className="p-2 rounded-xl  bg-white/8 text-white/60 text-white/70 hover:scale-110 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#6C63FF]" />
            <h1 className="font-bold text-white text-white">Find a Tutor</h1>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${showFilters ? 'bg-[#6C63FF] text-white' : ' bg-white/8 text-white/60 text-white/70'}`}>
            <Filter className="w-4 h-4" /> Filters {hasActiveFilters && <span className="w-2 h-2 bg-green-400 rounded-full" />}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/8 border-white/6 shadow-sm mb-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-white">Filter Options</h3>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-400">
                  <X className="w-4 h-4" /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60 text-white/50 uppercase tracking-wide">Category</label>
                <Select value={category} onValueChange={(v) => { setCategory(v); setSubject('all'); }}>
                  <SelectTrigger className="  border-white/10 text-white rounded-xl">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60 text-white/50 uppercase tracking-wide">Subject</label>
                <Select value={subject} onValueChange={setSubject} disabled={category === 'all' || availableSubjects.length === 0}>
                  <SelectTrigger className="  border-white/10 text-white rounded-xl">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {availableSubjects.map((s) => <SelectItem key={String(s)} value={String(s)}>{String(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60 text-white/50 uppercase tracking-wide">Medium</label>
                <Select value={medium} onValueChange={setMedium}>
                  <SelectTrigger className="  border-white/10 text-white rounded-xl">
                    <SelectValue placeholder="All mediums" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All mediums</SelectItem>
                    {MEDIUMS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60 text-white/50 uppercase tracking-wide">Class Type</label>
                <Select value={classType} onValueChange={setClassType}>
                  <SelectTrigger className="  border-white/10 text-white rounded-xl">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {CLASS_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60 text-white/50 uppercase tracking-wide">Format</label>
                <Select value={classFormat} onValueChange={setClassFormat}>
                  <SelectTrigger className="  border-white/10 text-white rounded-xl">
                    <SelectValue placeholder="All formats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All formats</SelectItem>
                    {CLASS_FORMATS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60 text-white/50 uppercase tracking-wide">Min Rating</label>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="  border-white/10 text-white rounded-xl">
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any rating</SelectItem>
                    {[4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n}+ stars</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Institute Filter Chips */}

        {institutes.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Filter by Institute</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedInstitute('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  selectedInstitute === 'all' ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}>
                All
              </button>
              <button
                onClick={() => setSelectedInstitute('none')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  selectedInstitute === 'none' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}>
                Independent
              </button>
              {institutes.map(inst => (
                <button key={inst.id}
                  onClick={() => setSelectedInstitute(inst.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    selectedInstitute === inst.id ? 'bg-[#6C63FF] text-white shadow-lg shadow-purple-900/30' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}>
                  <Building2 className="w-3.5 h-3.5" />
                  {inst.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Button */}
        <div className="flex gap-3 mb-8">
          <button onClick={handleSearch} disabled={loading}
            className="flex-1 py-3 rounded-2xl font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #3B82F6)' }}>
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Searching...</>
            ) : (
              <><Search className="w-4 h-4" /> Search Tutors</>
            )}
          </button>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex flex-col items-center py-16">
            <div className="w-12 h-12 rounded-full border-4 border-[#6C63FF] border-t-transparent animate-spin mb-4" />
            <p className="text-white/60 text-white/50">Searching tutors...</p>
          </div>
        )}

        {!loading && searched && tutors.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/8 border-white/6 flex items-center justify-center mb-6">
              <GraduationCap className="w-10 h-10 text-white/70 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-white text-white mb-2">No tutors found</h3>
            <p className="text-white/60 text-white/50 mb-4">Try adjusting your filters or searching with broader criteria.</p>
            <button onClick={handleClearFilters} className="text-[#6C63FF] font-medium hover:underline">Clear filters and try again</button>
          </div>
        )}

        {!loading && !searched && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/8 border-white/6 flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-white/50 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white text-white mb-2">Search for Tutors</h3>
            <p className="text-white/60 text-white/50">Use the filters above and click Search to find tutors.</p>
          </div>
        )}

        {!loading && tutors.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/60 text-white/50 text-sm"><span className="text-white text-white font-semibold">{displayedTutors.length}</span> tutors found</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedTutors.map((tutor) => (
                <div key={tutor.id}
                  className="group bg-white/5 backdrop-blur-lg rounded-3xl border border-white/8 border-white/6 hover:shadow-xl  hover:border-white/8 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  {/* Card Header */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#3B82F6] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                        {tutor.photoUrl ? (
                          <img src={tutor.photoUrl} alt={tutor.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-white">{tutor.name[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-white text-white leading-tight">{tutor.name}</h3>
                          {tutor.introVideoUrl && (
                            <span title="Has teaching video" className="flex-shrink-0 p-1.5 rounded-lg dark:bg-pink-500/10 bg-pink-50 dark:text-pink-400 text-pink-600">
                              <Video className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        {tutor.location && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-white/50 text-gray-400" />
                            <span className="text-xs text-white/60 text-white/50 truncate">{tutor.location}</span>
                          </div>
                        )}
                        {/* Institute Badge */}
                        {tutor.instituteId && tutor.instituteId !== 'none' && (() => {
                          const inst = institutes.find(i => i.id === tutor.instituteId);
                          return inst ? (
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`/institute/${inst.id}`); }}
                              className="flex items-center gap-1 mt-1 text-xs text-[#6C63FF] hover:underline">
                              <Building2 className="w-3 h-3" /> {inst.name}
                            </button>
                          ) : null;
                        })()}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <RatingStars avgRating={tutor.avgRating ?? 0} />
                      <span className="text-xs text-white/50 text-gray-400">
                        {(tutor.avgRating ?? 0).toFixed(1)} ({tutor.ratingCount ?? 0})
                      </span>
                    </div>

                    {/* Subjects */}
                    {(tutor.subjects || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(tutor.subjects as any[]).slice(0, 3).map((s: any, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded-lg text-xs  bg-[#6C63FF]/5 dark:text-[#a099ff] text-[#6C63FF]">
                            {typeof s === 'object' && s?.subject ? s.subject : String(s)}
                          </span>
                        ))}
                        {(tutor.subjects || []).length > 3 && (
                          <span className="px-2 py-0.5 rounded-lg text-xs  bg-white/8 text-white/60 text-white/50">+{(tutor.subjects || []).length - 3} more</span>
                        )}
                      </div>
                    )}

                    {/* Rate */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-white text-sm">{formatHourlyRate(tutor)}</span>
                      {tutor.contactPhone && (
                        <span className="text-xs text-white/50 text-gray-400">{tutor.contactPhone}</span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 pb-5 flex gap-2">
                    <button onClick={() => navigate(`/student/tutor/${tutor.id}`)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(135deg, #6C63FF, #3B82F6)' }}>
                      View Profile
                    </button>
                    <button onClick={() => navigate(`/student/chat/tutor/${tutor.id}`, { state: { from: 'search' } })}
                      className="p-2.5 rounded-xl  bg-white/8 text-white/60 text-white/70 hover:dark:bg-[#6C63FF]/20 hover:bg-[#6C63FF]/10 hover:text-[#6C63FF] transition-all">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    {user && (user.role || '').toLowerCase() === 'student' && (
                      <button onClick={() => openRatingModal(tutor)}
                        className="p-2.5 rounded-xl dark:bg-amber-500/10 bg-amber-50 dark:text-amber-400 text-amber-600 hover:scale-110 transition-transform">
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Rating Modal */}
      <Dialog open={!!ratingModal} onOpenChange={(open) => { if (!open) setRatingModal(null); }}>
        <DialogContent className=" dark:backdrop-blur-lg border-white/10 rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Rate {ratingModal?.tutor.name}</DialogTitle>
            <DialogDescription className="text-white/60">How was your experience with this tutor?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-3 my-4">
            {[1, 2, 3, 4, 5,6].map((n) => (
              <button key={n} onClick={() => setRatingStars(n)} className="transition-all hover:scale-125">
                <Star className={`w-8 h-8 transition-colors ${n <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-white/70 text-gray-300'}`} />
              </button>
            ))}
          </div>
          <Textarea rows={3} placeholder="Share your experience (optional)..." value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            className="  border-white/10 text-white dark:placeholder:text-white/50 rounded-xl resize-none" />
          <DialogFooter>
            <button onClick={() => setRatingModal(null)}
              className="px-4 py-2 rounded-xl  bg-white/8 text-white/60 text-white/70 text-sm">
              Cancel
            </button>
            <button onClick={handleSubmitRating} disabled={submittingRating || ratingStars === 0}
              className="px-6 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #3B82F6)' }}>
              {submittingRating ? 'Submitting...' : 'Submit Review'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
