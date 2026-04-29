import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as crypto from "node:crypto";

const app = new Hono();

// Create Supabase client for auth
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Utility function to hash passwords
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Verify access token and return user
async function verifyUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    console.log('No authorization header found');
    return null;
  }
  
  const accessToken = authHeader.split(' ')[1];
  if (!accessToken) {
    console.log('No access token in authorization header');
    return null;
  }
  
  // Don't try to verify the anon key as a user token
  if (accessToken === Deno.env.get('SUPABASE_ANON_KEY')) {
    console.log('Anon key provided instead of user token');
    return null;
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error) {
      console.log(`Error verifying user token: ${error.message}`);
      return null;
    }
    if (!user) {
      console.log('No user found for token');
      return null;
    }
    console.log(`User verified: ${user.id}`);
    return user;
  } catch (error) {
    console.log(`Exception during user verification: ${error}`);
    return null;
  }
}

// Health check endpoint
app.get("/make-server-7ac8c4b6/health", (c) => {
  return c.json({ status: "ok" });
});

// ============ AUTH ENDPOINTS ============

// Signup endpoint for all user types
app.post("/make-server-7ac8c4b6/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    
    if (!email || !password || !name || !role) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    if (!['student', 'tutor', 'admin'].includes(role)) {
      return c.json({ error: "Invalid role" }, 400);
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Error creating user during signup: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store additional user data in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role,
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true, user: { id: data.user.id, email, name, role } });
  } catch (error) {
    console.log(`Server error during signup: ${error}`);
    return c.json({ error: "Signup failed" }, 500);
  }
});

// ============ TUTOR PROFILE ENDPOINTS ============

// Create/Update tutor profile
app.post("/make-server-7ac8c4b6/tutor/profile", async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      console.log('Tutor profile creation failed: No user authenticated');
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'tutor') {
      console.log(`Tutor profile creation failed: User ${user.id} is not a tutor, role: ${userData?.role}`);
      return c.json({ error: "Only tutors can create profiles" }, 403);
    }

    const body = await c.req.json();
    const {
      name,
      qualifications,
      subjects,
      photoUrl,
      photo,
      bio,
      hourlyRate,
      location,
      contactPhone,
      classTypes,
      classFormats,
      timetable,
    } = body;

    const profilePhotoUrl = photoUrl || photo || '';

    console.log(`Creating tutor profile for ${user.id}:`, {
      name,
      qualificationsCount: qualifications?.length || 0,
      subjectsCount: subjects?.length || 0,
      subjects: JSON.stringify(subjects),
      hourlyRate
    });

    const profile = {
      tutorId: user.id,
      name,
      qualifications: qualifications || [],
      subjects: subjects || [],
      photoUrl: profilePhotoUrl,
      bio: bio || '',
      hourlyRate: hourlyRate || 0,
      location: location || '',
      contactPhone: contactPhone || '',
      classTypes: classTypes || [],
      classFormats: classFormats || [],
      timetable: timetable || '',
      updatedAt: new Date().toISOString()
    };

    await kv.set(`tutor-profile:${user.id}`, profile);
    console.log(`Tutor profile saved for ${user.id}`);

    // Index tutors by subjects for faster searching
    for (const subject of subjects || []) {
      const key = `subject-index:${subject.category}:${subject.subject}`;
      const existing = await kv.get(key) || [];
      if (!existing.includes(user.id)) {
        existing.push(user.id);
        await kv.set(key, existing);
        console.log(`Indexed tutor ${user.id} for ${key}`);
      }
    }

    console.log(`Tutor profile created successfully for ${user.id} with ${subjects?.length || 0} subjects`);
    return c.json({ success: true, profile });
  } catch (error) {
    console.log(`Error creating tutor profile: ${error}`);
    console.log(`Error stack: ${error.stack}`);
    return c.json({ error: "Failed to create profile" }, 500);
  }
});

// Get authenticated tutor's own profile (for editing - no subscription check)
app.get("/make-server-7ac8c4b6/tutor/profile/me", async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'tutor') {
      return c.json({ error: "Only tutors can access this" }, 403);
    }

    const profile = await kv.get(`tutor-profile:${user.id}`);
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.log(`Error fetching own profile: ${error}`);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

// Get tutor profile (public - requires active subscription)
app.get("/make-server-7ac8c4b6/tutor/profile/:tutorId", async (c) => {
  try {
    const tutorId = c.req.param('tutorId');
    const profile = await kv.get(`tutor-profile:${tutorId}`);
    
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    // Check subscription status
    const subscription = await kv.get(`subscription:${tutorId}`);
    const isActive = subscription && new Date(subscription.expiresAt) > new Date();

    if (!isActive) {
      return c.json({ error: "Tutor subscription is inactive" }, 403);
    }

    return c.json({ profile });
  } catch (error) {
    console.log(`Error fetching tutor profile: ${error}`);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

// ============ SEARCH ENDPOINTS ============

// Search tutors by subject and category
app.get("/make-server-7ac8c4b6/search/tutors", async (c) => {
  try {
    const category = c.req.query('category');
    const subject = c.req.query('subject');

    if (!category || !subject) {
      return c.json({ error: "Category and subject are required" }, 400);
    }

    const key = `subject-index:${category}:${subject}`;
    const tutorIds = await kv.get(key) || [];

    const tutors = [];
    for (const tutorId of tutorIds) {
      const profile = await kv.get(`tutor-profile:${tutorId}`);
      const subscription = await kv.get(`subscription:${tutorId}`);
      
      // Only include tutors with active subscriptions
      if (profile && subscription && new Date(subscription.expiresAt) > new Date()) {
        tutors.push(profile);
      }
    }

    return c.json({ tutors });
  } catch (error) {
    console.log(`Error searching tutors: ${error}`);
    return c.json({ error: "Search failed" }, 500);
  }
});

// ============ SUBSCRIPTION ENDPOINTS ============

// Accept 30-day free trial (no payment)
// Supports: (1) Supabase JWT via verifyUser, or (2) internal call with tutorId + service role key
app.post("/make-server-7ac8c4b6/subscription/trial", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const authHeader = c.req.raw.headers.get("Authorization") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const internalTutorId = body?.tutorId;

    let tutorId: string | null = null;

    if (internalTutorId && serviceKey && authHeader === `Bearer ${serviceKey}`) {
      tutorId = internalTutorId;
    } else {
      const user = await verifyUser(c.req.raw);
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      const userData = await kv.get(`user:${user.id}`);
      const role = userData?.role ?? user.user_metadata?.role;
      if (role !== 'tutor' && role !== 'tutor_pending') {
        return c.json({ error: "Only tutors can accept trial" }, 403);
      }
      tutorId = user.id;
    }

    if (!tutorId) {
      return c.json({ error: "Missing tutor id" }, 400);
    }

    const existingSubscription = await kv.get(`subscription:${tutorId}`);
    if (existingSubscription) {
      return c.json({ error: "You already have an active subscription or trial" }, 400);
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day free trial

    const subscription = {
      tutorId,
      plan: 'trial',
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      active: true,
      isTrial: true
    };

    await kv.set(`subscription:${tutorId}`, subscription);

    return c.json({ success: true, subscription });
  } catch (error) {
    console.log(`Error creating trial: ${error}`);
    return c.json({ error: "Failed to start free trial" }, 500);
  }
});

// Create/Update paid subscription (monthly or annual, after payment)
app.post("/make-server-7ac8c4b6/subscription", async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const role = userData?.role ?? user.user_metadata?.role;
    if (role !== 'tutor') {
      return c.json({ error: "Only tutors can subscribe" }, 403);
    }

    const { plan } = await c.req.json(); // 'monthly' or 'annual'
    
    if (!['monthly', 'annual'].includes(plan)) {
      return c.json({ error: "Invalid plan" }, 400);
    }

    const existingSubscription = await kv.get(`subscription:${user.id}`);
    const now = new Date();
    let expiresAt: Date;

    if (existingSubscription && new Date(existingSubscription.expiresAt) > now) {
      // Extend from current expiry
      expiresAt = new Date(existingSubscription.expiresAt);
    } else {
      expiresAt = new Date(now);
    }

    if (plan === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    const subscription = {
      tutorId: user.id,
      plan,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      active: true,
      isTrial: false
    };

    await kv.set(`subscription:${user.id}`, subscription);

    return c.json({ success: true, subscription });
  } catch (error) {
    console.log(`Error creating subscription: ${error}`);
    return c.json({ error: "Failed to create subscription" }, 500);
  }
});

// Get subscription status
app.get("/make-server-7ac8c4b6/subscription/:tutorId", async (c) => {
  try {
    const tutorId = c.req.param('tutorId');
    const subscription = await kv.get(`subscription:${tutorId}`);
    
    if (!subscription) {
      return c.json({ active: false, subscription: null });
    }

    const active = new Date(subscription.expiresAt) > new Date();
    return c.json({ ...subscription, active });
  } catch (error) {
    console.log(`Error fetching subscription: ${error}`);
    return c.json({ error: "Failed to fetch subscription" }, 500);
  }
});

// ============ CHAT ENDPOINTS ============

// Send message
app.post("/make-server-7ac8c4b6/messages", async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { recipientId, message } = await c.req.json();
    
    if (!recipientId || !message) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Create conversation ID (sorted to ensure consistency)
    const conversationId = [user.id, recipientId].sort().join(':');
    
    const messageObj = {
      id: crypto.randomUUID(),
      conversationId,
      senderId: user.id,
      recipientId,
      message,
      timestamp: new Date().toISOString()
    };

    // Get existing messages
    const messages = await kv.get(`messages:${conversationId}`) || [];
    messages.push(messageObj);
    await kv.set(`messages:${conversationId}`, messages);

    return c.json({ success: true, message: messageObj });
  } catch (error) {
    console.log(`Error sending message: ${error}`);
    return c.json({ error: "Failed to send message" }, 500);
  }
});

// Get messages for a conversation
app.get("/make-server-7ac8c4b6/messages/:userId", async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const otherUserId = c.req.param('userId');
    const conversationId = [user.id, otherUserId].sort().join(':');
    
    const messages = await kv.get(`messages:${conversationId}`) || [];
    
    return c.json({ messages });
  } catch (error) {
    console.log(`Error fetching messages: ${error}`);
    return c.json({ error: "Failed to fetch messages" }, 500);
  }
});

// Get all conversations for a user
app.get("/make-server-7ac8c4b6/conversations", async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get all message keys
    const allMessages = await kv.getByPrefix('messages:');
    const conversations = [];

    for (const msgData of allMessages) {
      const conversationId = msgData.key.replace('messages:', '');
      const [user1, user2] = conversationId.split(':');
      
      if (user1 === user.id || user2 === user.id) {
        const otherUserId = user1 === user.id ? user2 : user1;
        const otherUser = await kv.get(`user:${otherUserId}`);
        const messages = msgData.value || [];
        const lastMessage = messages[messages.length - 1];
        
        conversations.push({
          conversationId,
          otherUser,
          lastMessage,
          unreadCount: 0 // Could implement unread tracking
        });
      }
    }

    return c.json({ conversations });
  } catch (error) {
    console.log(`Error fetching conversations: ${error}`);
    return c.json({ error: "Failed to fetch conversations" }, 500);
  }
});

// ============ ADMIN ENDPOINTS ============

// Get all users (admin only)
app.get("/make-server-7ac8c4b6/admin/users", async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const users = await kv.getByPrefix('user:');
    return c.json({ users: users.map(u => u.value) });
  } catch (error) {
    console.log(`Error fetching users for admin: ${error}`);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Get all subscriptions (admin only)
app.get("/make-server-7ac8c4b6/admin/subscriptions", async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const subscriptions = await kv.getByPrefix('subscription:');
    return c.json({ subscriptions: subscriptions.map(s => s.value) });
  } catch (error) {
    console.log(`Error fetching subscriptions for admin: ${error}`);
    return c.json({ error: "Failed to fetch subscriptions" }, 500);
  }
});

// Get all messages (admin only)
app.get("/make-server-7ac8c4b6/admin/messages", async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const allMessages = await kv.getByPrefix('messages:');
    return c.json({ conversations: allMessages });
  } catch (error) {
    console.log(`Error fetching messages for admin: ${error}`);
    return c.json({ error: "Failed to fetch messages" }, 500);
  }
});

Deno.serve(app.fetch);