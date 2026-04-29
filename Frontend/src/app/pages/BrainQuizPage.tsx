import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { 
  ArrowLeft, Brain, CheckCircle, XCircle, Trophy, User, Hash,
  RotateCcw, ChevronRight, ChevronLeft, Zap, Clock, HelpCircle, BookOpen, Search, X, Flag, AlertCircle, Sparkles, Target, ClipboardCheck, GraduationCap, Flame, Award, Heart, Activity, Forward, Layers, Play
} from 'lucide-react';
import { getQuizzes, saveQuizzes, Quiz as AdminQuiz, Question as AdminQuestion } from '../data/quizzesStore';
import { adminAPI } from '../utils/api';

const PRIMARY = '#6C63FF';
const GRAD = `linear-gradient(135deg, ${PRIMARY}, #3B82F6)`;

export function BrainQuizPage() {
  const navigate = useNavigate();
  const { user } = useChatAuth();
  const { isDark } = useTheme();

  // ── Theme tokens ────────────────────────────────────────
  const pageBg     = isDark ? '#06040f' : 'transparent';
  const headColor  = isDark ? '#ffffff' : '#0f0e1a';
  const navBg      = isDark ? 'rgba(6,4,15,0.9)' : 'rgba(220,217,238,0.96)';
  const navBdr     = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.20)';
  const cardBg     = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.95)';
  const cardBdr    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.30)';

  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [availableQuizzes, setAvailableQuizzes] = useState<AdminQuiz[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuiz, setActiveQuiz] = useState<AdminQuiz | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [flags, setFlags] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRef] = useState<{ id: ReturnType<typeof setInterval> | null }>({ id: null });

  useEffect(() => {
    // Load from backend; fall back to localStorage if offline
    adminAPI.getPublicQuizzes()
      .then((res: any) => {
        const dbQuizzes: AdminQuiz[] = res?.quizzes || [];
        setAvailableQuizzes(dbQuizzes);
        saveQuizzes(dbQuizzes); // keep cache in sync
      })
      .catch(() => {
        setAvailableQuizzes(getQuizzes());
      });
  }, []);

  const getTierMetadata = (label: string) => {
    const l = (label || '').toUpperCase();
    if (l.includes('A/L')) return { color: 'rose', tailwind: 'rose', shadow: 'shadow-rose-500/20' };
    if (l.includes('O/L')) return { color: 'blue', tailwind: 'blue', shadow: 'shadow-blue-500/20' };
    if (l.includes('GRADE 11') || l.includes('GRADE 10')) return { color: 'amber', tailwind: 'amber', shadow: 'shadow-amber-500/20' };
    if (l.includes('GRADE 6') || l.includes('GRADE 7') || l.includes('GRADE 8') || l.includes('GRADE 9')) return { color: 'indigo', tailwind: 'indigo', shadow: 'shadow-indigo-500/20' };
    if (l.includes('GRADE') || l.includes('PRIMARY')) return { color: 'emerald', tailwind: 'emerald', shadow: 'shadow-emerald-500/20' };
    return { color: 'blue', tailwind: 'blue', shadow: 'shadow-blue-500/20' };
  };

  const handleStartQuiz = (quiz: AdminQuiz) => {
    setActiveQuiz(quiz);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setFlags({});
    setCurrent(0);
    setTimeLeft(quiz.timeLimit * 60);
    setPhase('quiz');
    startGlobalTimer();
  };

  const startGlobalTimer = () => {
    if (timerRef.id) clearInterval(timerRef.id);
    timerRef.id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.id!);
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleSelect = (idx: number) => {
    setAnswers(prev => {
      const copy = [...prev];
      copy[current] = (copy[current] === idx) ? null : idx;
      return copy;
    });
  };

  const toggleFlag = () => {
    setFlags(prev => ({ ...prev, [current]: !prev[current] }));
  };

  const handleNext = () => {
    if (current + 1 < (activeQuiz?.questions.length || 0)) {
      setCurrent(current + 1);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(current - 1);
    }
  };

  const requestSubmit = () => {
    const unansweredCount = answers.filter(a => a === null).length;
    if (unansweredCount > 0) {
      if (confirm(`CRITICAL NOTICE: ${unansweredCount} inquiries currently unanswered. Proceed with final submission?`)) finishQuiz();
    } else {
      if (confirm("PROTOCOL VERIFICATION: Initialize the Intellect Audit Performance Report?")) finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (timerRef.id) clearInterval(timerRef.id);
    setPhase('result');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredQuizzes = availableQuizzes.filter(quiz => {
    const q = searchQuery.toLowerCase();
    return quiz.title.toLowerCase().includes(q) || 
           quiz.subject.toLowerCase().includes(q) || 
           (quiz.category || '').toLowerCase().includes(q);
  });

  if (phase === 'intro') {
    return (
      <div className="h-screen w-screen flex flex-col relative overflow-hidden" style={{ background: pageBg }}>
        {/* Visual Ambiance */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-blue-600/5 blur-[200px] rounded-full animate-pulse" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/5 blur-[180px] rounded-full" />
        </div>

        <header className="flex-shrink-0 z-40 bg-transparent" style={{ backdropFilter: 'blur(30px)', borderBottom: `1px solid ${navBdr}` }}>
          <div className="max-w-7xl mx-auto px-12 h-20 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={() => navigate('/student/dashboard')} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:scale-110 transition-all shadow-xl group">
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-2xl scale-110"><Brain className="w-6 h-6" /></div>
                <h1 className="font-black text-xl uppercase tracking-[0.4em] text-white">Examination Gateway</h1>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-4 px-8 py-3 rounded-2xl bg-white/5 border border-white/10">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]" />
               <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.4em]">Audit Registry Online</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-10 flex flex-col items-center justify-center overflow-hidden relative z-10 w-full">
          <div className="max-w-[1400px] w-full h-full flex flex-col">
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 flex-shrink-0 animate-in fade-in slide-in-from-top-6 duration-1000">
              <div className="space-y-1">
                <div className="flex items-center gap-4">
                   <div className="w-3 h-12 bg-blue-600 rounded-full" />
                   <h2 className="text-2xl font-bold text-white leading-none">Assessment selection</h2>
                </div>
                <p className="text-sm font-bold text-blue-400 opacity-60">Academic modules ready for initialization.</p>
              </div>
              <div className="relative group/search max-w-xl w-full">
                <div className="relative flex items-center bg-slate-900 border border-white/5 rounded-[2rem] px-8 py-4 shadow-3xl">
                  <Search className="w-6 h-6 text-gray-700 mr-4 group-focus-within/search:text-blue-500 transition-colors" />
                  <input style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '18px', color: 'white' }} placeholder="Search Assessments..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="placeholder:text-gray-800 font-black uppercase tracking-tight" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar-wide pr-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 align-content-start pb-12 pt-2">
              {filteredQuizzes.map((quiz, idx) => {
                const meta = getTierMetadata(quiz.category || '');
                const accentCol = meta.tailwind === 'rose' ? 'bg-rose-600' : meta.tailwind === 'blue' ? 'bg-blue-600' : meta.tailwind === 'amber' ? 'bg-amber-600' : meta.tailwind === 'indigo' ? 'bg-indigo-600' : 'bg-emerald-600';

                return (
                <div key={quiz.id} className="group rounded-[4rem] p-10 transition-all hover:-translate-y-2 hover:border-blue-500/40 border-2 flex flex-col relative animate-in fade-in slide-in-from-bottom-6 duration-700 h-[520px]" style={{ background: cardBg, borderColor: cardBdr, animationDelay: `${idx * 100}ms` }}>
                  
                  <div className="flex items-start justify-between mb-8 flex-shrink-0">
                    <div className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center bg-white/5 border border-white/10 group-hover:bg-white group-hover:text-slate-950 transition-all duration-700 shadow-2xl ${meta.tailwind === 'rose' ? 'text-rose-500' : meta.tailwind === 'blue' ? 'text-blue-500' : meta.tailwind === 'amber' ? 'text-amber-500' : meta.tailwind === 'indigo' ? 'text-indigo-500' : 'text-emerald-500'}`}>
                       <GraduationCap className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col items-end gap-2 pt-1">
                      <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border-2 tracking-[0.15em] bg-${meta.tailwind}-500/10 text-${meta.tailwind}-500 border-${meta.tailwind}-500/20 shadow-inner`}>{quiz.subject}</span>
                      <span className="text-[12px] font-black text-white uppercase tracking-[0.5em] px-2">{quiz.category}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 flex flex-col">
                     <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-[1.1] mb-3 line-clamp-2">{quiz.title}</h3>
                     <div className={`h-1 w-12 rounded-full mb-4 group-hover:w-full transition-all duration-700 ${accentCol}`} />
                     <div className="overflow-hidden flex-1">
                        <p className="text-[15px] text-gray-500 italic leading-relaxed line-clamp-3 opacity-80 group-hover:opacity-100 transition-opacity">{quiz.description || "Deploying strategic assessment inquiries."}</p>
                     </div>
                  </div>

                  <div className="flex-shrink-0 pt-6 mt-6 border-t border-white/5 space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-[2rem] border border-white/5 flex flex-col items-center">
                           <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-emerald-500" /><span className="text-xl font-black text-white">{quiz.timeLimit}M</span></div>
                           <span className="text-[8px] font-black text-gray-800 uppercase tracking-widest leading-none">Duration</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-[2rem] border border-white/5 flex flex-col items-center">
                           <div className="flex items-center gap-2 mb-1"><Layers className="w-4 h-4 text-blue-500" /><span className="text-xl font-black text-white">{quiz.questions.length}U</span></div>
                           <span className="text-[8px] font-black text-gray-800 uppercase tracking-widest leading-none">Units</span>
                        </div>
                     </div>
                     <button onClick={() => handleStartQuiz(quiz)} 
                             className="w-full py-7 rounded-[2rem] font-black text-white text-[16px] uppercase tracking-[0.2em] transition-all hover:scale-105 hover:shadow-[0_20px_40px_rgba(37,99,235,0.3)] bg-gradient-to-r from-blue-600 to-indigo-700 border-b-6 border-indigo-900 flex items-center justify-center gap-4">
                       <Play className="w-6 h-6 fill-current" /> Proceed
                     </button>
                  </div>
                </div>
              );})}
            </div>
          </div>
        </div>
        <style>{`.custom-scrollbar-wide::-webkit-scrollbar { width: 8px; } .custom-scrollbar-wide::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }`}</style>
      </div>
    );
  }

  if (phase === 'quiz') {
    const q = activeQuiz?.questions[current];
    const timeLimitSeconds = (activeQuiz?.timeLimit || 20) * 60;
    const timePct = (timeLeft / timeLimitSeconds) * 100;
    const meta = activeQuiz ? getTierMetadata(activeQuiz.category) : null;
    const accentTailwind = meta?.tailwind || 'blue';

    return (
      <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden" style={{ background: pageBg }}>
        <div className="flex-1 flex flex-col h-full border-r border-white/10 relative overflow-hidden">
          <header className="flex-shrink-0 px-10 h-28 flex flex-col justify-center border-b-[3px] border-white/5" style={{ background: navBg, backdropFilter: 'blur(50px)' }}>
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-6">
                 <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl border border-white/10 shadow-3xl">{(current + 1).toString().padStart(2, '0')}</div>
                 <div className="max-w-xl">
                    <div className="flex items-center gap-3 mb-1"><div className="w-2 h-2 rounded-full animate-pulse bg-blue-500" /><span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Security Audit: Active</span></div>
                    <h2 className="font-black text-white text-2xl uppercase tracking-tighter truncate leading-tight">{activeQuiz?.title}</h2>
                 </div>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest mb-1">Audit Duration</span>
                  <span className={`text-4xl font-black tabular-nums tracking-tighter ${timeLeft < 60 ? 'text-rose-600 animate-pulse' : 'text-blue-500'}`}>{formatTime(timeLeft)}</span>
               </div>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className={`h-full bg-blue-600 transition-all duration-1000`} style={{ width: `${timePct}%` }} /></div>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] rotate-12 scale-150"><Brain className="w-[800px] h-[800px]" /></div>
            <div className="max-w-6xl w-full h-full flex flex-col justify-center animate-in fade-in duration-700">
               <div className="flex-shrink-0 mb-10 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                     <span className={`px-6 py-2 rounded-2xl bg-${accentTailwind}-600/10 border-2 border-${accentTailwind}-500/20 text-${accentTailwind}-400 font-black text-base uppercase tracking-[0.4em]`}>Inquiry {current + 1} / {activeQuiz?.questions.length}</span>
                     {flags[current] && <span className="flex items-center gap-3 text-sm font-black uppercase text-amber-500 bg-amber-500/5 px-6 py-2 rounded-2xl border-2 border-amber-500/20 animate-in zoom-in-95 shadow-xl"><Forward className="w-6 h-6" /> SKIPPED FOR REVIEW</span>}
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight">{q?.text}</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-h-[45vh] overflow-y-auto pr-4 custom-scrollbar-wide">
                  {q?.options.map((opt, idx) => {
                    const isSelected = answers[current] === idx;
                    return (
                      <button key={idx} onClick={() => handleSelect(idx)}
                        className={`group relative text-left p-8 rounded-[2.5rem] border-2 transition-all duration-500 w-full ${isSelected ? `border-${accentTailwind}-500 bg-${accentTailwind}-500/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] scale-[1.02]` : 'border-white/5 bg-white/5 hover:border-white/10 hover:scale-[1.01]'}`}>
                        <div className="flex items-center gap-6 relative z-10">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl transition-all duration-700 ${isSelected ? `bg-${accentTailwind}-500 text-slate-950 scale-110 rotate-6 shadow-2xl` : 'bg-white/10 text-gray-700 group-hover:text-gray-300'}`}>{String.fromCharCode(65 + idx)}</div>
                          <span className={`text-xl font-black tracking-tight leading-snug transition-colors ${isSelected ? 'text-white' : 'text-gray-500 group-hover:text-white'}`}>{opt}</span>
                        </div>
                      </button>
                    );
                  })}
               </div>

               <div className="flex-shrink-0 flex items-center justify-between gap-10 mt-12 py-8 border-t-2 border-white/5">
                  <div className="flex gap-4">
                     <button onClick={handlePrev} disabled={current === 0} className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center text-gray-700 hover:text-white hover:bg-white/10 transition-all disabled:opacity-5"><ChevronLeft className="w-8 h-8" /></button>
                     <button onClick={handleNext} disabled={current + 1 === activeQuiz?.questions.length} className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center text-gray-700 hover:text-white hover:bg-white/10 transition-all disabled:opacity-5"><ChevronRight className="w-8 h-8" /></button>
                  </div>
                  <div className="flex gap-6 items-center flex-1 justify-end">
                     <button onClick={toggleFlag} className={`px-8 py-5 rounded-3xl font-black text-sm uppercase tracking-[0.4em] border-2 transition-all flex items-center gap-4 ${flags[current] ? 'border-amber-600 bg-amber-500/10 text-amber-500 scale-105' : 'border-white/10 text-gray-800 hover:text-white hover:border-white/20'}`}><Forward className="w-6 h-6" /> {flags[current] ? 'Unskip' : 'Skip Question'}</button>
                     {current + 1 === activeQuiz?.questions.length && (
                        <button onClick={requestSubmit} className={`px-12 py-5 rounded-3xl font-black text-sm uppercase tracking-[0.4em] bg-blue-600 text-white shadow-3xl hover:scale-105 transition-all border-b-4 border-black/30 flex items-center gap-4`}><CheckCircle className="w-6 h-6" /> Finalize audit</button>
                     )}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className={`w-full md:w-[480px] border-l-[3px] flex flex-col h-full overflow-hidden relative z-20 ${isDark ? 'bg-slate-950 border-white/5 shadow-[-30px_0_60px_rgba(0,0,0,0.8)]' : 'bg-slate-50 border-slate-200 shadow-[-30px_0_60px_rgba(0,0,0,0.05)]'}`}>
           <div className="p-10 space-y-12 flex-1 overflow-hidden flex flex-col">
              <div className={`p-8 rounded-[3.5rem] border flex-shrink-0 group overflow-hidden relative shadow-2xl ${isDark ? 'bg-indigo-600/5 border-white/10' : 'bg-indigo-50 border-indigo-100'}`}>
                 <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white font-black text-3xl shadow-xl">{user?.fullName?.charAt(0) || 'A'}</div>
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">CANDIDATE PROFILE</p>
                       <p className={`text-2xl font-black tracking-widest uppercase truncate max-w-[200px] leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.fullName || 'Academic Scholar'}</p>
                    </div>
                 </div>
              </div>
              <div className="space-y-6 flex-1 flex flex-col min-h-0">
                 <div className="flex items-center justify-between px-2 flex-shrink-0">
                    <div className="flex items-center gap-4"><div className="w-2 h-8 bg-blue-600 rounded-full" /><h3 className={`font-black text-base uppercase tracking-[0.3em] ${isDark ? 'text-white' : 'text-slate-900'}`}>Evaluation Matrix</h3></div>
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{answers.filter(a => a !== null).length} DONE</span></div>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar-wide grid grid-cols-4 lg:grid-cols-5 gap-5 content-start pb-6">
                    {activeQuiz?.questions.map((_, i) => (
                      <button key={i} onClick={() => { setCurrent(i); }} 
                        className={`aspect-square rounded-2xl flex items-center justify-center text-2xl font-black transition-all border-2 relative overflow-hidden ${current === i ? `bg-blue-600 border-blue-400 text-white shadow-2xl scale-110 z-10` : answers[i] !== null ? 'bg-emerald-600 border-emerald-400 text-white shadow-md' : flags[i] ? 'bg-amber-600 border-amber-400 text-white shadow-md' : isDark ? 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'}`}>
                        {i + 1}
                      </button>
                    ))}
                 </div>
              </div>
              <div className={`p-10 rounded-[3.5rem] border flex-shrink-0 space-y-6 shadow-2xl ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200'}`}>
                 <div className="flex items-end justify-between">
                    <div className="space-y-2">
                       <p className={`text-[12px] font-black uppercase tracking-[0.3em] leading-none ${isDark ? 'text-gray-700' : 'text-slate-500'}`}>Diagnostic Index</p>
                       <span className={`text-6xl font-black tabular-nums tracking-tighter drop-shadow-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>{Math.round((answers.filter(a => a !== null).length / (activeQuiz?.questions.length || 1)) * 100)}%</span>
                    </div>
                    <div className={`h-20 w-20 items-center justify-center rounded-3xl flex shadow-2xl ${isDark ? 'bg-white text-slate-950' : 'bg-slate-900 text-white'}`}><ClipboardCheck className="w-10 h-10" /></div>
                 </div>
                 <div className={`h-3 w-full rounded-full border p-1 relative z-10 shadow-inner overflow-hidden ${isDark ? 'bg-slate-900 border-white/10' : 'bg-slate-100 border-slate-200'}`}><div className={`h-full bg-gradient-to-r from-blue-700 via-indigo-500 to-emerald-500 transition-all duration-1000`} style={{ width: `${(answers.filter(a => a !== null).length / (activeQuiz?.questions.length || 1)) * 100}%` }} /></div>
              </div>
           </div>
           <div className={`px-10 pb-10 flex-shrink-0 ${!isDark && 'bg-slate-50'}`}>
             <button onClick={requestSubmit} className="w-full py-8 rounded-[2rem] bg-blue-600 text-white font-black text-xl uppercase tracking-[0.3em] shadow-2xl border-b-6 border-black/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"><CheckCircle className="w-8 h-8" /> Finalize audit</button>
           </div>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const questionsLength = activeQuiz?.questions.length || 0;
    const scoreRaw = answers.filter((a, i) => a === activeQuiz?.questions[i]?.correctAnswer).length;
    const percent = Math.round((scoreRaw / questionsLength) * 100);
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: pageBg }}>
        <header className="h-20 flex items-center justify-between px-10 border-b-2 border-white/5" style={{ background: navBg }}>
           <div className="flex items-center gap-4"><Award className="w-7 h-7 text-amber-500" /><h1 className="font-black text-xl uppercase tracking-tighter" style={{ color: headColor }}>Intellect Audit Report</h1></div>
           <button onClick={() => setPhase('intro')} className="text-[10px] font-black text-gray-700 uppercase tracking-widest px-8 py-3 rounded-xl border border-white/10 hover:bg-white hover:text-black transition-all">Close Hub</button>
        </header>
        <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center custom-scrollbar">
           <div className="max-w-4xl w-full space-y-12 pb-24">
              <div className="rounded-[4rem] p-16 border border-white/5 bg-white/[0.02] flex flex-col md:flex-row items-center gap-16 relative overflow-hidden group/audit">
                 <div className="w-60 h-60 rounded-full border-[12px] border-white/5 flex items-center justify-center p-2 relative shadow-3xl" style={{ background: `conic-gradient(#6C63FF ${percent}%, transparent 0%)` }}>
                    <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                       <span className="text-7xl font-black text-white tracking-tighter">{percent}%</span>
                       <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Accuracy Factor</span>
                    </div>
                 </div>
                 <div className="flex-1 space-y-6 text-center md:text-left">
                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">{percent >= 75 ? 'Superior Mastery' : percent >= 50 ? 'Proficient' : 'Revision Required'}</h2>
                    <p className="text-xl text-gray-500 font-bold uppercase tracking-widest">{activeQuiz?.title}</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 gap-8">
                 {activeQuiz?.questions.map((q, i) => (
                   <div key={i} className={`p-10 rounded-[3rem] border-2 transition-all ${answers[i] === q.correctAnswer ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                      <div className="flex gap-8 items-start">
                         <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center ${answers[i] === q.correctAnswer ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{answers[i] === q.correctAnswer ? <CheckCircle className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}</div>
                         <div className="space-y-6 flex-1">
                            <h4 className="text-2xl font-black text-white leading-tight">{q.text}</h4>
                            <div className="flex flex-wrap gap-6">
                               <div className="px-6 py-3 rounded-2xl bg-black/40 border border-white/5"><span className="text-[10px] font-black text-gray-700 uppercase block mb-1">Your Response</span><span className={`text-lg font-black uppercase ${answers[i] === q.correctAnswer ? 'text-emerald-500' : 'text-rose-500'}`}>{answers[i] !== null ? q.options[answers[i]!] : 'EMPTY'}</span></div>
                               {answers[i] !== q.correctAnswer && <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10"><span className="text-[10px] font-black text-gray-700 uppercase block mb-1">Target Response</span><span className="text-lg font-black text-gray-400 uppercase">{q.options[q.correctAnswer]}</span></div>}
                            </div>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
        <div className="h-24 px-10 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center gap-8 border-t border-white/5">
           <button onClick={() => setPhase('intro')} className="px-16 py-5 rounded-2xl font-black text-sm text-gray-500 uppercase tracking-widest border border-white/10 hover:bg-white hover:text-black transition-all">Hub Gateway</button>
           <button onClick={() => handleStartQuiz(activeQuiz!)} className="px-16 py-5 rounded-2xl font-black text-sm text-white uppercase tracking-widest bg-emerald-600 shadow-3xl hover:scale-105 transition-all">Restart Audit</button>
        </div>
      </div>
    );
  }

  return null; 
}
