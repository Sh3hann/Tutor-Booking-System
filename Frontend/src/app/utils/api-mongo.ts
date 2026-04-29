import { localTutorStore } from './localTutorStore';
import { getStoredUser, getStoredToken } from './authService';

// Node backend base
function getNodeApiBase(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname || 'localhost';
  return `http://${host}:3001/api`;
}

// Get current user (checks local tutor session, then stored user from login)
export async function getCurrentUser() {
  const localSession = localTutorStore.getSession();
  if (localSession) {
    return { id: localSession.id, email: localSession.email, user_metadata: { name: localSession.user_metadata?.name } };
  }
  const chatUser = getStoredUser();
  const token = getStoredToken();
  if (chatUser && token) {
    return {
      id: chatUser.id,
      email: (chatUser as { email?: string }).email ?? '',
      user_metadata: { name: chatUser.fullName },
    };
  }
  return null;
}

// API call helper with error handling
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const nodeToken = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
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
  signup: async (email: string, password: string, fullName: string, role: string) => {
    const res = await fetch(`${getNodeApiBase()}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName, role }),
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
    // Get current user (works for both local and backend auth)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const userId = currentUser.id;
    const existing = localTutorStore.getProfile(userId);

    if (existing) {
      // Update existing profile with same user ID
      const updates: Parameters<typeof localTutorStore.updateProfile>[1] = {
        name: profileData.name,
        photoUrl: profileData.photo || profileData.photoUrl || '',
        bio: profileData.bio || '',
        hourlyRate: profileData.hourlyRate || 0,
        location: profileData.location || '',
        contactPhone: profileData.contactPhone || '',
        timetable: profileData.timetable || '',
        qualifications: profileData.qualifications ?? existing?.qualifications ?? [],
        classTypes: profileData.classTypes ?? existing?.classTypes ?? [],
        classFormats: profileData.classFormats ?? existing?.classFormats ?? [],
      };
      localTutorStore.updateProfile(userId, updates);
      return { success: true, profile: { tutorId: userId } };
    }

    // Save new profile with the user's actual ID  
    const { tutorId } = localTutorStore.saveProfile({
      tutorId: userId,
      name: profileData.name,
      email: profileData.email || currentUser.email || '',
      photo: profileData.photo || profileData.photoUrl || '',
      bio: profileData.bio || '',
      hourlyRate: profileData.hourlyRate || 0,
      location: profileData.location || '',
      contactPhone: profileData.contactPhone || '',
      timetable: profileData.timetable || '',
      qualifications: profileData.qualifications || [],
      subjects: profileData.subjects || [],
      classTypes: profileData.classTypes || [],
      classFormats: profileData.classFormats || [],
    });
    return { success: true, profile: { tutorId } };
  },

  getProfile: async (tutorId: string) => {
    const profile = localTutorStore.getProfile(tutorId);
    if (!profile) throw new Error('Profile not found');
    return { profile };
  },

  getMyProfile: async () => {
    // First try local session
    const profile = localTutorStore.getMyProfile();
    if (profile) {
      return { profile };
    }
    
    // If no local session, try getting profile using current user ID from auth
    const currentUser = await getCurrentUser();
    if (currentUser?.id) {
      const profileData = localTutorStore.getProfile(currentUser.id);
      if (profileData) {
        return { profile: profileData };
      }
    }
    
    throw new Error('Profile not found');
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
    return apiCall('/subscription', {
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
};
