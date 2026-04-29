/**
 * Local auth fallback - works when backend is unavailable (Failed to fetch)
 * Stores users in localStorage so login/register work without API
 */

const USERS_KEY = 'auth-local-users';
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

function generateId(): string {
  return 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

function getUsers(): { id: string; email: string; fullName: string; role: string; passwordHash: string }[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: ReturnType<typeof getUsers>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function hashPassword(password: string): string {
  return btoa(unescape(encodeURIComponent(password)));
}

export const localAuthStore = {
  register(email: string, password: string, fullName: string, role: 'student' | 'tutor') {
    const users = getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('Email already registered');
    }

    const id = generateId();
    const user = {
      id,
      email: email.toLowerCase(),
      fullName,
      role,
      passwordHash: hashPassword(password),
    };
    users.push(user);
    saveUsers(users);

    const token = 'local-' + btoa(JSON.stringify({ id, email: user.email, role }));
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ id, role, fullName }));

    return { token, user: { id, role, fullName } };
  },

  login(email: string, password: string) {
    const users = getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password');
    }
    if (user.passwordHash !== hashPassword(password)) {
      throw new Error('Invalid email or password');
    }

    const token = 'local-' + btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role }));
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ id: user.id, role: user.role, fullName: user.fullName }));

    return { token, user: { id: user.id, role: user.role, fullName: user.fullName } };
  },

  getTutors(search?: string): { id: string; fullName: string; subjects: string[]; isOnline: boolean }[] {
    const users = getUsers();
    let tutors = users.filter((u) => u.role === 'tutor').map((u) => ({
      id: u.id,
      fullName: u.fullName,
      subjects: [] as string[],
      isOnline: false,
    }));
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      tutors = tutors.filter((t) => t.fullName.toLowerCase().includes(q));
    }
    return tutors;
  },
};
