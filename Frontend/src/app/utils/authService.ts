/**
 * Auth service - tries API first, falls back to local storage when backend unavailable
 * Ensures login/register work even when backend returns "Failed to fetch"
 */

import { localAuthStore } from './localAuthStore';

function getApiBase(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001/api';
  const origin = window.location.origin;
  const port = window.location.port;
  const host = window.location.hostname || 'localhost';
  // In local dev, use the proxy to avoid CORS issues
  if (host === 'localhost' || host === '127.0.0.1') {
    return `${origin}/api`;
  }
  // If frontend and backend are served from the same origin (common in prod), `/api` is also correct.
  if (!port) {
    return `${origin}/api`;
  }
  return `http://${host}:3001/api`;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export interface AuthUser {
  id: string;
  role: string;
  fullName: string;
  email?: string;
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!(getStoredToken() && getStoredUser());
}

async function tryApiLogin(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${getApiBase()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  const user = data.user || {};
  return {
    token: data.token,
    user: {
      ...user,          // preserve photoUrl, grade, contactNumber, etc.
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
    },
  };
}

async function tryApiRegister(
  email: string,
  password: string,
  fullName: string,
  role: 'student' | 'tutor'
): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${getApiBase()}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName, role }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  return { token: data.token, user: data.user };
}

function isNetworkError(err: unknown): boolean {
  const msg = String((err as any)?.message || err || '');
  const lower = msg.toLowerCase();
  return (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    (lower.includes('fetch') && lower.includes('typeerror'))
  );
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  let result: { token: string; user: AuthUser } | null = null;

  try {
    result = await tryApiLogin(email, password);
  } catch (err) {
    if (!isNetworkError(err)) {
      // Real API error (e.g. invalid credentials) – do NOT fall back to local store
      throw err;
    }
  }

  if (!result) {
    result = localAuthStore.login(email, password);
  }

  if (result) {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    return result;
  }

  throw new Error('Login failed');
}

export async function register(
  email: string,
  password: string,
  fullName: string,
  role: 'student' | 'tutor'
): Promise<{ token: string; user: AuthUser }> {
  let result: { token: string; user: AuthUser } | null = null;

  try {
    result = await tryApiRegister(email, password, fullName, role);
  } catch (err) {
    if (!isNetworkError(err)) {
      // Real API error (e.g. email already registered) – do NOT fall back to local store
      throw err;
    }
  }

  if (!result) {
    result = localAuthStore.register(email, password, fullName, role);
  }

  if (result) {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    return result;
  }

  throw new Error('Registration failed');
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
