/**
 * Chat API client - uses same host as frontend so it works when accessed via LAN IP
 * Falls back to local data when backend unavailable (Failed to fetch)
 */

import { localAuthStore } from './localAuthStore';

function getApiBase(): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:3001/api`;
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${getApiBase()}${url}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Request failed');
    }
    return data;
  } catch (err) {
    throw err;
  }
}

async function fetchWithAuthOrFallback(url: string, options: RequestInit = {}, fallback: any): Promise<any> {
  try {
    return await fetchWithAuth(url, options);
  } catch {
    return fallback;
  }
}

export const chatApi = {
  getTutors: async (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const result = await fetchWithAuthOrFallback(`/tutors${q}`, {}, null);
    if (result !== null) return Array.isArray(result) ? result : result.tutors || [];
    return localAuthStore.getTutors(search);
  },

  createChatRequest: (tutorId: string) =>
    fetchWithAuth('/chat/requests', {
      method: 'POST',
      body: JSON.stringify({ tutorId }),
    }),

  getTutorPendingRequests: (status = 'PENDING') =>
    fetchWithAuthOrFallback(`/tutor/chat/requests?status=${status}`, {}, { requests: [] }),

  acceptRequest: (requestId: string) =>
    fetchWithAuth(`/chat/requests/${requestId}/accept`, { method: 'PATCH' }),

  rejectRequest: (requestId: string) =>
    fetchWithAuth(`/chat/requests/${requestId}/reject`, { method: 'PATCH' }),

  getThreads: () => fetchWithAuthOrFallback('/chat/threads', {}, { threads: [] }),

  getMessages: (threadId: string, limit = 50) =>
    fetchWithAuthOrFallback(`/chat/threads/${threadId}/messages?limit=${limit}`, {}, { messages: [] }),
};
