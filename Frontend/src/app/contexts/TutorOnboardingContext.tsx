import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface SubjectSelection {
  category: string;
  subject: string;
  mediums: string[];
}

export interface QualificationEntry {
  title: string;
  photo: string;
}

export interface TutorOnboardingData {
  // Step 1
  name: string;
  email: string;
  password: string;
  // Step 2
  photo: string;
  bio: string;
  hourlyRate: string;
  contactPhone: string;
  location: string;
  timetable: string;
  // Step 3 - Subjects & Qualifications (only during signup)
  qualifications: QualificationEntry[];
  subjects: SubjectSelection[];
  classTypes: string[];
  classFormats: string[];
}

const initialData: TutorOnboardingData = {
  name: '',
  email: '',
  password: '',
  photo: '',
  bio: '',
  hourlyRate: '',
  contactPhone: '',
  location: '',
  timetable: '',
  qualifications: [],
  subjects: [],
  classTypes: [],
  classFormats: [],
};

interface TutorOnboardingContextType {
  data: TutorOnboardingData;
  setData: (data: Partial<TutorOnboardingData> | ((prev: TutorOnboardingData) => TutorOnboardingData)) => void;
  resetData: () => void;
}

const TutorOnboardingContext = createContext<TutorOnboardingContextType | null>(null);

export function TutorOnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<TutorOnboardingData>(initialData);

  const setData = useCallback((update: Partial<TutorOnboardingData> | ((prev: TutorOnboardingData) => TutorOnboardingData)) => {
    setDataState((prev) => {
      if (typeof update === 'function') {
        return update(prev);
      }
      return { ...prev, ...update };
    });
  }, []);

  const resetData = useCallback(() => {
    setDataState(initialData);
  }, []);

  return (
    <TutorOnboardingContext.Provider value={{ data, setData, resetData }}>
      {children}
    </TutorOnboardingContext.Provider>
  );
}

export function useTutorOnboarding() {
  const ctx = useContext(TutorOnboardingContext);
  if (!ctx) {
    throw new Error('useTutorOnboarding must be used within TutorOnboardingProvider');
  }
  return ctx;
}
