import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { tutorAPI } from '../utils/api';
import { getStoredToken } from '../utils/authService';
import { toast } from 'sonner';
import {
  ArrowLeft, BookOpen, Video, FileText, Download, Lock,
  ExternalLink, GraduationCap, ChevronDown, ChevronUp,
  ShieldCheck, CreditCard, Film, AlertCircle, Loader2
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface VideoEntry { title: string; description: string; url?: string; fileUrl?: string; fileName?: string; type?: 'url' | 'local'; }
interface PdfEntry   { title: string; fileName: string; fileUrl?: string; fileBase64?: string; }
interface SubjectMaterial { subject: string; category: string; syllabus: string; videos: VideoEntry[]; pdfs: PdfEntry[]; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  } catch { /* noop */ }
  return null;
}

/** Relative backend path → full URL with ?token= for <video src> and <iframe> */
function buildFileUrl(fileUrl: string): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http')) return fileUrl;
  const token = getStoredToken();
  return `${fileUrl}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

/** Download a PDF via fetch (sends Bearer token in header) → blob → click download */
async function downloadPdfViaFetch(pdf: PdfEntry) {
  // Legacy base64 PDFs
  if (!pdf.fileUrl && pdf.fileBase64) {
    const a = document.createElement('a');
    a.href = pdf.fileBase64;
    a.download = pdf.fileName || `${pdf.title || 'document'}.pdf`;
    a.click();
    return;
  }
  if (!pdf.fileUrl) return;

  const token = getStoredToken();
  const url = pdf.fileUrl;
  toast.info('Preparing download…');
  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    // Use the original filename from the PDF entry, fallback to title
    a.download = pdf.fileName && pdf.fileName !== pdf.title
      ? pdf.fileName
      : `${pdf.title || 'document'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    toast.success('Download started!');
  } catch (err: any) {
    toast.error('Download failed: ' + (err.message || 'Unknown error'));
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/10 overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))' }}>
      {children}
    </div>
  );
}

// ─── Locked State ─────────────────────────────────────────────────────────────
function LockedState({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="min-h-screen bg-[#06040f] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,rgba(108,99,255,0.2),rgba(239,68,68,0.1))', border: '1px solid rgba(108,99,255,0.3)' }}>
          <Lock className="w-12 h-12 text-[#6C63FF]" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Materials Locked</h1>
        <p className="text-white/50 text-lg mb-6">Complete your class payment to unlock the learning package, syllabus, and PDF materials.</p>
        <div className="rounded-2xl p-5 mb-8 border border-[#6C63FF]/25 text-left"
          style={{ background: 'linear-gradient(135deg,rgba(108,99,255,0.12),rgba(59,130,246,0.08))' }}>
          <p className="text-white/80 font-semibold mb-3 text-sm uppercase tracking-wide">What you'll unlock:</p>
          <ul className="space-y-2.5">
            {[
              { icon: <BookOpen className="w-4 h-4 text-green-400" />, label: 'Full course syllabus for each subject' },
              { icon: <Video className="w-4 h-4 text-blue-400" />, label: 'Video lessons (YouTube, Vimeo & local uploads)' },
              { icon: <FileText className="w-4 h-4 text-amber-400" />, label: 'PDF notes, past papers & study guides' },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-white/70">
                <span className="flex-shrink-0">{item.icon}</span>{item.label}
              </li>
            ))}
          </ul>
        </div>
        <button onClick={() => navigate('/student/bookings')}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-xl"
          style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)', boxShadow: '0 8px 32px rgba(108,99,255,0.4)' }}>
          <CreditCard className="w-5 h-5" /> Go to My Bookings & Pay
        </button>
        <button onClick={() => navigate('/student/dashboard')}
          className="mt-3 text-white/40 hover:text-white/70 transition-colors text-sm block mx-auto">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState({ message, navigate }: { message: string; navigate: (p: string) => void }) {
  return (
    <div className="min-h-screen bg-[#06040f] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-white/50 mb-6">{message}</p>
        <button onClick={() => navigate('/student/bookings')}
          className="px-6 py-3 rounded-xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)' }}>
          ← My Bookings
        </button>
      </div>
    </div>
  );
}

// ─── Video Card ───────────────────────────────────────────────────────────────
function VideoCard({ v, idx }: { v: VideoEntry; idx: number }) {
  const [playing, setPlaying] = useState(false);

  const isLocal  = v.type === 'local' || !!v.fileUrl;
  const localSrc = v.fileUrl ? buildFileUrl(v.fileUrl) : undefined;
  const embedUrl = !isLocal && v.url ? getEmbedUrl(v.url) : null;
  const hasPlayer = !!(embedUrl || localSrc);

  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden"
      style={{ background: isLocal ? 'rgba(139,92,246,0.05)' : 'rgba(59,130,246,0.05)' }}>

      {/* ── Player area ── */}
      <div className="relative bg-black/30" style={{ paddingTop: playing ? 0 : '56.25%' }}>

        {/* Playing state — local file */}
        {playing && localSrc && (
          <video
            controls
            autoPlay
            src={localSrc}
            className="w-full"
            style={{ display: 'block', maxHeight: '340px', background: '#000' }}
            onError={() => toast.error('Could not load video file. Make sure the backend server is running.')}
          />
        )}

        {/* Playing state — YouTube / Vimeo */}
        {playing && embedUrl && (
          <div style={{ paddingTop: '56.25%', position: 'relative' }}>
            <iframe
              src={embedUrl + '&autoplay=1'}
              title={v.title || `Video ${idx + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none' }}
            />
          </div>
        )}

        {/* Thumbnail / play button */}
        {!playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {/* Gradient backdrop */}
            <div className="absolute inset-0"
              style={{ background: isLocal
                ? 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(108,99,255,0.15))'
                : 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(108,99,255,0.15))' }} />

            {isLocal && (
              <div className="absolute top-2 right-2 z-10">
                <span className="text-xs text-purple-300 bg-purple-500/40 px-2 py-0.5 rounded-full font-medium">
                  Local File
                </span>
              </div>
            )}

            {hasPlayer ? (
              <button
                onClick={() => setPlaying(true)}
                className="relative z-10 flex flex-col items-center gap-2 group"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center
                    group-hover:scale-110 transition-all duration-200 shadow-2xl"
                  style={{ background: isLocal ? 'rgba(139,92,246,0.85)' : 'rgba(59,130,246,0.85)', backdropFilter: 'blur(8px)' }}
                >
                  {isLocal
                    ? <Film className="w-7 h-7 text-white" />
                    : <Video className="w-7 h-7 text-white" />}
                </div>
                <span className="text-xs text-white/70 font-medium group-hover:text-white transition-colors">
                  Click to play
                </span>
              </button>
            ) : (
              /* External URL fallback */
              <div className="relative z-10 flex flex-col items-center gap-2">
                <Film className="w-10 h-10 text-white/30" />
                {v.url && (
                  <a href={v.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    onClick={e => e.stopPropagation()}>
                    <ExternalLink className="w-4 h-4" /> Open in browser
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Info row ── */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate">{v.title || `Video ${idx + 1}`}</p>
          {v.description && <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{v.description}</p>}
        </div>
        {playing && (
          <button onClick={() => setPlaying(false)}
            className="text-xs text-white/40 hover:text-white/70 transition-colors flex-shrink-0 mt-0.5">
            ✕ Close
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PDF Row ──────────────────────────────────────────────────────────────────
function PdfRow({ pdf, idx }: { pdf: PdfEntry; idx: number }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    await downloadPdfViaFetch(pdf);
    setDownloading(false);
  };

  const hasFile = !!(pdf.fileUrl || pdf.fileBase64);

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/8 transition-all hover:-translate-y-0.5 hover:border-amber-500/30"
      style={{ background: 'rgba(245,158,11,0.04)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(245,158,11,0.1))' }}>
        <FileText className="w-5 h-5 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm truncate">{pdf.title || pdf.fileName || `Document ${idx + 1}`}</p>
        {pdf.fileName && pdf.fileName !== pdf.title && (
          <p className="text-white/40 text-xs truncate">{pdf.fileName}</p>
        )}
      </div>
      {hasFile && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-amber-400
            border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all flex-shrink-0
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Downloading…</>
            : <><Download className="w-4 h-4" /> Download PDF</>}
        </button>
      )}
    </div>
  );
}

// ─── Subject Card ─────────────────────────────────────────────────────────────
function SubjectCard({ mat }: { mat: SubjectMaterial }) {
  const [open, setOpen] = useState(true);
  const hasContent = mat.syllabus || mat.videos.length > 0 || mat.pdfs.length > 0;

  return (
    <GlassCard>
      <button className="w-full flex items-center justify-between p-6 text-left group"
        onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(108,99,255,0.35),rgba(59,130,246,0.2))' }}>
            <BookOpen className="w-5 h-5 text-[#6C63FF]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{mat.subject}</h3>
            {mat.category && <p className="text-white/40 text-xs">{mat.category}</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {mat.videos.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/25">
                {mat.videos.length} video{mat.videos.length !== 1 ? 's' : ''}
              </span>
            )}
            {mat.pdfs.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/25">
                {mat.pdfs.length} PDF{mat.pdfs.length !== 1 ? 's' : ''}
              </span>
            )}
            {mat.syllabus && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/25">
                Syllabus
              </span>
            )}
          </div>
        </div>
        <span className="text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0">
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </span>
      </button>

      {open && (
        <div className="px-6 pb-8 border-t border-white/8 space-y-8">
          {!hasContent && (
            <p className="pt-6 text-center text-white/30 text-sm py-4">
              No materials uploaded yet for this subject. Check back soon!
            </p>
          )}

          {/* ── Syllabus ── */}
          {mat.syllabus && (
            <div className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-green-400" />
                <h4 className="font-bold text-white">Course Syllabus</h4>
              </div>
              <div className="rounded-2xl p-5 border border-green-500/15" style={{ background: 'rgba(16,185,129,0.05)' }}>
                <pre className="text-white/75 text-sm leading-relaxed whitespace-pre-wrap font-sans">{mat.syllabus}</pre>
              </div>
            </div>
          )}

          {/* ── Videos ── */}
          {mat.videos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-white">Video Lessons</h4>
                <span className="text-white/40 text-sm">({mat.videos.length})</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {mat.videos.map((v, idx) => (
                  <VideoCard key={idx} v={v} idx={idx} />
                ))}
              </div>
            </div>
          )}

          {/* ── PDFs ── */}
          {mat.pdfs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-white">PDF Study Materials</h4>
                <span className="text-white/40 text-sm">({mat.pdfs.length})</span>
              </div>
              <div className="space-y-3">
                {mat.pdfs.map((pdf, idx) => (
                  <PdfRow key={idx} pdf={pdf} idx={idx} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function StudentLearningPage() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<'loading' | 'locked' | 'error' | 'ok'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [materials, setMaterials] = useState<SubjectMaterial[]>([]);
  const [tutorName, setTutorName] = useState('');

  useEffect(() => { if (tutorId) load(tutorId); }, [tutorId]);

  const load = async (id: string) => {
    try {
      const res = await tutorAPI.getMaterials(id);
      const rawMaterials = res.materials || [];
      const seen = new Set();
      const uniqueMaterials = rawMaterials.filter((m: any) => {
        if (seen.has(m.subject)) return false;
        seen.add(m.subject);
        return true;
      });
      setMaterials(uniqueMaterials);
      setTutorName(res.tutorName || '');
      setState('ok');
    } catch (err: any) {
      const msg: string = err.message || '';
      if (msg.includes('Access denied') || msg.includes('locked') || msg.includes('403')) {
        setState('locked');
      } else {
        setErrorMsg(msg || 'Could not load learning materials. Please try again.');
        setState('error');
        toast.error(msg || 'Failed to load materials');
      }
    }
  };

  if (state === 'loading') return (
    <div className="min-h-screen bg-[#06040f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Loading learning materials…</p>
      </div>
    </div>
  );
  if (state === 'locked') return <LockedState navigate={navigate} />;
  if (state === 'error') return <ErrorState message={errorMsg} navigate={navigate} />;

  const hasAny = materials.some(m => m.syllabus || m.videos.length > 0 || m.pdfs.length > 0);

  return (
    <div className="min-h-screen bg-[#06040f] text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">

        <button onClick={() => navigate('/student/bookings')}
          className="flex items-center gap-2 mb-8 text-white/50 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to My Bookings
        </button>

        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,rgba(108,99,255,0.4),rgba(59,130,246,0.3))' }}>
              <GraduationCap className="w-7 h-7 text-[#6C63FF]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Learning Materials</h1>
              {tutorName && (
                <p className="text-white/50 text-sm mt-0.5">
                  Provided by <span className="text-white/80 font-semibold">{tutorName}</span>
                </p>
              )}
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 text-sm font-semibold text-green-400"
            style={{ background: 'rgba(16,185,129,0.1)' }}>
            <ShieldCheck className="w-4 h-4" /> Access granted — payment verified
          </div>
        </div>

        {!hasAny && (
          <div className="rounded-3xl border border-white/10 p-14 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <BookOpen className="w-14 h-14 text-white/20 mx-auto mb-4" />
            <h2 className="text-white/60 text-xl font-bold mb-2">No Materials Yet</h2>
            <p className="text-white/35 text-sm max-w-xs mx-auto">
              Your tutor hasn't uploaded any learning materials yet. Please check back later or contact them via chat.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {materials.map(mat => <SubjectCard key={mat.subject} mat={mat} />)}
        </div>

        {hasAny && (
          <div className="mt-10 flex items-start gap-3 p-4 rounded-2xl border border-white/8"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <ShieldCheck className="w-5 h-5 text-[#6C63FF] flex-shrink-0 mt-0.5" />
            <p className="text-white/40 text-xs leading-relaxed">
              These learning materials are provided exclusively to students who have completed payment.
              Please do not share these materials with others.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
