/**
 * Tutor registration with admin approval - POST to Backend.
 * In dev (Vite) we use relative /api so the proxy forwards to port 3001.
 */

function getApiBase(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001/api';
  const origin = window.location.origin;
  const port = window.location.port;
  if (port === '5173' || port === '5174') {
    return `${origin}/api`;
  }
  return `http://${window.location.hostname}:3001/api`;
}

export interface TutorRegisterPayload {
  email: string;
  password: string;
  fullName?: string;
  name?: string;
  bio?: string;
  photo?: string;
  photoUrl?: string;
  hourlyRate?: number;
  location?: string;
  contactPhone?: string;
  timetable?: string;
  qualifications?: { title: string; photo: string }[];
  subjects?: { category: string; subject: string; mediums: string[] }[];
  classTypes?: string[];
  classFormats?: string[];
}

export interface TutorRegisterResponse {
  message: string;
  userId: string;
  requestId: string;
  token?: string;
  user?: { id: string; role: string; fullName: string; email?: string };
}

export async function registerTutor(data: TutorRegisterPayload): Promise<TutorRegisterResponse> {
  const url = `${getApiBase()}/tutors/register`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (networkErr: any) {
    const msg = networkErr?.message || '';
    const isNetwork = /failed to fetch|networkerror|load failed/i.test(msg);
    throw new Error(
      isNetwork
        ? 'Cannot connect to server. Is the backend running? (Start it with: cd Backend && npm start)'
        : msg || 'Registration failed'
    );
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || body.message || `Registration failed (${res.status})`);
  }
  return body;
}
