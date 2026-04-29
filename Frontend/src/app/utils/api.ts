import { localTutorStore } from './localTutorStore';
import { getStoredUser, getStoredToken } from './authService';

// Node backend base
function getNodeApiBase(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001/api';
  const origin = window.location.origin;
  const port = window.location.port;
  const host = window.location.hostname || 'localhost';
  // In local dev, prefer the Vite proxy (avoids CORS / mixed-content issues)
  if (host === 'localhost' || host === '127.0.0.1') {
    return `${origin}/api`;
  }
  // If frontend and backend are served from the same origin (common in prod), `/api` is also correct.
  if (!port) {
    return `${origin}/api`;
  }
  return `http://${host}:3001/api`;
}

// Get current user — real JWT login always takes priority over local dummy session
export async function getCurrentUser() {
  // Prefer real authenticated user (JWT-based login)
  const chatUser = getStoredUser();
  const token = getStoredToken();
  if (chatUser && token) {
    return {
      id: chatUser.id,
      email: (chatUser as { email?: string }).email ?? '',
      user_metadata: { 
        name: chatUser.fullName,
        photoUrl: (chatUser as any).photoUrl || ''
      },
    };
  }
  // Fall back to local tutor session (offline/demo mode only)
  const localSession = localTutorStore.getSession();
  if (localSession) {
    return { id: localSession.id, email: localSession.email, user_metadata: { name: localSession.user_metadata?.name } };
  }
  return null;
}

// API call helper with error handling
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const nodeToken = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (nodeToken) {
    headers['Authorization'] = `Bearer ${nodeToken}`;
  }

  const response = await fetch(`${getNodeApiBase()}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(`API Error (${endpoint}):`, data);
    throw new Error(data.error || data.message || 'API request failed');
  }

  return data;
}

// Auth APIs
export const authAPI = {
  signup: async (email: string, password: string, fullName: string, role: string, extraData?: { contactNumber?: string, grade?: string, age?: string, parentName?: string, parentContact?: string, parentDetails?: string }) => {
    const res = await fetch(`${getNodeApiBase()}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName, role, ...extraData }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${getNodeApiBase()}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    return data;
  },

  logout: async () => {
    localTutorStore.clearSession();
  },
};

// Tutor APIs (uses local storage and Node backend)
export const tutorAPI = {
  createProfile: async (profileData: any) => {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const res = await apiCall('/tutors/profile', {
      method: 'PUT',
      body: JSON.stringify({ tutorId: currentUser.id, ...profileData })
    });

    return { success: true, profile: res.tutor };
  },

  getProfile: async (tutorId: string) => {
    try {
      const res = await apiCall(`/tutors/${encodeURIComponent(tutorId)}/details`);
      const tutor = res.tutor || res.profile || res;
      if (tutor) {
        // Cache profile data locally WITHOUT creating a competing local session.
        // localTutorStore.saveProfile also writes a SESSION which conflicts with
        // the JWT-based user id returned by getStoredUser().
        const profiles = localTutorStore.getAllProfiles();
        const existing = profiles[tutorId] || {};
        profiles[tutorId] = {
          ...existing,
          tutorId,
          name: tutor.name || tutor.fullName || '',
          email: tutor.email || existing.email || '',
          photoUrl: tutor.photoUrl || tutor.photo || '',
          bio: tutor.bio || '',
          hourlyRate: tutor.hourlyRate ?? 0,
          location: tutor.location || '',
          contactPhone: tutor.contactPhone || '',
          timetable: tutor.timetable || '',
          qualifications: tutor.qualifications || [],
          subjects: tutor.subjects || [],
          classTypes: tutor.classTypes || [],
          classFormats: tutor.classFormats || [],
          introVideoUrl: tutor.introVideoUrl || '',
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('tutor-local-profiles', JSON.stringify(profiles));
        return { profile: tutor };
      }
    } catch (e) {
      console.warn('Failed to fetch profile from backend, falling back to local store', e);
    }
    
    const profile = localTutorStore.getProfile(tutorId);
    if (!profile) throw new Error('Profile not found');
    return { profile };
  },

  getMyProfile: async () => {
    // Use the dedicated authenticated endpoint — directly reads from MongoDB
    // and merges tutor record + profile request data, no local-store fallback needed.
    const res = await apiCall('/tutors/me/profile');
    if (!res?.profile) throw new Error('Profile not found');
    return { profile: res.profile };
  },

  saveMaterials: async (learningMaterials: any[]) => {
    return apiCall('/tutors/me/materials', {
      method: 'PUT',
      body: JSON.stringify({ learningMaterials }),
    });
  },

  getMaterials: async (tutorId: string) => {
    return apiCall(`/tutors/${encodeURIComponent(tutorId)}/materials`);
  },
};

// Search APIs
export const searchAPI = {
  searchTutors: async (
    category: string,
    subject: string,
    medium?: string,
    classType?: string,
    classFormat?: string
  ) => {
    let url = `/tutors?search=${encodeURIComponent(subject)}`;
    return apiCall(url);
  },

  getTutors: async () => {
    return apiCall('/tutors');
  },
};

// Subscription APIs
export const subscriptionAPI = {
  acceptTrial: async () => {
    return apiCall('/subscription/trial', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  subscribe: async (plan: 'monthly' | 'annual') => {
    return apiCall('/subscription/pay', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  },

  getSubscription: async (tutorId: string) => {
    return apiCall(`/subscription/${tutorId}`);
  },
};

// Message APIs
export const messageAPI = {
  sendMessage: async (recipientId: string, message: string) => {
    return apiCall('/messages', {
      method: 'POST',
      body: JSON.stringify({ recipientId, message }),
    });
  },

  getMessages: async (userId: string) => {
    return apiCall(`/messages/${userId}`);
  },

  getConversations: async () => {
    return apiCall('/conversations');
  },
};

// Admin APIs
export const adminAPI = {
  getUsers: async () => {
    return apiCall('/admin/users');
  },

  getSubscriptions: async () => {
    return apiCall('/admin/subscriptions');
  },

  getMessages: async () => {
    return apiCall('/admin/messages');
  },

  getPublicSubjects: async () => {
    return apiCall('/subjects');
  },

  updateSubjects: async (data: any) => {
    return apiCall('/admin/subjects', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getPublicQuizzes: async () => {
    return apiCall('/quizzes');
  },

  updateQuizzes: async (quizzes: any[]) => {
    return apiCall('/admin/quizzes', {
      method: 'PUT',
      body: JSON.stringify({ quizzes }),
    });
  },

  getReviews: async () => {
    return apiCall('/admin/reviews');
  },

  deleteReview: async (id: string) => {
    return apiCall(`/admin/reviews/${id}`, {
      method: 'DELETE',
    });
  },
  
  getFinancials: async () => {
    return apiCall('/admin/financials');
  },

  deleteBookingPayment: async (id: string) => {
    return apiCall(`/admin/financials/bookings/${id}`, {
      method: 'DELETE',
    });
  },

  deleteSubscriptionPayment: async (id: string) => {
    return apiCall(`/admin/financials/subscriptions/${id}`, {
      method: 'DELETE',
    });
  }
};

// Booking APIs
export const bookingAPI = {
  create: async (data: { tutorId: string, subject: string, classType: string, classFormat: string, dateTime: string, price: number }) => {
    return apiCall('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  getStudentBookings: async () => {
    return apiCall('/bookings/student');
  },
  
  getTutorBookings: async () => {
    return apiCall('/bookings/tutor');
  },

  updatePending: async (id: string, data: any) => {
    return apiCall(`/bookings/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  accept: async (id: string) => {
    return apiCall(`/bookings/${encodeURIComponent(id)}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  },

  reject: async (id: string) => {
    return apiCall(`/bookings/${encodeURIComponent(id)}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  },

  cancelBooking: async (id: string) => {
    return apiCall(`/bookings/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  },
  
  pay: async (id: string) => {
    return apiCall(`/bookings/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  },
  
  getEarnings: async () => {
    return apiCall('/bookings/earnings');
  },

  markDone: async (id: string) => {
    return apiCall(`/bookings/${id}/done`, {
      method: 'PUT',
      body: JSON.stringify({})
    });
  }
};

// ── Public Institute API ──────────────────────────────────────────────────────
export const instituteAPI = {
  list: () => apiCall('/institutes'),
  get: (id: string) => apiCall(`/institutes/${id}`),
  getWithManagerFlag: (id: string) => apiCall(`/institutes/${id}/manager-info`),
  requestNew: (instituteName: string) =>
    apiCall('/institutes/requests', {
      method: 'POST',
      body: JSON.stringify({ instituteName }),
    }),
  createByTutor: (data: { name: string; description?: string; location?: string; timetable?: string; photo?: string }) =>
    apiCall('/institutes/create-by-tutor', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSettings: (id: string, data: { name?: string; description?: string; location?: string; timetable?: string; photo?: string; banner?: string }) =>
    apiCall(`/institutes/${id}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteOwn: (id: string) =>
    apiCall(`/institutes/${id}/manager`, {
      method: 'DELETE',
    }),
  join: (id: string) =>
    apiCall(`/institutes/${id}/join`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getMyJoinRequest: () =>
    apiCall('/institutes/my/tutor-join-request'),
  updateTutorTimetable: (instituteId: string, tutorId: string, instituteTimetable: string) =>
    apiCall(`/institutes/${instituteId}/tutors/${tutorId}/timetable`, {
      method: 'PUT',
      body: JSON.stringify({ instituteTimetable }),
    }),
};