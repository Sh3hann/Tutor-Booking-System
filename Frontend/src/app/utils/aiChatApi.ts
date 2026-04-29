import { getStoredToken } from './authService';

function getGuestId(): string {
  let gid = localStorage.getItem('th_ai_guest_id');
  if (!gid) {
    gid = `guest-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    localStorage.setItem('th_ai_guest_id', gid);
  }
  return gid;
}

function getApiBase(): string {
  // Optional override to use external API host (per user request: live.chat.com)
  // Example: VITE_LIVE_CHAT_API_BASE="https://live.chat.com/api"
  const override = (import.meta as any)?.env?.VITE_LIVE_CHAT_API_BASE as string | undefined;
  if (override && typeof override === 'string') return override.replace(/\/$/, '');

  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:3001/api`;
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = getStoredToken() || localStorage.getItem('token');
  const guestId = getGuestId();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Guest-ID': guestId,
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${getApiBase()}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

export type AiChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type AiChatMessage = {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export const aiChatApi = {
  listSessions: (): Promise<{ sessions: AiChatSession[] }> => apiCall('/ai-chat/sessions', { method: 'GET' }),

  createSession: (): Promise<{ session: AiChatSession }> =>
    apiCall('/ai-chat/sessions', { method: 'POST', body: JSON.stringify({}) }),

  getMessages: (sessionId: string): Promise<{ messages: AiChatMessage[] }> =>
    apiCall(`/ai-chat/sessions/${encodeURIComponent(sessionId)}/messages`, { method: 'GET' }),

  sendMessage: (sessionId: string, content: string): Promise<{ userMessage: AiChatMessage; assistantMessage: AiChatMessage; session: AiChatSession }> =>
    apiCall(`/ai-chat/sessions/${encodeURIComponent(sessionId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  deleteSession: (sessionId: string): Promise<{ success: true }> =>
    apiCall(`/ai-chat/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' }),

  clearSessions: (): Promise<{ success: true }> => apiCall('/ai-chat/sessions', { method: 'DELETE' }),
  checkHealth: (): Promise<{ success: boolean; ollama: boolean }> => apiCall('/ai-chat/health', { method: 'GET' }),
};

