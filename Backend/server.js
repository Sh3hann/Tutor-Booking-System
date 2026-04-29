import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/auth.js';
import { tutorsRouter } from './routes/tutors.js';
import { tutorRegisterRouter } from './routes/tutorRegister.js';
import { adminRouter } from './routes/admin.js';
import { chatRouter } from './routes/chat.js';
import { subscriptionRouter } from './routes/subscription.js';
import { bookingsRouter } from './routes/bookings.js';
import { usersRouter } from './routes/users.js';
import { institutesRouter } from './routes/institutes.js';
import { authMiddleware } from './middleware/auth.js';
import { store } from './data/store-mongo.js';
import { aiChatRouter } from './routes/ai-chat.js';
import { connectDB, disconnectDB } from './config/mongodb.js';
import { initializeRoleDirectories, organizeUsersByRole, exportUserSummary } from './data/organize-by-role.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const PERMANENT_ADMIN_EMAIL = 'admin@gmail.com';
const PERMANENT_ADMIN_PASSWORD = 'admin@gmail.com';

async function initializeDataFromJSON() {
  try {
    const users = await store.users.get();
    if (users.length > 0) {
      console.log('✓ Database already populated, skipping JSON initialization');
      return;
    }
    
    console.log('Loading initial data from JSON files...');
    const dataPath = path.join(__dirname, 'data', 'json');
    
    // Load users
    try {
      const usersFile = path.join(dataPath, 'users.json');
      const usersData = JSON.parse(await fs.readFile(usersFile, 'utf-8'));
      await store.users.set(usersData);
      console.log(`✓ Loaded ${usersData.length} users from JSON`);
    } catch (err) {
      console.warn('⚠ Could not load users.json:', err.message);
    }
    
    // Load tutors
    try {
      const tutorsFile = path.join(dataPath, 'tutors.json');
      const tutorsData = JSON.parse(await fs.readFile(tutorsFile, 'utf-8'));
      await store.tutors.set(tutorsData);
      console.log(`✓ Loaded ${tutorsData.length} tutors from JSON`);
    } catch (err) {
      console.warn('⚠ Could not load tutors.json:', err.message);
    }
    
    // Load chat requests
    try {
      const chatRequestsFile = path.join(dataPath, 'chat_requests.json');
      const chatRequestsData = JSON.parse(await fs.readFile(chatRequestsFile, 'utf-8'));
      await store.chatRequests.set(chatRequestsData);
      console.log(`✓ Loaded ${chatRequestsData.length} chat requests from JSON`);
    } catch (err) {
      console.warn('⚠ Could not load chat_requests.json:', err.message);
    }
    
    // Load chat threads
    try {
      const chatThreadsFile = path.join(dataPath, 'chat_threads.json');
      const chatThreadsData = JSON.parse(await fs.readFile(chatThreadsFile, 'utf-8'));
      await store.chatThreads.set(chatThreadsData);
      console.log(`✓ Loaded ${chatThreadsData.length} chat threads from JSON`);
    } catch (err) {
      console.warn('⚠ Could not load chat_threads.json:', err.message);
    }
    

    // Load chat messages
    try {
      const chatMessagesFile = path.join(dataPath, 'chat_messages.json');
      const chatMessagesData = JSON.parse(await fs.readFile(chatMessagesFile, 'utf-8'));
      await store.chatMessages.set(chatMessagesData);
      console.log(`✓ Loaded ${chatMessagesData.length} chat messages from JSON`);
    } catch (err) {
      console.warn('⚠ Could not load chat_messages.json:', err.message);
    }

    // Load bookings
    try {
      const bookingsFile = path.join(dataPath, 'bookings.json');
      const bookingsData = JSON.parse(await fs.readFile(bookingsFile, 'utf-8'));
      await store.bookings.set(bookingsData);
      console.log(`✓ Loaded ${bookingsData.length} bookings from JSON`);
    } catch (err) {
      console.warn('⚠ Could not load bookings.json:', err.message);
    }
  } catch (err) {
    console.error('Error initializing data from JSON:', err.message);
  }
}

async function seedPermanentAdmin() {
  // Use getByEmail + insertOne/updateOne to avoid wiping all users with set()
  const existing = await store.users.getByEmail(PERMANENT_ADMIN_EMAIL);
  if (existing) {
    if (existing.role !== 'admin') {
      await store.users.updateOne(existing.id, { role: 'admin' });
      console.log('Permanent admin role restored for', PERMANENT_ADMIN_EMAIL);
    } else {
      console.log('✓ Permanent admin already exists:', PERMANENT_ADMIN_EMAIL);
    }
    return;
  }
  const passwordHash = await bcrypt.hash(PERMANENT_ADMIN_PASSWORD, 10);
  const adminUser = {
    id: uuidv4(),
    email: PERMANENT_ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    fullName: 'Admin',
    role: 'admin',
    createdAt: new Date().toISOString(),
  };
  await store.users.insertOne(adminUser);
  console.log('Permanent admin account created:', PERMANENT_ADMIN_EMAIL);
}

const JWT_SECRET = process.env.JWT_SECRET || 'tutor-chat-secret-change-in-production';
const PORT = process.env.PORT || 3001;

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(
  cors({
    origin: '*',
  })
);
app.use(express.json({ limit: '250mb' }));
// Increase URL-encoded limit too
app.use(express.urlencoded({ limit: '250mb', extended: true }));

app.set('io', io);
app.use('/api/auth', authRouter);
app.use('/api/tutors', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    authMiddleware(req, res, next);
  } else {
    next();
  }
}, tutorRegisterRouter);

// Public subjects endpoint (no auth required)
app.get('/api/subjects', async (req, res) => {
  try {
    const data = await store.subjects.get();
    res.json(data || { categories: [], subjectsByCategory: {} });
  } catch (err) {
    console.error('Get subjects error:', err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Public quizzes endpoint (no auth required — students need to read these)
app.get('/api/quizzes', async (req, res) => {
  try {
    const data = await store.quizzes.get();
    res.json({ quizzes: data || [] });
  } catch (err) {
    console.error('Get quizzes error:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Public tutors list endpoint (no auth required)
app.get('/api/tutors', async (req, res) => {
  try {
    const { search } = req.query;
    const users = await store.users.get();
    const approvedTutorIds = new Set(
      users.filter((u) => u.role === 'tutor').map((u) => u.id)
    );
    
    // Get all subscriptions
    const subscriptions = await store.subscriptions.get() || [];
    const activeSubscriptionIds = new Set();
    
    // Filter subscriptions to only active ones
    for (const sub of subscriptions) {
      if (sub?.tutorId) {
        const expiresAt = new Date(sub.expiresAt);
        const now = new Date();
        if (expiresAt > now) {
          activeSubscriptionIds.add(sub.tutorId);
        }
      }
    }
    
    console.log('[Tutors API] Active subscription IDs:', Array.from(activeSubscriptionIds));
    console.log('[Tutors API] Approved tutor IDs:', Array.from(approvedTutorIds));
    
    // Get tutors and filter: approved AND has active subscription
    let tutors = (await store.tutors.get()).filter(
      (t) => {
        const isApproved = approvedTutorIds.has(t.id);
        const hasActiveSubscription = activeSubscriptionIds.has(t.id);
        if (!hasActiveSubscription) {
          console.log(`[Tutors API] Filtering out tutor ${t.id} (${t.fullName}) - no active subscription`);
        }
        return isApproved && hasActiveSubscription;
      }
    );

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      tutors = tutors.filter(
        (t) =>
          t.fullName?.toLowerCase().includes(q) ||
          (t.subjects || []).some((s) => (typeof s === 'string' ? s : s.subject)?.toLowerCase().includes(q))
      );
    }

    res.json(
      tutors.map((t) => ({
        id: t.id,
        fullName: t.fullName,
        subjects: t.subjects || [],
        isOnline: t.status === 'online',
      }))
    );
  } catch (err) {
    console.error('Get tutors error:', err);
    res.status(500).json({ error: 'Failed to fetch tutors' });
  }
});

app.use('/api/tutors', authMiddleware, tutorsRouter);

// ─── Materials GET (before tutorsRouter wildcard /:id conflicts it) ──────────
// This route MUST be before the app.use(tutorsRouter) call above and also
// registered here explicitly so it wins over /:tutorId catch-all in tutorsRouter.
// We use optional auth to allow both token-header and ?token= query param.
app.get('/api/tutors/:tutorId/materials', async (req, res) => {
  try {
    const { tutorId } = req.params;
    // Resolve auth from Authorization header OR ?token= query param
    let callerUser = null;
    const rawToken = req.headers.authorization?.replace('Bearer ', '') ||
                     req.query.token;
    if (rawToken) {
      try {
        if (rawToken.startsWith('local-')) {
          callerUser = JSON.parse(atob(rawToken.substring(6)));
        } else {
          callerUser = jwt.verify(rawToken, JWT_SECRET);
        }
      } catch { /* invalid token — leave callerUser null */ }
    }

    const requestingUserId = callerUser?.id;
    const requestingRole   = (callerUser?.role || '').toLowerCase();

    // Helper: load tutor document
    const getTutor = async () => {
      const tutors = await store.tutors.get();
      return tutors.find(x => x.id === tutorId) || tutors.find(x => x.userId === tutorId);
    };

    // Tutor viewing own materials
    if (requestingUserId === tutorId && requestingRole === 'tutor') {
      const t = await getTutor();
      return res.json({ materials: t?.learningMaterials || [], tutorName: t?.fullName || '' });
    }
    // Admin
    if (requestingRole === 'admin') {
      const t = await getTutor();
      return res.json({ materials: t?.learningMaterials || [], tutorName: t?.fullName || '' });
    }
    // Must be authenticated student
    if (!requestingUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Check paid booking
    const bookings = await store.bookings.get() || [];
    const hasPaidBooking = bookings.some(
      b => b.studentId === requestingUserId &&
           b.tutorId   === tutorId &&
           b.paymentStatus === 'PAID'
    );
    if (!hasPaidBooking) {
      return res.status(403).json({
        error: 'Access denied. Complete payment for a class with this tutor to unlock learning materials.',
        locked: true
      });
    }
    const t = await getTutor();
    res.json({ materials: t?.learningMaterials || [], tutorName: t?.fullName || '' });
  } catch (err) {
    console.error('Get learning materials error:', err);
    res.status(500).json({ error: 'Failed to fetch learning materials' });
  }
});

// ─── Protected file serving for material uploads ─────────────────────────────
// Serves /api/materials/file/:tutorId/:filename with payment check.
// Accepts auth via Authorization header OR ?token= query param (needed for <video src>).
app.get('/api/materials/file/:tutorId/:filename', async (req, res) => {
  try {
    const { tutorId, filename } = req.params;
    // Sanitise filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const rawToken = req.headers.authorization?.replace('Bearer ', '') ||
                     req.query.token;
    let callerUser = null;
    if (rawToken) {
      try {
        if (rawToken.startsWith('local-')) {
          callerUser = JSON.parse(atob(rawToken.substring(6)));
        } else {
          callerUser = jwt.verify(rawToken, JWT_SECRET);
        }
      } catch { /* invalid */ }
    }
    if (!callerUser) return res.status(401).json({ error: 'Authentication required' });

    const callerId = callerUser.id;
    const callerRole = callerUser.role || '';
    const isOwnerOrAdmin = callerId === tutorId || callerRole === 'admin';

    if (!isOwnerOrAdmin) {
      const bookings = await store.bookings.get() || [];
      const hasPaid = bookings.some(
        b => b.studentId === callerId &&
             b.tutorId   === tutorId &&
             b.paymentStatus === 'PAID'
      );
      if (!hasPaid) return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.join(__dirname, 'uploads', 'materials', tutorId, safeFilename);
    if (!fsSync.existsSync(filePath)) {
      console.log('[file-serve] File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }

    // For PDFs: force download with correct filename and Content-Type
    const isPdf = safeFilename.toLowerCase().endsWith('.pdf') ||
                  safeFilename.startsWith('pdf_');
    if (isPdf) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    }

    // Use sendFile with absolute path (no root option — required for absolute Windows paths)
    res.sendFile(path.resolve(filePath));
  } catch (err) {
    console.error('Serve material file error:', err);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});
app.use('/api/admin', authMiddleware, adminRouter);
app.use('/api/chat', chatRouter);
app.use('/api/ai-chat', aiChatRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/users', usersRouter);
app.use('/api/institutes', institutesRouter);

app.get('/api/tutor/chat/requests', authMiddleware, async (req, res) => {
  if (req.user.role !== 'tutor') {
    return res.status(403).json({ error: 'Only tutors can view pending requests' });
  }
  const status = req.query.status || 'PENDING';
  const requests = await store.chatRequests.get();
  const users = await store.users.get();

  const pending = requests
    .filter((r) => r.tutorId === req.user.id && r.status === status)
    .map((r) => {
      const student = users.find((u) => u.id === r.studentId);
      return {
        ...r,
        student: student ? { id: student.id, fullName: student.fullName } : null,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ requests: pending });
});

const onlineTutors = new Set();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', async (socket) => {
  if (socket.userRole === 'tutor') {
    onlineTutors.add(socket.userId);
    const tutors = await store.tutors.get();
    const idx = tutors.findIndex((t) => t.id === socket.userId);
    if (idx >= 0) {
      const updatedTutors = tutors.map((t, i) => 
        i === idx ? { ...t, status: 'online' } : t
      );
      await store.tutors.set(updatedTutors);
    }
  }

  socket.on('joinThread', async ({ threadId }) => {
    if (!threadId) {
      console.log(`[Chat] joinThread: no threadId provided`);
      return;
    }
    console.log(`[Chat] User ${socket.userId} joining thread ${threadId}`);
    
    const threads = await store.chatThreads.get();
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) {
      console.log(`[Chat] Thread not found: ${threadId}`);
      return;
    }
    if (thread.studentId !== socket.userId && thread.tutorId !== socket.userId) {
      console.log(`[Chat] User ${socket.userId} not authorized for thread ${threadId}`);
      return;
    }

    const requests = await store.chatRequests.get();
    const req = thread.requestId ? requests.find((r) => r.id === thread.requestId) : null;
    if (req && req.status !== 'ACCEPTED') {
      console.log(`[Chat] Chat request not accepted, status: ${req?.status}`);
      return;
    }

    socket.join(`thread:${threadId}`);
    console.log(`[Chat] User ${socket.userId} joined thread ${threadId}`);
  });

  socket.on('sendMessage', async ({ threadId, content }) => {
    if (!threadId || !content || typeof content !== 'string') return;
    
    console.log(`[Chat] User ${socket.userId} sending message to thread ${threadId}`);

    const threads = await store.chatThreads.get();
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) {
      console.log(`[Chat] Thread not found: ${threadId}`);
      return;
    }
    if (thread.studentId !== socket.userId && thread.tutorId !== socket.userId) {
      console.log(`[Chat] User ${socket.userId} not in thread ${threadId}`);
      return;
    }

    const requests = await store.chatRequests.get();
    const req = thread.requestId ? requests.find((r) => r.id === thread.requestId) : null;
    if (req && req.status !== 'ACCEPTED') {
      console.log(`[Chat] Chat request not accepted`);
      return;
    }

    const message = {
      id: uuidv4(),
      threadId,
      senderId: socket.userId,
      senderRole: socket.userRole,
      content: content.trim().slice(0, 2000),
      sentAt: new Date().toISOString(),
    };

    const messages = await store.chatMessages.get();
    const updatedMessages = [...messages, message];
    await store.chatMessages.set(updatedMessages);
    
    console.log(`[Chat] Broadcasting message to thread ${threadId}, total messages: ${updatedMessages.length}`);
    socket.broadcast.to(`thread:${threadId}`).emit('newMessage', { message });
  });

  socket.on('triggerAutoReply', async ({ threadId, shortcutId }) => {
    if (!threadId || !shortcutId || socket.userRole !== 'student') return;
    
    const threads = await store.chatThreads.get();
    const thread = threads.find((t) => t.id === threadId);
    if (!thread || thread.studentId !== socket.userId) return;

    const tutors = await store.tutors.get();
    const tutorData = tutors.find(t => t.id === thread.tutorId);
    if (!tutorData) return;

    let content = '';
    if (shortcutId === 'timetable') {
      content = `📅 My Available Timetable:\n${tutorData.timetable || 'Monday–Friday: 4 PM – 8 PM\nWeekends: 9 AM – 5 PM\n\nFeel free to suggest a time that works for you!'}`;
    } else if (shortcutId === 'location') {
      content = `📍 My Location:\n${tutorData.location || 'Location not specified'}\n\nI also offer online classes via Zoom/Google Meet.`;
    } else if (shortcutId === 'subjects') {
      const subjects = (tutorData.subjects || [])
        .map((s) => typeof s === 'object' && s.subject ? s.subject : String(s))
        .join(', ');
      content = `📚 Subjects I Teach:\n${subjects || 'Contact me for subject details'}\n\nHourly Rate: LKR ${tutorData.hourlyRate || '—'}/hr`;
    }

    if (!content) return;

    const message = {
      id: uuidv4(),
      threadId,
      senderId: thread.tutorId, // spoofed as coming from tutor
      senderRole: 'tutor',
      content,
      sentAt: new Date().toISOString(),
    };

    const messages = await store.chatMessages.get();
    const updatedMessages = [...messages, message];
    await store.chatMessages.set(updatedMessages);
    
    // Broadcast to the whole thread (including the student who triggered it)
    io.to(`thread:${threadId}`).emit('newMessage', { message });
  });

  socket.on('disconnect', async () => {
    if (socket.userRole === 'tutor') {
      onlineTutors.delete(socket.userId);
      const tutors = await store.tutors.get();
      const idx = tutors.findIndex((t) => t.id === socket.userId);
      if (idx >= 0) {
        const updatedTutors = tutors.map((t, i) => 
          i === idx ? { ...t, status: 'offline' } : t
        );
        await store.tutors.set(updatedTutors);
      }
    }
  });
});

export function emitRequestUpdated(studentId, payload) {
  io.emit('requestUpdated', { ...payload, studentId });
}

async function startServer() {
  try {
    await connectDB();
    await initializeDataFromJSON();
    await initializeRoleDirectories();
    await seedPermanentAdmin();
    const allUsers = await store.users.get();
    await organizeUsersByRole(allUsers);
    await exportUserSummary();
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT} (also reachable via LAN IP)`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});
