/**
 * TutorCategories - Category/Stream/Subject browse page
 */
import { useNavigate } from 'react-router';
import { getEffectiveCategories, getEffectiveSubjectsByCategory } from '../data/subjectsStore';
import { ArrowLeft, BookOpen, Hash } from 'lucide-react';

export function TutorCategories() {
  const navigate = useNavigate();
  const categories = getEffectiveCategories();
  const subjectsByCategory = getEffectiveSubjectsByCategory();

  return (
    <div className="min-h-screen" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/tutor/dashboard')}
            className="p-2.5 rounded-xl transition-all hover:scale-105 hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#A0A0C0' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Categories &amp; Subjects</h1>
            <p style={{ color: '#8888AA', fontSize: '0.9rem', marginTop: '2px' }}>
              Browse available streams and subjects for tutoring
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-8 p-4 rounded-2xl" style={{
          background: 'rgba(124,111,255,0.08)',
          border: '1px solid rgba(124,111,255,0.2)'
        }}>
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 flex-shrink-0" style={{ color: '#7C6FFF' }} />
            <p className="text-sm" style={{ color: '#9999CC' }}>
              <strong style={{ color: '#A89CFF' }}>3-Level hierarchy:</strong>{' '}
              Category → Stream → Subject. Managed by admin. Contact admin to add or update subjects.
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="space-y-4">
          {categories.map((category, i) => {
            const subjects = subjectsByCategory[category.value] || [];
            return (
              <div
                key={category.value}
                className="rounded-2xl p-5 transition-all hover:-translate-y-0.5 fade-up"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(124,111,255,0.15)' }}>
                      <Hash className="w-4 h-4" style={{ color: '#7C6FFF' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{category.label}</h3>
                      <p style={{ color: '#666688', fontSize: '0.78rem' }}>
                        {subjects.length} subject{subjects.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ background: 'rgba(124,111,255,0.12)', color: '#9988FF', border: '1px solid rgba(124,111,255,0.2)' }}>
                    {subjects.length}
                  </span>
                </div>

                {subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <span
                        key={subject}
                        className="text-sm transition-all hover:-translate-y-0.5"
                        style={{
                          padding: '4px 12px',
                          borderRadius: '999px',
                          background: 'rgba(255,255,255,0.07)',
                          border: '1px solid rgba(255,255,255,0.09)',
                          color: 'rgba(210,210,240,0.9)',
                          cursor: 'default',
                        }}
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#555577', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    No subjects configured yet.
                  </p>
                )}
              </div>
            );
          })}

          {categories.length === 0 && (
            <div className="text-center py-16 rounded-2xl" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: '#444466' }} />
              <p style={{ color: '#666688' }}>No categories configured. Ask your admin to add them.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
