import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getCurrentUser, tutorAPI } from '../utils/api';
import { toast } from 'sonner';
import {
  ArrowLeft, BookOpen, Plus, Trash2, Save, Video, FileText,
  Upload, X, ChevronDown, ChevronUp, GraduationCap, Link2,
  Film
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface VideoEntry {
  title: string;
  description: string;
  // URL type (YouTube / Vimeo)
  url?: string;
  // Local file type
  fileBase64?: string;   // set while uploading (before save)
  fileUrl?: string;      // set after save (served from backend)
  fileName?: string;
  type?: 'url' | 'local';
}

interface PdfEntry {
  title: string;
  fileName: string;
  fileBase64?: string;   // set while uploading
  fileUrl?: string;      // set after save
}

interface SubjectMaterial {
  subject: string;
  category: string;
  syllabus: string;
  videos: VideoEntry[];
  pdfs: PdfEntry[];
}

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

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const emptyVideo = (type: 'url' | 'local' = 'url'): VideoEntry => ({ title: '', description: '', type, url: type === 'url' ? '' : undefined });
const emptyPdf = (): PdfEntry => ({ title: '', fileName: '', fileBase64: '' });

// ─── Sub-components ──────────────────────────────────────────────────────────
function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/10 overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))' }}>
      {children}
    </div>
  );
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">{children}</label>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TutorLearningMaterialsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<{ category: string; subject: string }[]>([]);
  const [materials, setMaterials] = useState<SubjectMaterial[]>([]);
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) { navigate('/tutor/login'); return; }
      const profileRes = await tutorAPI.getMyProfile();
      const rawSubjects: { category: string; subject: string }[] = Array.isArray(profileRes?.profile?.subjects)
        ? profileRes.profile.subjects.map((s: any) => ({
            category: typeof s === 'object' ? (s.category || '') : '',
            subject: typeof s === 'object' ? (s.subject || String(s)) : String(s),
          }))
        : [];
      
      const seen = new Set();
      const profileSubjects = rawSubjects.filter(s => {
        if (seen.has(s.subject)) return false;
        seen.add(s.subject);
        return true;
      });

      setSubjects(profileSubjects);
      try {
        const matRes = await tutorAPI.getMaterials(user.id);
        if (Array.isArray(matRes?.materials) && matRes.materials.length > 0) {
          const merged: SubjectMaterial[] = profileSubjects.map(s => {
            const existing = matRes.materials.find((m: SubjectMaterial) => m.subject === s.subject);
            return existing || { ...s, syllabus: '', videos: [], pdfs: [] };
          });
          setMaterials(merged);
          if (merged.length > 0) setOpenSection(merged[0].subject);
        } else {
          const blank = profileSubjects.map(s => ({ ...s, syllabus: '', videos: [], pdfs: [] }));
          setMaterials(blank);
          if (blank.length > 0) setOpenSection(blank[0].subject);
        }
      } catch {
        const blank = profileSubjects.map(s => ({ ...s, syllabus: '', videos: [], pdfs: [] }));
        setMaterials(blank);
        if (blank.length > 0) setOpenSection(blank[0].subject);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load profile');
      navigate('/tutor/dashboard');
    } finally { setLoading(false); }
  };

  const updateMaterial = (subject: string, updates: Partial<SubjectMaterial>) =>
    setMaterials(prev => prev.map(m => m.subject === subject ? { ...m, ...updates } : m));

  const getMat = (subject: string) => materials.find(m => m.subject === subject)!;

  // Videos
  const addVideo = (subject: string, type: 'url' | 'local') =>
    updateMaterial(subject, { videos: [...getMat(subject).videos, emptyVideo(type)] });
  const removeVideo = (subject: string, idx: number) =>
    updateMaterial(subject, { videos: getMat(subject).videos.filter((_, i) => i !== idx) });
  const updateVideo = (subject: string, idx: number, patch: Partial<VideoEntry>) =>
    updateMaterial(subject, { videos: getMat(subject).videos.map((v, i) => i === idx ? { ...v, ...patch } : v) });

  // PDFs
  const addPdf = (subject: string) =>
    updateMaterial(subject, { pdfs: [...getMat(subject).pdfs, emptyPdf()] });
  const removePdf = (subject: string, idx: number) =>
    updateMaterial(subject, { pdfs: getMat(subject).pdfs.filter((_, i) => i !== idx) });
  const updatePdf = (subject: string, idx: number, patch: Partial<PdfEntry>) =>
    updateMaterial(subject, { pdfs: getMat(subject).pdfs.map((p, i) => i === idx ? { ...p, ...patch } : p) });

  // Local video file handler
  const handleVideoFileUpload = async (subject: string, idx: number, file: File) => {
    const MAX_MB = 200;
    if (file.size > MAX_MB * 1024 * 1024) { toast.error(`Video must be under ${MAX_MB}MB`); return; }
    toast.info('Reading video file…');
    try {
      const base64 = await readFileAsBase64(file);
      updateVideo(subject, idx, { fileBase64: base64, fileName: file.name, type: 'local' });
      toast.success('Video ready to save');
    } catch { toast.error('Failed to read video file'); }
  };

  // PDF file handler — 100MB limit
  const handlePdfUpload = async (subject: string, idx: number, file: File) => {
    const MAX_MB = 100;
    if (file.size > MAX_MB * 1024 * 1024) { toast.error(`PDF must be under ${MAX_MB}MB`); return; }
    toast.info('Reading PDF…');
    try {
      const base64 = await readFileAsBase64(file);
      updatePdf(subject, idx, { fileBase64: base64, fileName: file.name });
      toast.success('PDF ready to save');
    } catch { toast.error('Failed to read PDF'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await tutorAPI.saveMaterials(materials);
      toast.success('Learning materials saved! 🎉');
      // Reload to get server-generated fileUrls
      await init();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save materials');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#06040f] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#06040f] text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <button onClick={() => navigate('/tutor/dashboard')}
          className="flex items-center gap-2 mb-8 text-white/50 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between gap-4 mb-10 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,rgba(108,99,255,0.4),rgba(59,130,246,0.3))' }}>
              <GraduationCap className="w-7 h-7 text-[#6C63FF]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Learning Materials</h1>
              <p className="text-white/50 text-sm mt-0.5">Syllabus · Videos (YouTube, Vimeo, or local file) · PDFs — students access after payment</p>
            </div>
          </div>
          <SaveButton saving={saving} onClick={handleSave} />
        </div>

        {subjects.length === 0 && (
          <SectionCard>
            <div className="p-12 text-center">
              <BookOpen className="w-14 h-14 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 text-lg font-semibold mb-2">No subjects found</p>
              <p className="text-white/30 text-sm mb-6">Add subjects to your profile first before uploading materials.</p>
              <button onClick={() => navigate('/tutor/profile')}
                className="px-6 py-3 rounded-xl font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)' }}>Go to Profile</button>
            </div>
          </SectionCard>
        )}

        <div className="space-y-4">
          {materials.map(mat => {
            const isOpen = openSection === mat.subject;
            return (
              <SectionCard key={mat.subject}>
                {/* Accordion header */}
                <button className="w-full flex items-center justify-between p-6 text-left group"
                  onClick={() => setOpenSection(isOpen ? null : mat.subject)}>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,rgba(108,99,255,0.3),rgba(59,130,246,0.2))' }}>
                      <BookOpen className="w-5 h-5 text-[#6C63FF]" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{mat.subject}</p>
                      {mat.category && <p className="text-white/40 text-xs">{mat.category}</p>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {mat.videos.length > 0 && <Badge color="blue">{mat.videos.length} video{mat.videos.length !== 1 ? 's' : ''}</Badge>}
                      {mat.pdfs.length > 0 && <Badge color="amber">{mat.pdfs.length} PDF{mat.pdfs.length !== 1 ? 's' : ''}</Badge>}
                      {mat.syllabus && <Badge color="green">Syllabus ✓</Badge>}
                    </div>
                  </div>
                  <span className="text-white/40 group-hover:text-white/70 transition-colors">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-8 space-y-8 border-t border-white/8">

                    {/* Syllabus */}
                    <div className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-green-400" />
                        <h3 className="font-bold text-white">Course Syllabus</h3>
                      </div>
                      <FieldLabel>Describe what students will learn</FieldLabel>
                      <textarea rows={5} value={mat.syllabus}
                        onChange={e => updateMaterial(mat.subject, { syllabus: e.target.value })}
                        placeholder={`e.g. Week 1: Introduction to ${mat.subject}\nWeek 2: Core concepts…`}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25
                          outline-none focus:border-[#6C63FF] transition-all resize-none" />
                    </div>

                    {/* Videos */}
                    <div>
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-blue-400" />
                          <h3 className="font-bold text-white">Video Lessons</h3>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => addVideo(mat.subject, 'url')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-400 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all">
                            <Link2 className="w-3.5 h-3.5" /> Add URL
                          </button>
                          <button onClick={() => addVideo(mat.subject, 'local')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-400 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-all">
                            <Film className="w-3.5 h-3.5" /> Upload Local
                          </button>
                        </div>
                      </div>

                      {mat.videos.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
                          <Video className="w-8 h-8 text-white/20 mx-auto mb-2" />
                          <p className="text-white/35 text-sm">No videos yet. Add a YouTube/Vimeo URL or upload a local video file.</p>
                        </div>
                      )}

                      <div className="space-y-4">
                        {mat.videos.map((v, idx) => (
                          <div key={idx} className="rounded-2xl border border-white/8 overflow-hidden"
                            style={{ background: v.type === 'local' ? 'rgba(139,92,246,0.05)' : 'rgba(59,130,246,0.04)' }}>
                            <div className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-semibold flex items-center gap-1.5 ${v.type === 'local' ? 'text-purple-400' : 'text-blue-400'}`}>
                                  {v.type === 'local' ? <><Film className="w-4 h-4" /> Local Video {idx + 1}</> : <><Link2 className="w-4 h-4" /> URL Video {idx + 1}</>}
                                </span>
                                <button onClick={() => removeVideo(mat.subject, idx)}
                                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid md:grid-cols-2 gap-3">
                                <div>
                                  <FieldLabel>Title</FieldLabel>
                                  <input type="text" value={v.title}
                                    onChange={e => updateVideo(mat.subject, idx, { title: e.target.value })}
                                    placeholder="e.g. Introduction to Algebra"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#6C63FF] transition-all" />
                                </div>

                                {v.type === 'url' ? (
                                  <div>
                                    <FieldLabel>YouTube / Vimeo URL</FieldLabel>
                                    <div className="relative">
                                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                      <input type="url" value={v.url || ''}
                                        onChange={e => updateVideo(mat.subject, idx, { url: e.target.value })}
                                        placeholder="https://youtube.com/watch?v=..."
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#6C63FF] transition-all" />
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <FieldLabel>Video File (MP4, MKV, MOV — max 200MB)</FieldLabel>
                                    {(v.fileBase64 || v.fileUrl) ? (
                                      <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/25">
                                        <Film className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                        <span className="text-sm text-white/80 flex-1 truncate">{v.fileName}</span>
                                        <button
                                          onClick={() => updateVideo(mat.subject, idx, { fileBase64: undefined, fileUrl: undefined, fileName: undefined })}
                                          className="p-1 rounded-lg text-white/30 hover:text-red-400 transition-colors">
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-white/15 cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group">
                                        <Upload className="w-6 h-6 text-white/30 group-hover:text-purple-400 transition-colors" />
                                        <span className="text-sm text-white/40 group-hover:text-white/70 transition-colors">Click to upload video</span>
                                        <span className="text-xs text-white/25">MP4, MKV, MOV, AVI — max 200MB</span>
                                        <input type="file" accept="video/*" className="hidden"
                                          onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoFileUpload(mat.subject, idx, f); }} />
                                      </label>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div>
                                <FieldLabel>Description (optional)</FieldLabel>
                                <input type="text" value={v.description}
                                  onChange={e => updateVideo(mat.subject, idx, { description: e.target.value })}
                                  placeholder="Brief description of this video lesson…"
                                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#6C63FF] transition-all" />
                              </div>

                              {/* URL embed preview */}
                              {v.type === 'url' && v.url && getEmbedUrl(v.url) && (
                                <div className="rounded-xl overflow-hidden border border-blue-500/20 mt-1">
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border-b border-blue-500/15">
                                    <Video className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="text-xs text-blue-300 font-medium">Preview</span>
                                  </div>
                                  <div className="relative w-full" style={{ paddingTop: '40%' }}>
                                    <iframe src={getEmbedUrl(v.url)!} title={v.title || 'Video preview'}
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen className="absolute inset-0 w-full h-full" style={{ border: 'none' }} />
                                  </div>
                                </div>
                              )}
                              {/* Local file preview (blob) */}
                              {v.type === 'local' && v.fileBase64 && (
                                <div className="rounded-xl overflow-hidden border border-purple-500/20 mt-1">
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border-b border-purple-500/15">
                                    <Film className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-xs text-purple-300 font-medium">Preview</span>
                                  </div>
                                  <video controls src={v.fileBase64} className="w-full max-h-60 bg-black" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PDFs */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400" />
                          <h3 className="font-bold text-white">PDF Study Materials</h3>
                        </div>
                        <button onClick={() => addPdf(mat.subject)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-amber-400 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all">
                          <Plus className="w-4 h-4" /> Add PDF
                        </button>
                      </div>

                      {mat.pdfs.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
                          <FileText className="w-8 h-8 text-white/20 mx-auto mb-2" />
                          <p className="text-white/35 text-sm">No PDFs yet. Upload notes, papers, or past papers (up to 100MB each).</p>
                        </div>
                      )}

                      <div className="space-y-4">
                        {mat.pdfs.map((p, idx) => (
                          <div key={idx} className="rounded-2xl border border-white/8 p-4 space-y-3"
                            style={{ background: 'rgba(245,158,11,0.04)' }}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-amber-400">PDF {idx + 1}</span>
                              <button onClick={() => removePdf(mat.subject, idx)}
                                className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div>
                              <FieldLabel>Document Title</FieldLabel>
                              <input type="text" value={p.title}
                                onChange={e => updatePdf(mat.subject, idx, { title: e.target.value })}
                                placeholder="e.g. Algebra Past Paper 2023"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#6C63FF] transition-all" />
                            </div>
                            <div>
                              <FieldLabel>Upload PDF (max 100MB)</FieldLabel>
                              {(p.fileBase64 || p.fileUrl) ? (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                                  <FileText className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                  <span className="text-sm text-white/80 flex-1 truncate">{p.fileName}</span>
                                  {p.fileUrl && <span className="text-xs text-green-400 font-medium px-2 py-0.5 rounded-full bg-green-500/10">On server ✓</span>}
                                  <button onClick={() => updatePdf(mat.subject, idx, { fileBase64: undefined, fileUrl: undefined, fileName: '' })}
                                    className="p-1 rounded-lg text-white/30 hover:text-red-400 transition-colors">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-white/15
                                  cursor-pointer hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group">
                                  <Upload className="w-6 h-6 text-white/30 group-hover:text-amber-400 transition-colors" />
                                  <span className="text-sm text-white/40 group-hover:text-white/70 transition-colors">Click to upload PDF</span>
                                  <span className="text-xs text-white/25">Max 100MB per file</span>
                                  <input type="file" accept=".pdf,application/pdf" className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(mat.subject, idx, f); }} />
                                </label>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </SectionCard>
            );
          })}
        </div>

        {materials.length > 0 && (
          <div className="mt-8 flex justify-end">
            <SaveButton saving={saving} onClick={handleSave} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper components ───────────────────────────────────────────────────────
function Badge({ children, color }: { children: React.ReactNode; color: 'blue' | 'amber' | 'green' }) {
  const styles = {
    blue:  'bg-blue-500/20 text-blue-400 border-blue-500/25',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/25',
    green: 'bg-green-500/20 text-green-400 border-green-500/25',
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[color]}`}>{children}</span>;
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 shadow-xl"
      style={{ background: 'linear-gradient(135deg,#6C63FF,#3B82F6)', boxShadow: '0 8px 32px rgba(108,99,255,0.4)' }}>
      {saving
        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
        : <><Save className="w-4 h-4" /> Save All Materials</>}
    </button>
  );
}
