/**
 * Effective subject data: admin master list (localStorage) or default from subjects.ts.
 * Only admin can change the master list via AdminSubjectManagement.
 */
import { SUBJECT_CATEGORIES, SUBJECTS_BY_CATEGORY } from './subjects';

const STORAGE_KEY = 'admin-subjects-master';

export interface CategoryItem {
  value: string;
  label: string;
}

export type SubjectsByCategory = Record<string, string[]>;

export interface MasterSubjectsData {
  categories: CategoryItem[];
  subjectsByCategory: SubjectsByCategory;
}

function getStored(): MasterSubjectsData | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MasterSubjectsData;
    if (Array.isArray(parsed.categories) && parsed.subjectsByCategory && typeof parsed.subjectsByCategory === 'object') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/** Effective categories for the app (admin master or default). */
export function getEffectiveCategories(): CategoryItem[] {
  const stored = getStored();
  return stored ? stored.categories : SUBJECT_CATEGORIES;
}

/** Effective subjects by category (admin master or default). */
export function getEffectiveSubjectsByCategory(): SubjectsByCategory {
  const stored = getStored();
  return stored ? stored.subjectsByCategory : SUBJECTS_BY_CATEGORY;
}

/** Admin only: get full master data for editing. */
export function getMasterSubjects(): MasterSubjectsData {
  const stored = getStored();
  if (stored) return stored;
  return {
    categories: [...SUBJECT_CATEGORIES],
    subjectsByCategory: { ...SUBJECTS_BY_CATEGORY },
  };
}

/** Admin only: save master data (categories + subjects by category). */
export function setMasterSubjects(data: MasterSubjectsData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
