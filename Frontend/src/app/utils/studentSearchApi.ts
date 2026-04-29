/**
 * Student search tutors - uses local Backend (proxy in dev).
 * GET /api/tutors/search with optional filters.
 * POST /api/tutors/:tutorId/reviews for ratings (student only, requires auth).
 */

import { getStoredToken } from './authService';

function getApiBase(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001/api';
  const origin = window.location.origin;
  const port = window.location.port;
  if (port === '5173' || port === '5174') return `${origin}/api`;
  return `http://${window.location.hostname}:3001/api`;
}

export interface SearchTutorsParams {
  category?: string;
  subject?: string;
  medium?: string;
  classType?: string;
  classFormat?: string;
}

export interface TutorSearchResult {
  tutorId: string;
  id: string;
  name: string;
  fullName: string;
  subjects: { category?: string; subject?: string; mediums?: string[] }[];
  classTypes?: string[];
  classFormats?: string[];
  bio?: string;
  /** Hourly rate in LKR; null/undefined when not set */
  hourlyRate?: number | null;
  photoUrl?: string;
  location?: string;
  contactPhone?: string;
  avgRating: number;
  ratingCount: number;
  timetable?: string;
  qualifications?: { title: string; photo: string }[];
  introVideoUrl?: string;
  instituteId?: string;
  reviews?: {

    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    studentName: string | null;
  }[];
}

export async function searchTutors(params: SearchTutorsParams): Promise<{ tutors: TutorSearchResult[] }> {
  const q = new URLSearchParams();
  if (params.category) q.set('category', params.category);
  if (params.subject) q.set('subject', params.subject);
  if (params.medium) q.set('medium', params.medium);
  if (params.classType) q.set('classType', params.classType);
  if (params.classFormat) q.set('classFormat', params.classFormat);
  const url = `${getApiBase()}/tutors/search${q.toString() ? `?${q.toString()}` : ''}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Search failed');
  return { tutors: data.tutors || [] };
}

export async function submitReview(tutorId: string, rating: number, comment: string): Promise<void> {
  const token = getStoredToken();
  if (!token) throw new Error('Please log in to submit a rating');
  const res = await fetch(`${getApiBase()}/tutors/${tutorId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rating, comment: comment.trim().slice(0, 2000) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to submit rating');
}

export async function getTutorDetails(tutorId: string): Promise<TutorSearchResult> {
  const url = `${getApiBase()}/tutors/${encodeURIComponent(tutorId)}/details`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load tutor profile');
  }
  return data.tutor as TutorSearchResult;
}
