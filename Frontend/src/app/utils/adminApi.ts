/**
 * Admin API client - calls local Backend (port 3001) with JWT.
 * Used for admin dashboard: users, tutor-requests, subjects.
 */

import { getStoredToken } from './authService';

function getApiBase(): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:3001/api`;
}

async function fetchAdmin(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  const res = await fetch(`${getApiBase()}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }
  return data;
}

export const adminBackendApi = {
  getUsers: () => fetchAdmin('/admin/users'),
  updateUserRole: (userId: string, role: string) =>
    fetchAdmin(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  updateUserEmail: (userId: string, email: string) =>
    fetchAdmin(`/admin/users/${userId}/email`, { method: 'PATCH', body: JSON.stringify({ email }) }),
  deleteUser: (userId: string) => fetchAdmin(`/admin/users/${userId}`, { method: 'DELETE' }),

  getTutorRequests: (status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return fetchAdmin(`/admin/tutor-requests${q}`);
  },
  getTutorRequest: (id: string) => fetchAdmin(`/admin/tutor-requests/${id}`),
  approveTutorRequest: (id: string) =>
    fetchAdmin(`/admin/tutor-requests/${id}/approve`, { method: 'PATCH' }),
  rejectTutorRequest: (id: string, reason: string) =>
    fetchAdmin(`/admin/tutor-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  getSubjects: () => fetchAdmin('/admin/subjects'),
  saveSubjects: (data: { categories: { value: string; label: string }[]; subjectsByCategory: Record<string, string[]> }) =>
    fetchAdmin('/admin/subjects', { method: 'PUT', body: JSON.stringify(data) }),

  getQuizzes: () => fetchAdmin('/admin/quizzes'),
  saveQuizzes: (quizzes: any[]) =>
    fetchAdmin('/admin/quizzes', { method: 'PUT', body: JSON.stringify({ quizzes }) }),

  // ── Institute management (admin: read, delete, approve/reject requests only) ─
  getInstitutes: () => fetchAdmin('/institutes'),
  getInstituteRequests: () => fetchAdmin('/institutes/requests/all'),
  // createInstitute: REMOVED — institutes are only created via the approve flow
  // updateInstitute: REMOVED — only the institute manager/creator can edit
  deleteInstitute: (id: string) =>
    fetchAdmin(`/institutes/${id}`, { method: 'DELETE' }),
  approveInstituteRequest: (data: any) =>
    fetchAdmin('/institutes/requests/approve', { method: 'POST', body: JSON.stringify(data) }),
  rejectInstituteRequest: (id: string) =>
    fetchAdmin(`/institutes/requests/${id}/reject`, { method: 'PATCH', body: JSON.stringify({}) }),
  // ── Institute Manager Registrations ─────────────────────────────────────────
  getManagerRegistrations: () => fetchAdmin('/institutes/manager-registrations'),
  approveManagerRegistration: (requestId: string) =>
    fetchAdmin(`/institutes/manager-registrations/${requestId}/approve`, { method: 'POST' }),
  rejectManagerRegistration: (requestId: string, reason?: string) =>
    fetchAdmin(`/institutes/manager-registrations/${requestId}/reject`, { method: 'PATCH', body: JSON.stringify({ reason: reason || 'Rejected by admin' }) }),
};

