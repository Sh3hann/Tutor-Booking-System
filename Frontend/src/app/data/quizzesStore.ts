/**
 * Local storage based quiz store.
 * Quizzes are linked to subjects from the subjects store.
 */

export interface Question {
  id: string;
  text: string;
  type: 'MCQ';
  options: string[];
  correctAnswer: number; // index
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  timeLimit: number; // in minutes
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'admin-quizzes-master';

export function getQuizzes(): Quiz[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveQuizzes(quizzes: Quiz[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
}

export function addQuiz(quiz: Quiz): void {
  const quizzes = getQuizzes();
  quizzes.push(quiz);
  saveQuizzes(quizzes);
}

export function updateQuiz(updatedQuiz: Quiz): void {
  const quizzes = getQuizzes();
  const index = quizzes.findIndex(q => q.id === updatedQuiz.id);
  if (index !== -1) {
    quizzes[index] = { ...updatedQuiz, updatedAt: new Date().toISOString() };
    saveQuizzes(quizzes);
  }
}

export function deleteQuiz(id: string): void {
  const quizzes = getQuizzes();
  const filtered = quizzes.filter(q => q.id !== id);
  saveQuizzes(filtered);
}
