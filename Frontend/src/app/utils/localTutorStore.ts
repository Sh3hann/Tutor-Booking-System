/**
 * Local/dummy storage for tutor profiles - no database or API calls.
 * Uses localStorage for demo/development when backend is unavailable.
 */

const STORAGE_KEY = 'tutor-local-profiles';
const SESSION_KEY = 'tutor-dummy-session';

export interface LocalTutorProfile {
  tutorId: string;
  name: string;
  email: string;
  photoUrl: string;
  bio: string;
  hourlyRate: number;
  location: string;
  contactPhone: string;
  timetable: string;
  qualifications: { title: string; photo: string }[];
  subjects: { category: string; subject: string; mediums: string[] }[];
  classTypes: string[];
  classFormats: string[];
  introVideoUrl?: string;
  updatedAt: string;
}

export interface DummySession {
  id: string;
  email: string;
  name: string;
  user_metadata: { name: string; role: string };
}

function generateId(): string {
  return 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

export const localTutorStore = {
  saveProfile(profileData: {
    tutorId?: string;
    name: string;
    email: string;
    photo: string;
    bio: string;
    hourlyRate: number;
    location: string;
    contactPhone: string;
    timetable: string;
    qualifications?: { title: string; photo: string }[];
    subjects?: { category: string; subject: string; mediums: string[] }[];
    classTypes?: string[];
    classFormats?: string[];
    introVideoUrl?: string;
  }): { tutorId: string; session: DummySession } {
    const tutorId = profileData.tutorId || generateId();
    const profile: LocalTutorProfile = {
      tutorId,
      name: profileData.name,
      email: profileData.email,
      photoUrl: profileData.photo || '',
      bio: profileData.bio || '',
      hourlyRate: profileData.hourlyRate || 0,
      location: profileData.location || '',
      contactPhone: profileData.contactPhone || '',
      timetable: profileData.timetable || '',
      qualifications: profileData.qualifications || [],
      subjects: profileData.subjects || [],
      classTypes: profileData.classTypes || [],
      classFormats: profileData.classFormats || [],
      introVideoUrl: profileData.introVideoUrl || '',
      updatedAt: new Date().toISOString(),
    };

    const profiles = this.getAllProfiles();
    profiles[tutorId] = profile;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));

    const session: DummySession = {
      id: tutorId,
      email: profileData.email,
      name: profileData.name,
      user_metadata: { name: profileData.name, role: 'tutor' },
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return { tutorId, session };
  },

  getSession(): DummySession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  getProfile(tutorId: string): LocalTutorProfile | null {
    const profiles = this.getAllProfiles();
    return profiles[tutorId] || null;
  },

  getMyProfile(): LocalTutorProfile | null {
    const session = this.getSession();
    if (!session) return null;
    return this.getProfile(session.id);
  },

  updateProfile(tutorId: string, updates: Partial<LocalTutorProfile>): void {
    const profiles = this.getAllProfiles();
    const existing = profiles[tutorId];
    if (!existing) return;

    profiles[tutorId] = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  },

  getAllProfiles(): Record<string, LocalTutorProfile> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
};
