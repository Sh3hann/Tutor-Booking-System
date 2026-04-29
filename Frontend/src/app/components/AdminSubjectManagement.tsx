/**
 * 4-Level AdminSubjectManagement:
 * Category (e.g., A/L) → Stream (e.g., Science) → Subject (Physics...) → Topics
 */
import { useState, useEffect } from 'react';
import { Plus, X, Pencil, ChevronDown, ChevronRight, ChevronLeft, Check, FolderOpen, FolderClosed, BookOpen, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import {
  getMasterSubjects,
  setMasterSubjects,
} from '../data/subjectsStore';
import { adminAPI } from '../utils/api';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';

interface TopicObj {
  name: string;
  enabled: boolean;
}

interface SubjectObj {
  name: string;
  enabled: boolean;
  topics: TopicObj[];
  description?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  gradeRange?: string;
}

interface Stream {
  value: string;
  label: string;
  enabled: boolean;
  subjects: SubjectObj[];
}

interface CategoryExtended {
  value: string;
  label: string;
  enabled: boolean;
  streams?: Stream[];
  subjects?: SubjectObj[];
}

interface ExtendedMasterData {
  categories: CategoryExtended[];
}

function loadExtended(): ExtendedMasterData {
  const raw = getMasterSubjects();
  const categories: CategoryExtended[] = raw.categories.map((c) => ({
    value: c.value, label: c.label, enabled: true, streams: [],
    subjects: (raw.subjectsByCategory[c.value] || []).map(s => ({ 
      name: s, enabled: true, topics: [], description: '', difficulty: 'Beginner', gradeRange: '' 
    })),
  }));
  try {
    const saved = localStorage.getItem('masterSubjectsExtended');
    if (saved) {
      const parsed: ExtendedMasterData = JSON.parse(saved);
      return {
        categories: categories.map((c) => {
          const ext = parsed.categories?.find((p) => p.value === c.value);
          if (!ext) return c;
          
          // Merge default raw subjects that might be missing from the saved state
          const mergedExtSubjects = [...(ext.subjects || [])];
          for (const rawSub of c.subjects || []) {
            if (!mergedExtSubjects.some(s => typeof s === 'string' ? s === rawSub.name : s.name === rawSub.name)) {
              mergedExtSubjects.push(rawSub as any);
            }
          }

          const mapSubjects = (subs?: any[]): SubjectObj[] =>
            (subs || []).map(s => {
              if (typeof s === 'string') return { name: s, enabled: true, topics: [], description: '', difficulty: 'Beginner', gradeRange: '' };
              const tArray = (s.topics || []).map((t: any) => 
                typeof t === 'string' ? { name: t, enabled: true } : { ...t, enabled: t.enabled ?? true }
              );
              return { 
                ...s, enabled: s.enabled ?? true, topics: tArray,
                description: s.description ?? '', difficulty: s.difficulty ?? 'Beginner', gradeRange: s.gradeRange ?? ''
              };
            });
          return {
            ...c, enabled: ext.enabled ?? true,
            streams: (ext.streams || []).map(st => ({ ...st, enabled: st.enabled ?? true, subjects: mapSubjects(st.subjects) })),
            subjects: mapSubjects(mergedExtSubjects)
          };
        }),
      };
    }
  } catch { }
  return { categories };
}

function saveExtended(data: ExtendedMasterData) {
  localStorage.setItem('masterSubjectsExtended', JSON.stringify(data));
  const categories = data.categories.filter(c => c.enabled).map((c) => ({ value: c.value, label: c.label }));
  const subjectsByCategory: Record<string, string[]> = {};
  data.categories.forEach((c) => {
    if (!c.enabled) return;
    const direct = (c.subjects || []).filter(s => s.enabled).map(s => s.name);
    const fromStreams = (c.streams || []).filter(st => st.enabled).flatMap(s => (s.subjects || []).filter(sub => sub.enabled).map(sub => sub.name));
    subjectsByCategory[c.value] = [...new Set([...direct, ...fromStreams])];
  });
  setMasterSubjects({ categories, subjectsByCategory });
  adminAPI.updateSubjects({ categories, subjectsByCategory }).catch(() => toast.error('Sync failed'));
}

export function AdminSubjectManagement() {
  const [data, setData] = useState<ExtendedMasterData>(loadExtended);
  const [expanded, setExpanded] = useState<{ cat?: string; stream?: string; subject?: string }>({});
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newStreamLabel, setNewStreamLabel] = useState<Record<string, string>>({});
  const [newSubject, setNewSubject] = useState<Record<string, string>>({});
  const [newTopic, setNewTopic] = useState<Record<string, string>>({});
  const [editingTopic, setEditingTopic] = useState<{ cat: string; subject: string; topicName: string; stream?: string } | null>(null);
  const [editingMetadata, setEditingMetadata] = useState<{ subKey: string; field: string } | null>(null);
  const [catPage, setCatPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const itemsPerPage = 5;
  const { isDark } = useTheme();

  const cellStyle = isDark
    ? { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }
    : { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(108,99,255,0.15)' };
  const inputStyle = isDark
    ? { border: '1px solid rgba(255,255,255,0.1)', color: '#E8E8F0', borderRadius: '1rem', height: '42px', padding: '0 16px', fontSize: '14px', outline: 'none', background: 'rgba(0,0,0,0.2)', width: '100%' }
    : { border: '1px solid rgba(108,99,255,0.2)', color: '#0f0e1a', borderRadius: '1rem', height: '42px', padding: '0 16px', fontSize: '14px', outline: 'none', background: 'white', width: '100%' };

  const save = (next: ExtendedMasterData) => { saveExtended(next); setData({ ...next }); };

  const addCategory = () => {
    setFormErrors({});
    const label = newCatLabel.trim(); 
    if (!label) {
      setFormErrors({ newCat: 'Please enter a level name first.' });
      setTimeout(() => setFormErrors({}), 3000);
      return;
    }
    const value = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (data.categories.some(c => c.label.toLowerCase() === label.toLowerCase() || c.value === value)) {
      setFormErrors({ newCat: ' already exists.' });
      setTimeout(() => setFormErrors({}), 3000); return;
    }
    const next = { categories: [...data.categories, { value, label, enabled: true, streams: [], subjects: [] }] };
    save(next); setNewCatLabel('');
    setSearchQuery('');
    setCatPage(Math.floor((next.categories.length - 1) / itemsPerPage));
    toast.success('Level added');
  };

  const deleteCategory = (value: string) => {
    if (!confirm('Delete this level?')) return;
    const next = { categories: data.categories.filter(c => c.value !== value) };
    save(next); setExpanded({});
    if (catPage >= Math.ceil(next.categories.length / itemsPerPage) && catPage > 0) setCatPage(catPage - 1);
  };

  const addStream = (catV: string) => {
    setFormErrors({});
    const label = (newStreamLabel[catV] || '').trim(); 
    if (!label) {
      setFormErrors({ [`stream-${catV}`]: 'Please enter a stream name first.' });
      setTimeout(() => setFormErrors({}), 3000); return;
    }
    const value = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cat = data.categories.find(c => c.value === catV);
    if (cat?.streams?.some(s => s.label.toLowerCase() === label.toLowerCase() || s.value === value)) {
      setFormErrors({ [`stream-${catV}`]: 'Stream already exists.' });
      setTimeout(() => setFormErrors({}), 3000); return;
    }
    save({ categories: data.categories.map(c => c.value === catV ? { ...c, streams: [...(c.streams || []), { value, label, enabled: true, subjects: [] }] } : c) });
    setNewStreamLabel(p => ({ ...p, [catV]: '' }));
    toast.success('Stream added');
  };

  const deleteStream = (catV: string, sV: string) => {
    if (!confirm('Delete stream?')) return;
    save({ categories: data.categories.map(c => c.value === catV ? { ...c, streams: (c.streams || []).filter(s => s.value !== sV) } : c) });
  };

  const addSubject = (catV: string, sV?: string) => {
    setFormErrors({});
    const key = sV ? `${catV}-${sV}` : catV;
    const name = (newSubject[key] || '').trim(); 
    if (!name) {
      setFormErrors({ [`subject-${key}`]: 'Please enter a subject name first.' });
      setTimeout(() => setFormErrors({}), 3000); return;
    }
    const cat = data.categories.find(c => c.value === catV);
    const existing = sV ? cat?.streams?.find(s => s.value === sV)?.subjects : cat?.subjects;
    if (existing?.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      setFormErrors({ [`subject-${key}`]: 'Subject already exists.' });
      setTimeout(() => setFormErrors({}), 3000); return;
    }
    save({ categories: data.categories.map(c => {
      if (c.value !== catV) return c;
      const sub = { name, enabled: true, topics: [], description: '', difficulty: 'Beginner' as const, gradeRange: '' };
      if (sV) return { ...c, streams: (c.streams || []).map(s => s.value === sV ? { ...s, subjects: [...s.subjects, sub] } : s) };
      return { ...c, subjects: [...(c.subjects || []), sub] };
    }) });
    setNewSubject(p => ({ ...p, [key]: '' }));
    toast.success('Subject added');
  };

  const deleteSubject = (catV: string, subN: string, sV?: string) => {
    if (!confirm('Delete subject?')) return;
    save({ categories: data.categories.map(c => {
      if (c.value !== catV) return c;
      if (sV) return { ...c, streams: (c.streams || []).map(s => s.value === sV ? { ...s, subjects: s.subjects.filter(sub => sub.name !== subN) } : s) };
      return { ...c, subjects: (c.subjects || []).filter(sub => sub.name !== subN) };
    }) });
  };

  const toggleVisibility = (catV: string, sV?: string, subN?: string, topN?: string) => {
    save({ categories: data.categories.map(c => {
      if (c.value !== catV) return c;
      if (topN && subN) {
        const mapS = (s: SubjectObj) => s.name === subN ? { ...s, topics: s.topics.map(t => t.name === topN ? { ...t, enabled: !t.enabled } : t) } : s;
        return sV ? { ...c, streams: (c.streams || []).map(s => s.value === sV ? { ...s, subjects: s.subjects.map(mapS) } : s) } : { ...c, subjects: (c.subjects || []).map(mapS) };
      }
      if (subN) {
        const mapS = (s: SubjectObj) => s.name === subN ? { ...s, enabled: !s.enabled } : s;
        return sV ? { ...c, streams: (c.streams || []).map(s => s.value === sV ? { ...s, subjects: s.subjects.map(mapS) } : s) } : { ...c, subjects: (c.subjects || []).map(mapS) };
      }
      if (sV) return { ...c, streams: (c.streams || []).map(s => s.value === sV ? { ...s, enabled: !s.enabled } : s) };
      return { ...c, enabled: !c.enabled };
    }) });
  };

  const addTopic = (catV: string, subN: string, sV?: string) => {
    setFormErrors({});
    const sk = sV ? `${catV}-${sV}-${subN}` : `${catV}-${subN}`;
    const name = (newTopic[sk] || '').trim(); 
    if (!name) {
      toast.error('Please enter a topic name first.');
      return;
    }
    const cat = data.categories.find(c => c.value === catV);
    const sub = sV ? cat?.streams?.find(s => s.value === sV)?.subjects.find(s => s.name === subN) : cat?.subjects?.find(s => s.name === subN);
    if (sub?.topics.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Topic already exists.');
      return;
    }
    save({ categories: data.categories.map(c => {
      if (c.value !== catV) return c;
      const mapS = (s: SubjectObj) => s.name === subN ? { ...s, topics: [...s.topics, { name, enabled: true }] } : s;
      return sV ? { ...c, streams: (c.streams || []).map(s => s.value === sV ? { ...s, subjects: s.subjects.map(mapS) } : s) } : { ...c, subjects: (c.subjects || []).map(mapS) };
    }) });
    setNewTopic(p => ({ ...p, [sk]: '' }));
    toast.success('Topic added');
  };

  const updateTopicLabel = (catV: string, subN: string, oldN: string, newN: string, sV?: string) => {
    save({ categories: data.categories.map(c => {
      if (c.value !== catV) return c;
      const mapS = (s: SubjectObj) => s.name === subN ? { ...s, topics: s.topics.map(t => t.name === oldN ? { ...t, name: newN.trim() } : t) } : s;
      return sV ? { ...c, streams: (c.streams || []).map(s => s.value === sV ? { ...s, subjects: s.subjects.map(mapS) } : s) } : { ...c, subjects: (c.subjects || []).map(mapS) };
    }) });
    setEditingTopic(null);
  };

  const updateSubjectMetadata = (catV: string, subN: string, field: 'description' | 'difficulty' | 'gradeRange', value: string, sV?: string) => {
    save({ categories: data.categories.map(c => {
      if (c.value !== catV) return c;
      const mapS = (s: SubjectObj) => s.name === subN ? { ...s, [field]: value } : s;
      return sV ? { ...c, streams: (c.streams || []).map(s => s.value === sV ? { ...s, subjects: s.subjects.map(mapS) } : s) } : { ...c, subjects: (c.subjects || []).map(mapS) };
    }) });
  };

  const toggleCat = (v: string) => setExpanded(p => ({ cat: p.cat === v ? undefined : v, stream: undefined, subject: undefined }));
  const toggleStream = (s: string) => setExpanded(p => ({ ...p, stream: p.stream === s ? undefined : s, subject: undefined }));
  const toggleSubject = (s: string) => setExpanded(p => ({ ...p, subject: p.subject === s ? undefined : s }));

  const renderSubjectMetadata = (cat: CategoryExtended, sub: SubjectObj, stream?: Stream) => {
    const sk = stream ? `${cat.value}-${stream.value}-${sub.name}` : `${cat.value}-${sub.name}`;
    const diffStyles = {
      Beginner: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
      Intermediate: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
      Advanced: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]' }
    };
    return (
      <div className="grid grid-cols-1 gap-5 bg-black/40 p-5 rounded-2xl border border-white/5 backdrop-blur-md shadow-inner">
        <div className="space-y-5">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] uppercase font-black tracking-[0.2em] text-blue-400/80 px-1">Difficulty Level</label>
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map(d => (
                <button key={d} onClick={() => updateSubjectMetadata(cat.value, sub.name, 'difficulty', d, stream?.value)}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 border ${sub.difficulty === d ? `${diffStyles[d].bg} ${diffStyles[d].color} ${diffStyles[d].border} ${diffStyles[d].glow} scale-[1.02]` : 'text-gray-500 border-transparent hover:bg-white/5'}`}>{d}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[9px] uppercase font-black tracking-[0.2em] text-blue-400/80">Grade Range</label>
              <button onClick={() => setEditingMetadata(editingMetadata?.subKey === sk && editingMetadata?.field === 'gradeRange' ? null : { subKey: sk, field: 'gradeRange' })} className="text-[9px] text-blue-400 font-black uppercase flex items-center gap-1 opacity-60 hover:opacity-100"><Pencil className="w-2.5 h-2.5" /> Edit</button>
            </div>
            {editingMetadata?.subKey === sk && editingMetadata?.field === 'gradeRange' ? (
              <div className="flex gap-2">
                <input style={{ ...inputStyle, height: '36px' }} id={`edit-grade-${sk}`} defaultValue={sub.gradeRange} autoFocus placeholder="e.g. 2-8" className="text-center font-black" />
                <button onClick={() => { 
                  const v = (document.getElementById(`edit-grade-${sk}`) as HTMLInputElement)?.value; 
                  if (/^\d+-\d+$/.test(v)) { updateSubjectMetadata(cat.value, sub.name, 'gradeRange', v, stream?.value); setEditingMetadata(null); } else toast.error("Format e.g. 2-8"); 
                }} className="px-3 bg-blue-500 text-white rounded-xl shadow-lg active:scale-95 transition-all"><Check className="w-4 h-4" /></button>
              </div>
            ) : <div className="text-xs text-white font-black px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-center tracking-widest">{sub.gradeRange || 'NOT SET'}</div>}
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
          <div className="flex justify-between items-center px-1">
            <label className="text-[9px] uppercase font-black tracking-[0.2em] text-blue-400/80">Description</label>
            <button onClick={() => setEditingMetadata(editingMetadata?.subKey === sk && editingMetadata?.field === 'description' ? null : { subKey: sk, field: 'description' })} className="text-[9px] text-blue-400 font-black uppercase flex items-center gap-1 opacity-60 hover:opacity-100"><Pencil className="w-2.5 h-2.5" /> Modify</button>
          </div>
          {editingMetadata?.subKey === sk && editingMetadata?.field === 'description' ? (
            <textarea style={{ ...inputStyle, height: '100px', paddingTop: '10px' }} id={`edit-desc-${sk}`} defaultValue={sub.description} autoFocus className="leading-relaxed" />
          ) : <div className="text-[11px] text-gray-400 leading-relaxed italic p-3 rounded-xl bg-black/20 border border-white/5 min-h-[60px] line-clamp-3">{sub.description || 'Add description...'}</div>}
          {editingMetadata?.subKey === sk && editingMetadata?.field === 'description' && (
            <button onClick={() => { const v = (document.getElementById(`edit-desc-${sk}`) as HTMLTextAreaElement)?.value; updateSubjectMetadata(cat.value, sub.name, 'description', v.trim(), stream?.value); setEditingMetadata(null); }} className="mt-2 w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl hover:shadow-blue-500/10 transition-all">Save Description</button>
          )}
        </div>
      </div>
    );
  };

  const renderSubjectCard = (cat: CategoryExtended, sub: SubjectObj, stream?: Stream) => {
    const sk = stream ? `${cat.value}-${stream.value}-${sub.name}` : `${cat.value}-${sub.name}`;
    const isActive = expanded.subject === sk;
    return (
      <div key={sub.name} className={`flex flex-col rounded-2xl overflow-hidden shadow-2xl h-fit group transition-all duration-500 border ${isActive ? 'border-blue-500/30 ring-1 ring-blue-500/10 scale-[1.01]' : 'border-white/5 hover:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]'}`} style={{ background: 'linear-gradient(165deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' }}>
        <div className={`flex items-center px-5 py-5 cursor-pointer hover:bg-white/[0.02] relative transition-all ${!sub.enabled ? 'opacity-40 grayscale' : ''}`} onClick={() => toggleSubject(sk)}>
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 ${sub.enabled ? (isActive ? 'bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'bg-blue-600') : 'bg-gray-700'}`} />
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 transition-all duration-300 ${isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-blue-500/10 text-blue-400'}`}><BookOpen className="w-5 h-5" /></div>
          <div className="flex-1 min-w-0"><span className="block text-sm font-black text-white uppercase truncate tracking-tight">{sub.name}</span>
            <div className="flex items-center gap-2 mt-1"><span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/5 ${sub.difficulty === 'Beginner' ? 'text-emerald-400 bg-emerald-500/5' : sub.difficulty === 'Intermediate' ? 'text-amber-400 bg-amber-500/5' : 'text-rose-400 bg-rose-500/5'}`}>{sub.difficulty}</span><span className="text-[8px] font-black uppercase tracking-widest text-gray-500 px-2 py-0.5 rounded-full border border-white/5">{sub.topics.length} Topics</span></div>
          </div>
          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button onClick={() => toggleVisibility(cat.value, stream?.value, sub.name)} className={`p-2 rounded-lg transition-all ${sub.enabled ? 'text-emerald-400 bg-emerald-500/5' : 'text-gray-500 bg-white/5'}`}>{sub.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
            <button onClick={() => deleteSubject(cat.value, sub.name, stream?.value)} className="p-2 rounded-lg text-rose-500 bg-rose-500/5 hover:bg-rose-500/20 transition-all"><Trash2 className="w-4 h-4" /></button>
            <div className={`p-2 rounded-lg bg-white/5 transition-transform duration-500 ${isActive ? 'rotate-180' : ''}`}><ChevronDown className="w-4 h-4 text-gray-500" /></div>
          </div>
        </div>
        {isActive && (
          <div className="px-5 pb-6 pt-2 space-y-5 border-t border-white/5 bg-slate-950/40 animate-in fade-in slide-in-from-top-2 duration-300">
            {renderSubjectMetadata(cat, sub, stream)}
            <div className="flex items-center gap-3 px-1"><div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" /><p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500">Topics</p><div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>
            <div className="flex flex-col gap-2.5">
              {sub.topics.map((t, idx) => {
                const isEditing = editingTopic?.cat === cat.value && editingTopic?.subject === sub.name && editingTopic?.topicName === t.name && editingTopic?.stream === stream?.value;
                return (
                  <div key={t.name} className={`group/topic flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/[0.08] hover:border-white/10 ${!t.enabled ? 'opacity-40 grayscale' : ''}`}>
                    <div className="flex-1 flex items-center gap-3"><div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-400 border border-blue-500/10">{idx + 1}</div>
                      {isEditing ? (
                        <div className="flex-1 flex gap-2"><input style={{ ...inputStyle, height: '30px' }} id={`edit-topic-${sk}-${idx}`} defaultValue={t.name} autoFocus className="font-bold" />
                          <button onClick={() => { const v = (document.getElementById(`edit-topic-${sk}-${idx}`) as HTMLInputElement)?.value; if (v) updateTopicLabel(cat.value, sub.name, t.name, v, stream?.value); }} className="text-emerald-400 p-1 hover:bg-emerald-500/10 rounded-lg"><Check className="w-5 h-5" /></button>
                          <button onClick={() => setEditingTopic(null)} className="text-rose-400 p-1 hover:bg-rose-500/10 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                      ) : <span className="text-xs font-bold text-gray-50 uppercase tracking-tight">{t.name}</span>}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover/topic:opacity-100 transition-opacity">
                      {!isEditing && <button onClick={() => setEditingTopic({ cat: cat.value, subject: sub.name, topicName: t.name, stream: stream?.value })} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"><Pencil className="w-4 h-4" /></button>}
                      <button onClick={() => toggleVisibility(cat.value, stream?.value, sub.name, t.name)} className={`p-2 rounded-lg ${t.enabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-500 hover:bg-white/10'}`}><Eye className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Delete topic?')) {
                        save({ categories: data.categories.map(c => {
                          if (c.value !== cat.value) return c;
                          const mapS = (s: SubjectObj) => s.name === sub.name ? { ...s, topics: s.topics.filter(top => top.name !== t.name) } : s;
                          return stream ? { ...c, streams: (c.streams || []).map(s => s.value === stream.value ? { ...s, subjects: s.subjects.map(mapS) } : s) } : { ...c, subjects: (c.subjects || []).map(mapS) };
                        }) });
                      } }} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-4">
              <input style={{ ...inputStyle, height: '40px' }} placeholder="Add specialized topic..." value={newTopic[sk] || ''} onChange={e => setNewTopic(p => ({ ...p, [sk]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addTopic(cat.value, sub.name, stream?.value)} className="font-bold px-4" />
              <button onClick={() => addTopic(cat.value, sub.name, stream?.value)} className="px-5 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all">Add</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredCategories = (data.categories.map(cat => {
    const q = searchQuery.toLowerCase(); if (!q) return cat;
    const mtCat = cat.label.toLowerCase().includes(q);
    const flStreams = (cat.streams || []).map(st => {
      const mtS = st.label.toLowerCase().includes(q);
      const flSubs = st.subjects.map(sub => {
        const mtSub = sub.name.toLowerCase().includes(q) || (sub.description || '').toLowerCase().includes(q);
        const flT = sub.topics.filter(t => t.name.toLowerCase().includes(q));
        if (mtSub || flT.length > 0) return { ...sub, topics: mtSub ? sub.topics : flT };
        return null;
      }).filter((s): s is SubjectObj => s !== null);
      if (mtS || flSubs.length > 0) return { ...st, subjects: mtS ? st.subjects : flSubs };
      return null;
    }).filter((st): st is Stream => st !== null);
    const flDirect = (cat.subjects || []).map(sub => {
      const mtSub = sub.name.toLowerCase().includes(q) || (sub.description || '').toLowerCase().includes(q);
      const flT = sub.topics.filter(t => t.name.toLowerCase().includes(q));
      if (mtSub || flT.length > 0) return { ...sub, topics: mtSub ? sub.topics : flT };
      return null;
    }).filter((s): s is SubjectObj => s !== null);
    if (mtCat || flStreams.length > 0 || flDirect.length > 0) return { ...cat, streams: mtCat ? (cat.streams || []) : flStreams, subjects: mtCat ? (cat.subjects || []) : flDirect };
    return null;
  }).filter((c): c is CategoryExtended => c !== null));

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCats = filteredCategories.slice(catPage * itemsPerPage, (catPage + 1) * itemsPerPage);
  useEffect(() => { setCatPage(0); }, [searchQuery]);

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto px-4 lg:px-8 pb-12 animate-in fade-in duration-1000">
      <div className="rounded-[2rem] p-10 shadow-2xl border border-white/5 relative overflow-hidden" style={cellStyle}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="flex items-center gap-4 mb-8">
          <div className="w-3 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
          <h3 className="font-black text-lg text-white uppercase tracking-[0.2em]">Academic Architecture</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-5 relative z-10">
          <div className="relative flex-1">
            <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400/50" />
            <input style={{ ...inputStyle, paddingLeft: '50px', height: '54px', fontSize: '15px' }} placeholder="Define New Level (e.g. A/L, IGCSE)..." value={newCatLabel} onChange={e => setNewCatLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} className="font-bold shadow-inner" />
            {formErrors.newCat && <p className="text-[10px] font-black text-rose-500 mt-2 ml-4 uppercase tracking-[0.2em] animate-bounce">{formErrors.newCat}</p>}
          </div>
          <button onClick={addCategory} className="px-10 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-xs rounded-[1.25rem] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 h-[54px]"><Plus className="w-5 h-5 stroke-[4]" /> Construct Level</button>
        </div>
      </div>

      <div className="relative group/search max-w-2xl mx-auto w-full px-2 mb-12 pb-10 z-10">
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 rounded-[3rem] blur opacity-0 group-focus-within/search:opacity-30 transition-opacity duration-1000 animate-pulse" />
        <div className="relative flex items-center bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] transition-all duration-500 group-focus-within/search:border-blue-500/50 group-focus-within/search:scale-[1.03]">
          <div className="flex items-center justify-center w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-indigo-700 text-white shadow-[0_0_25px_rgba(59,130,246,0.4)] group-focus-within/search:rotate-90 transition-all duration-700"><Search className="w-6 h-6" /></div>
          <input style={{ ...inputStyle, border: 'none', background: 'transparent', height: '60px', fontSize: '16px', fontWeight: '800' }} placeholder="Command Search Keywords..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 px-6 placeholder:text-gray-700 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.4em] text-white" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="mr-4 p-3 hover:bg-white/10 rounded-2xl text-gray-500 hover:text-white transition-all group/clear"><X className="w-5 h-5 group-hover/clear:rotate-90 transition-transform" /></button>}
        </div>
        {searchQuery && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 animate-in fade-in zoom-in duration-500 bg-blue-500/10 px-6 py-2.5 rounded-full border border-blue-500/20 backdrop-blur-2xl shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" /> {filteredCategories.length} Signals Found
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-950/60 border border-white/5 p-6 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
          <button disabled={catPage === 0} onClick={() => setCatPage(p => p - 1)} className="px-8 py-4 bg-white/5 text-blue-400 rounded-2xl disabled:opacity-20 transition-all font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 border border-white/5 hover:bg-blue-500/10"><ChevronLeft className="w-5 h-5" /> Previous Deck</button>
          <div className="flex gap-4">{Array.from({ length: totalPages }).map((_, i) => (<button key={i} onClick={() => setCatPage(i)} className={`h-2.5 rounded-full transition-all duration-500 ${catPage === i ? 'bg-blue-500 w-16 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'bg-white/10 w-4 hover:bg-white/20'}`} />))}</div>
          <button disabled={catPage === totalPages - 1} onClick={() => setCatPage(p => p + 1)} className="px-8 py-4 bg-white/5 text-blue-400 rounded-2xl disabled:opacity-20 transition-all font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 border border-white/5 hover:bg-blue-500/10">Next Deck <ChevronRight className="w-5 h-5" /></button>
        </div>
      )}

      <div className="space-y-8">
        {paginatedCats.map(cat => (
          <div key={cat.value} className="rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] transition-all duration-700 relative group/level" style={{ ...cellStyle, border: expanded.cat === cat.value ? '2px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.05)' }}>
            {expanded.cat === cat.value && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent blur-sm" />}
            <div className={`flex items-center gap-8 p-10 cursor-pointer hover:bg-white/[0.03] transition-all ${!cat.enabled ? 'opacity-40 grayscale' : ''}`} onClick={() => toggleCat(cat.value)}>
              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 ${expanded.cat === cat.value ? 'bg-blue-600 text-white rotate-6 scale-110 shadow-blue-500/40' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>{expanded.cat === cat.value ? <FolderOpen className="w-10 h-10" /> : <FolderClosed className="w-10 h-10" />}</div>
              <div className="flex-1">
                <div className="text-xl font-black text-white uppercase tracking-tight group-hover/level:translate-x-1 transition-transform">{cat.label}</div>
                <div className="flex items-center gap-4 mt-3"><span className="text-[10px] text-blue-400 font-black uppercase bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/10">{(cat.streams || []).length} Strategic Streams</span><span className="text-[10px] text-purple-400 font-black uppercase bg-purple-500/10 px-4 py-1.5 rounded-full border border-purple-500/10">{(cat.subjects || []).length} Core Modules</span></div>
              </div>
              <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                <button onClick={() => toggleVisibility(cat.value)} className={`p-3 rounded-2xl transition-all ${cat.enabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-600 bg-white/5'}`}><Eye className="w-6 h-6" /></button>
                <button onClick={() => deleteCategory(cat.value)} className="p-3 rounded-2xl text-rose-500 bg-rose-500/5 hover:bg-rose-500/20 transition-all"><Trash2 className="w-6 h-6" /></button>
                <div className={`p-3 rounded-2xl bg-white/5 transition-transform duration-700 ${expanded.cat === cat.value ? 'rotate-180 bg-blue-500/20' : ''}`}><ChevronDown className="w-7 h-7 text-gray-500" /></div>
              </div>
            </div>
            {expanded.cat === cat.value && (
              <div className="p-12 pt-6 space-y-16 bg-slate-950/60 border-t border-white/5 backdrop-blur-3xl animate-in zoom-in-95 duration-700">
                <div className="space-y-8">
                  <div className="flex items-center gap-5"><p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.5em] whitespace-nowrap">Streams Hierarchy</p><div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent" /></div>
                  <div className="grid grid-cols-1 gap-8">{(cat.streams || []).map(st => (
                    <div key={st.value} className="rounded-[2.5rem] overflow-hidden border border-white/5 bg-slate-900/30 shadow-2xl group/stream transition-all hover:border-white/10">
                      <div className={`flex items-center gap-5 p-7 cursor-pointer hover:bg-white/[0.04] transition-all ${!st.enabled ? 'opacity-40 grayscale' : ''}`} onClick={() => toggleStream(st.value)}>
                        <div className={`w-11 h-11 rounded-[1rem] flex items-center justify-center transition-all duration-500 ${expanded.stream === st.value ? 'bg-blue-400 text-slate-950 rotate-90 scale-110' : 'bg-white/5 text-blue-400 border border-white/5'}`}><ChevronRight className="w-6 h-6" /></div>
                        <div className="flex-1 font-black text-2xl text-white uppercase tracking-tight">{st.label}</div>
                        <div className="flex gap-3" onClick={e => e.stopPropagation()}>
                          <button onClick={() => toggleVisibility(cat.value, st.value)} className={st.enabled ? 'text-emerald-400' : 'text-gray-600'}><Eye className="w-5 h-5" /></button>
                          <button onClick={() => deleteStream(cat.value, st.value)} className="text-rose-500"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                      {expanded.stream === st.value && (
                        <div className="p-8 pt-0 space-y-10 animate-in slide-in-from-left-4 duration-500">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">{(st.subjects || []).map(sub => renderSubjectCard(cat, sub, st))}</div>
                          <div className="flex flex-col gap-2 max-w-2xl pt-8 border-t border-white/5">
                            <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-[1.5rem] bg-blue-500/5 border border-blue-500/10">
                              <div className="relative flex-1"><BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/50" /><input style={{ ...inputStyle, paddingLeft: '48px', height: '48px' }} placeholder="Subject Master Name..." value={newSubject[`${cat.value}-${st.value}`] || ''} onChange={e => setNewSubject(p => ({ ...p, [`${cat.value}-${st.value}`]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addSubject(cat.value, st.value)} className="font-bold" /></div>
                              <button onClick={() => addSubject(cat.value, st.value)} className="px-8 py-3 bg-blue-500 text-white text-xs font-black uppercase rounded-xl shadow-lg shadow-blue-500/20 h-[48px]">Deploy Subject</button>
                            </div>
                            {formErrors[`subject-${cat.value}-${st.value}`] && <p className="text-[10px] font-black text-rose-500 mt-1 ml-4 uppercase tracking-widest">{formErrors[`subject-${cat.value}-${st.value}`]}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}</div>
                  <div className="flex flex-col gap-2 max-w-xl mt-12">
                    <div className="flex flex-col sm:flex-row gap-4 p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 shadow-2xl backdrop-blur-xl">
                      <input style={{ ...inputStyle, flex: 1, height: '50px' }} placeholder="Inject New Stream Title..." value={newStreamLabel[cat.value] || ''} onChange={e => setNewStreamLabel(p => ({ ...p, [cat.value]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addStream(cat.value)} className="font-bold" />
                      <button onClick={() => addStream(cat.value)} className="px-8 py-3 bg-indigo-500/10 text-indigo-400 text-xs font-black uppercase rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 h-[50px]">Form Stream</button>
                    </div>
                    {formErrors[`stream-${cat.value}`] && <p className="text-[10px] font-black text-rose-500 mt-1 ml-4 uppercase tracking-widest">{formErrors[`stream-${cat.value}`]}</p>}
                  </div>
                </div>
                <div className="space-y-8 pt-10 border-t border-white/5">
                  <div className="flex items-center gap-5"><p className="text-[11px] font-black text-purple-500 uppercase tracking-[0.5em] whitespace-nowrap">Direct Academic Modules</p><div className="h-px flex-1 bg-gradient-to-r from-purple-500/30 to-transparent" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">{(cat.subjects || []).map(sub => renderSubjectCard(cat, sub))}</div>
                  <div className="flex flex-col gap-2 max-w-xl mt-6">
                    <div className="flex flex-col sm:flex-row gap-4 p-6 rounded-[2rem] bg-purple-500/5 border border-purple-500/10 shadow-2xl backdrop-blur-xl">
                      <input style={{ ...inputStyle, flex: 1, height: '50px' }} placeholder="Create Core Subject..." value={newSubject[cat.value] || ''} onChange={e => setNewSubject(p => ({ ...p, [cat.value]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addSubject(cat.value)} className="font-bold" />
                      <button onClick={() => addSubject(cat.value)} className="px-8 py-3 bg-purple-500/10 text-purple-400 text-xs font-black uppercase rounded-xl border border-purple-500/20 hover:bg-purple-500/20 h-[50px]">Deploy Subject</button>
                    </div>
                    {formErrors[`subject-${cat.value}`] && <p className="text-[10px] font-black text-rose-500 mt-1 ml-4 uppercase tracking-widest">{formErrors[`subject-${cat.value}`]}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="text-center py-32 rounded-[4rem] border-4 border-dashed border-white/5 bg-slate-900/20" style={cellStyle}>
            <Search className="w-24 h-24 text-gray-800 mx-auto mb-8 opacity-20 animate-pulse" /><p className="text-gray-600 font-black uppercase tracking-[0.5em] text-sm">No Signal match found in the database</p>
          </div>
        )}
      </div>
    </div>
  );
}