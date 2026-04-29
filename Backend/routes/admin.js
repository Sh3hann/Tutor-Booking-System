import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../data/store-mongo.js';
import { organizeUsersByRole, exportUserSummary, getUsersByRoleFromFile } from '../data/organize-by-role.js';

export const adminRouter = Router();

const PERMANENT_ADMIN_EMAIL = 'admin@gmail.com';

function adminMiddleware(req, res, next) {
  const role = (req.user?.role || '').toLowerCase();
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function isPermanentAdmin(user) {
  return user && user.email && user.email.toLowerCase() === PERMANENT_ADMIN_EMAIL.toLowerCase();
}

adminRouter.use(adminMiddleware);

// GET /api/admin/users
adminRouter.get('/users', async (req, res) => {
  try {
    const users = await store.users.get();
    res.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: u.role,
        contactNumber: u.contactNumber || '',
        grade: u.grade || '',
        age: u.age || '',
        parentName: u.parentName || '',
        parentContact: u.parentContact || '',
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/organized/all - Get all users organized by role from files
adminRouter.get('/users/organized/all', async (req, res) => {
  try {
    const admins = await getUsersByRoleFromFile('admin');
    const students = await getUsersByRoleFromFile('student');
    const tutors = await getUsersByRoleFromFile('tutor');

    res.json({
      organized: {
        admins: admins.map((u) => ({ id: u.id, name: u.fullName, email: u.email, role: u.role })),
        students: students.map((u) => ({ id: u.id, name: u.fullName, email: u.email, role: u.role })),
        tutors: tutors.map((u) => ({ id: u.id, name: u.fullName, email: u.email, role: u.role })),
      },
      summary: {
        totalAdmins: admins.length,
        totalStudents: students.length,
        totalTutors: tutors.length,
      },
    });
  } catch (err) {
    console.error('Admin get organized users error:', err);
    res.status(500).json({ error: 'Failed to fetch organized users' });
  }
});

// GET /api/admin/users/organized/:role - Get users by specific role from files
adminRouter.get('/users/organized/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['admin', 'student', 'tutor'];
    
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, student, or tutor' });
    }

    const users = await getUsersByRoleFromFile(role.toLowerCase());
    res.json({
      role: role.toLowerCase(),
      count: users.length,
      users: users.map((u) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error('Admin get users by role error:', err);
    res.status(500).json({ error: 'Failed to fetch users by role' });
  }
});

// POST /api/admin/users/refresh-organization - Refresh user organization files
adminRouter.post('/users/refresh-organization', async (req, res) => {
  try {
    const allUsers = await store.users.get();
    await organizeUsersByRole(allUsers);
    await exportUserSummary();
    res.json({ success: true, message: 'Users organized by role and summary exported' });
  } catch (err) {
    console.error('Admin refresh organization error:', err);
    res.status(500).json({ error: 'Failed to refresh organization' });
  }
});

// PATCH /api/admin/users/:id/role
adminRouter.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role || !['student', 'tutor', 'admin'].includes(role.toLowerCase())) {
      return res.status(400).json({ error: 'Valid role required (student, tutor, admin)' });
    }
    const users = await store.users.get();
    const user = users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (isPermanentAdmin(user)) {
      return res.status(403).json({ error: 'Cannot change role of permanent admin account' });
    }
    user.role = role.toLowerCase();
    await store.users.set(users);
    await organizeUsersByRole(users).catch((err) => console.error('Failed to organize users:', err.message));
    res.json({ user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName } });
  } catch (err) {
    console.error('Admin update role error:', err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// PATCH /api/admin/users/:id/email
adminRouter.patch('/users/:id/email', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Valid email required' });
    }
    const newEmail = email.trim().toLowerCase();
    const users = await store.users.get();
    const user = users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (isPermanentAdmin(user)) {
      return res.status(403).json({ error: 'Cannot change email of permanent admin account' });
    }
    if (users.some((u) => u.id !== id && u.email.toLowerCase() === newEmail)) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    user.email = newEmail;
    await store.users.set(users);
    await organizeUsersByRole(users).catch((err) => console.error('Failed to organize users:', err.message));
    res.json({ user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName } });
  } catch (err) {
    console.error('Admin update email error:', err);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// DELETE /api/admin/users/:id
adminRouter.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const users = await store.users.get();
    const user = users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (isPermanentAdmin(user)) {
      return res.status(403).json({ error: 'Cannot delete permanent admin account' });
    }
    const adminsLeft = users.filter((u) => u.role === 'admin' && u.id !== id).length;
    if (adminsLeft === 0) {
      return res.status(403).json({ error: 'Cannot delete the last admin' });
    }
    const next = users.filter((u) => u.id !== id);
    await store.users.set(next);
    await organizeUsersByRole(next).catch((err) => console.error('Failed to organize users:', err.message));
    const tutors = (await store.tutors.get()).filter((t) => t.id !== id);
    await store.tutors.set(tutors);
    res.json({ success: true });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/admin/tutor-requests?status=PENDING
adminRouter.get('/tutor-requests', async (req, res) => {
  try {
    const status = (req.query.status || '').toUpperCase() || null;
    let requests = await store.tutorProfileRequests.get();
    if (status) {
      requests = requests.filter((r) => r.status === status);
    }
    // Filter out Institute Manager requests; they should only appear in the Institutes panel
    requests = requests.filter((r) => r.submittedData?.isInstituteManager !== true);
    const users = await store.users.get();
    const withUser = requests.map((r) => {
      const u = users.find((x) => x.id === r.userId);
      return {
        ...r,
        tutorName: u ? u.fullName : null,
        tutorEmail: u ? u.email : null,
      };
    });
    res.json({ requests: withUser });
  } catch (err) {
    console.error('Admin get tutor-requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /api/admin/tutor-requests/:id
adminRouter.get('/tutor-requests/:id', async (req, res) => {
  try {
    const requests = await store.tutorProfileRequests.get();
    const reqItem = requests.find((r) => r.id === req.params.id);
    if (!reqItem) return res.status(404).json({ error: 'Request not found' });
    const users = await store.users.get();
    const u = users.find((x) => x.id === reqItem.userId);
    res.json({
      ...reqItem,
      tutorName: u ? u.fullName : null,
      tutorEmail: u ? u.email : null,
    });
  } catch (err) {
    console.error('Admin get tutor-request error:', err);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// PATCH /api/admin/tutor-requests/:id/approve
adminRouter.patch('/tutor-requests/:id/approve', async (req, res) => {
  try {
    console.log(`[Approve] Starting approval for request ${req.params.id}`);
    
    // Step 1: Get and update the request
    const requests = await store.tutorProfileRequests.get();
    console.log(`[Approve] Step 1: Found ${requests.length} requests`);
    
    const reqItem = requests.find((r) => r.id === req.params.id);
    if (!reqItem) {
      console.log(`[Approve] Request not found: ${req.params.id}`);
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (reqItem.status !== 'PENDING') {
      console.log(`[Approve] Request not pending, current status: ${reqItem.status}`);
      return res.status(400).json({ error: 'Request is not pending' });
    }
    
    console.log(`[Approve] Step 2: Updating request status to APPROVED`);
    reqItem.status = 'APPROVED';
    reqItem.reviewedAt = new Date().toISOString();
    reqItem.reviewedByAdminId = req.user.id;
    
    try {
      await store.tutorProfileRequests.set(requests);
      console.log(`[Approve] Step 2: Request saved successfully`);
    } catch (e) {
      console.error(`[Approve] Step 2 FAILED to save request:`, e.message);
      throw e;
    }

    // Step 2: Update user role
    console.log(`[Approve] Step 3: Updating user role for ${reqItem.userId}`);
    try {
      const roleUpdated = await store.users.updateOne(reqItem.userId, { role: 'tutor' });
      console.log(`[Approve] Step 3: User role update result:`, roleUpdated);
    } catch (e) {
      console.error(`[Approve] Step 3 FAILED:`, e.message);
      throw e;
    }

    // Step 3: Create/update tutor profile
    console.log(`[Approve] Step 4: Creating tutor profile`);
    try {
      const users = await store.users.get();
      const user = users.find((u) => u.id === reqItem.userId);
      const tutors = await store.tutors.get();
      const existingTutor = tutors.find((t) => t.id === reqItem.userId);
      
      const submitted = reqItem.submittedData || {};
      const tutorData = {
        id: reqItem.userId,
        fullName: submitted.name || user?.fullName || 'Tutor',
        subjects: submitted.subjects || [],
        classTypes: submitted.classTypes || [],
        classFormats: submitted.classFormats || [],
        bio: submitted.bio || '',
        hourlyRate: submitted.hourlyRate ?? 0,
        photoUrl: submitted.photo || submitted.photoUrl || '',
        location: submitted.location || '',
        contactPhone: submitted.contactPhone || '',
        timetable: submitted.timetable || existingTutor?.timetable || '',
        qualifications: submitted.qualifications || existingTutor?.qualifications || [],
        introVideoUrl: submitted.introVideoUrl || existingTutor?.introVideoUrl || '',
        meetingLink: submitted.meetingLink || existingTutor?.meetingLink || '',
        status: existingTutor?.status || 'offline',
      };
      
      if (!existingTutor) {
        tutors.push(tutorData);
        console.log(`[Approve] Added new tutor: ${tutorData.fullName}`);
      } else {
        Object.assign(existingTutor, tutorData);
        console.log(`[Approve] Updated existing tutor: ${tutorData.fullName}`);
      }
      
      await store.tutors.set(tutors);
      console.log(`[Approve] Step 4: Tutor profile saved (${tutors.length} total tutors)`);
    } catch (e) {
      console.error(`[Approve] Step 4 FAILED:`, e.message);
      throw e;
    }

    console.log(`[Approve] SUCCESS: Approval completed for ${req.params.id}`);
    res.json({ success: true, request: reqItem });
  } catch (err) {
    console.error('[Approve] FINAL ERROR:', err.message);
    console.error('[Approve] Stack:', err.stack);
    res.status(500).json({ error: 'Failed to approve request', message: err.message });
  }
});

// PATCH /api/admin/tutor-requests/:id/reject
adminRouter.patch('/tutor-requests/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body || {};
    const requests = await store.tutorProfileRequests.get();
    const reqItem = requests.find((r) => r.id === req.params.id);
    if (!reqItem) return res.status(404).json({ error: 'Request not found' });
    if (reqItem.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request is not pending' });
    }
    reqItem.status = 'REJECTED';
    reqItem.reviewedAt = new Date().toISOString();
    reqItem.reviewedByAdminId = req.user.id;
    reqItem.rejectionReason = typeof reason === 'string' ? reason.trim() : null;
    await store.tutorProfileRequests.set(requests);
    res.json({ success: true, request: reqItem });
  } catch (err) {
    console.error('Admin reject tutor-request error:', err);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// Subjects CRUD (admin only)
adminRouter.get('/subjects', async (req, res) => {
  try {
    const data = await store.subjects.get();
    res.json(data || { categories: [], subjectsByCategory: {} });
  } catch (err) {
    console.error('Admin get subjects error:', err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

adminRouter.put('/subjects', async (req, res) => {
  try {
    const { categories, subjectsByCategory } = req.body || {};
    if (!Array.isArray(categories) || typeof subjectsByCategory !== 'object') {
      return res.status(400).json({ error: 'categories (array) and subjectsByCategory (object) required' });
    }
    await store.subjects.set({ categories, subjectsByCategory: subjectsByCategory || {} });
    res.json({ success: true });
  } catch (err) {
    console.error('Admin save subjects error:', err);
    res.status(500).json({ error: 'Failed to save subjects' });
  }
});

// ── Quizzes CRUD (admin only) ────────────────────────────────────────────────
adminRouter.get('/quizzes', async (req, res) => {
  try {
    const data = await store.quizzes.get();
    res.json({ quizzes: data || [] });
  } catch (err) {
    console.error('Admin get quizzes error:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

adminRouter.put('/quizzes', async (req, res) => {
  try {
    const { quizzes } = req.body || {};
    if (!Array.isArray(quizzes)) {
      return res.status(400).json({ error: 'quizzes (array) required' });
    }
    await store.quizzes.set(quizzes);
    res.json({ success: true });
  } catch (err) {
    console.error('Admin save quizzes error:', err);
    res.status(500).json({ error: 'Failed to save quizzes' });
  }
});

// Reviews Management (Admin only)
adminRouter.get('/reviews', async (req, res) => {
  try {
    const reviews = await store.tutorReviews.get() || [];
    const users = await store.users.get() || [];
    const tutors = await store.tutors.get() || [];
    
    // Attach names for better admin context
    const enrichedReviews = reviews.map(r => {
      const student = users.find(u => u.id === r.studentId);
      const tutor = tutors.find(t => t.id === r.tutorId);
      return {
        ...r,
        studentName: student ? student.fullName : 'Unknown Student',
        tutorName: tutor ? tutor.fullName : 'Unknown Tutor'
      };
    });
    
    // Sort newest first
    enrichedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ reviews: enrichedReviews });
  } catch (err) {
    console.error('Admin get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

adminRouter.delete('/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let reviews = await store.tutorReviews.get() || [];
    const initialLength = reviews.length;
    
    reviews = reviews.filter(r => r.id !== id);
    
    if (reviews.length === initialLength) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    await store.tutorReviews.set(reviews);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Admin delete review error:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// POST /api/admin/wipe-data — completely reset all data (keep admin only)
adminRouter.post('/wipe-data', async (req, res) => {
  try {
    // Keep only admin users
    const allUsers = await store.users.get();
    const adminUsers = allUsers.filter((u) => (u.role || '').toLowerCase() === 'admin');
    await store.users.set(adminUsers);

    // Wipe all tutors
    await store.tutors.set([]);

    // Wipe all chat data
    await store.chatThreads.set([]);
    await store.chatMessages.set([]);
    await store.chatRequests.set([]);

    // Wipe all subscriptions
    await store.subscriptions.upsertByTutorId('__reset__', { status: 'deleted' }).catch(() => {});
    const { getDB } = await import('../config/mongodb.js');
    const db = await getDB();
    await db.collection('subscriptions').deleteMany({});

    // Wipe all tutor profile requests
    await store.tutorProfileRequests.set([]);
    
    // Wipe Bookings
    await store.bookings.set([]);

    console.log('[Wipe] Database wiped. Kept', adminUsers.length, 'admin(s).');
    res.json({ success: true, message: `Wiped all data. Kept ${adminUsers.length} admin account(s).` });
  } catch (err) {
    console.error('Wipe data error:', err);
    res.status(500).json({ error: 'Failed to wipe data', message: err.message });
  }
});

// GET /api/admin/financials - Get platform revenue (booking service charges + subscriptions)
adminRouter.get('/financials', async (req, res) => {
  try {
    const bookings = await store.bookings.get() || [];
    const paidBookings = bookings.filter(b => b.paymentStatus === 'PAID');
    // Say admin takes 10% fee on bookings
    const bookingRevenue = paidBookings.reduce((sum, b) => sum + (Number(b.price) || 0) * 0.10, 0);

    const subscriptions = await store.subscriptions.get() || [];
    const paidSubscriptions = subscriptions.filter(s => s.plan !== 'trial');
    // Annual = 18000, Monthly = 3000
    const subscriptionRevenue = paidSubscriptions.reduce((sum, s) => sum + (s.plan === 'annual' ? 18000 : 3000), 0);

    const totalRevenue = bookingRevenue + subscriptionRevenue;

    const users = await store.users.get() || [];
    const tutors = await store.tutors.get() || [];
    
    // Helper to get names
    const getStudentName = id => {
      const u = users.find(u => u.id === id);
      return u ? u.fullName : 'Unknown';
    };
    const getTutorName = id => {
      const t = tutors.find(t => t.id === id || t.userId === id);
      if (t?.fullName) return t.fullName;
      const u = users.find(u => u.id === id);
      return u ? u.fullName : 'Unknown';
    };

    const bookingHistory = paidBookings.map(b => ({
      id: b.id,
      studentName: getStudentName(b.studentId),
      tutorName: getTutorName(b.tutorId),
      amount: Number(b.price) || 0,
      date: b.paymentDate || b.createdAt || new Date().toISOString()
    })).sort((a, b) => new Date(b.date) - new Date(a.date));

    const subscriptionHistory = paidSubscriptions.map(s => ({
      id: s.id || s._id,
      tutorName: getTutorName(s.tutorId),
      plan: s.plan,
      amount: s.plan === 'annual' ? 18000 : 3000,
      date: s.startedAt || s.createdAt || new Date().toISOString()
    })).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      revenue: {
        bookings: bookingRevenue,
        subscriptions: subscriptionRevenue,
        total: totalRevenue
      },
      stats: {
        totalPaidBookings: paidBookings.length,
        totalPaidSubscriptions: paidSubscriptions.length
      },
      bookingHistory,
      subscriptionHistory
    });

  } catch (err) {
    console.error('Admin get financials error:', err);
    res.status(500).json({ error: 'Failed to get financials' });
  }
});

// DELETE /api/admin/financials/bookings/:id - Delete a booking payment record
adminRouter.delete('/financials/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let bookings = await store.bookings.get() || [];
    const initialLength = bookings.length;
    
    bookings = bookings.filter(b => b.id !== id);
    
    if (bookings.length === initialLength) {
      return res.status(404).json({ error: 'Booking payment not found' });
    }
    
    await store.bookings.set(bookings);
    res.json({ success: true, message: 'Booking payment deleted successfully' });
  } catch (err) {
    console.error('Admin delete booking error:', err);
    res.status(500).json({ error: 'Failed to delete booking payment' });
  }
});

// DELETE /api/admin/financials/subscriptions/:id - Delete a subscription payment record
adminRouter.delete('/financials/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let subscriptions = await store.subscriptions.get() || [];
    const initialLength = subscriptions.length;
    
    subscriptions = subscriptions.filter(s => s.id !== id && s._id !== id);
    
    if (subscriptions.length === initialLength) {
      return res.status(404).json({ error: 'Subscription payment not found' });
    }
    
    await store.subscriptions.set(subscriptions);
    res.json({ success: true, message: 'Subscription payment deleted successfully' });
  } catch (err) {
    console.error('Admin delete subscription error:', err);
    res.status(500).json({ error: 'Failed to delete subscription payment' });
  }
});

// ──────────────────────────────────────────────────
// GET /api/admin/reviews  — list all tutor reviews
// ──────────────────────────────────────────────────
adminRouter.get('/reviews', async (req, res) => {
  try {
    const [rawReviews, users, tutors] = await Promise.all([
      store.tutorReviews.get(),
      store.users.get(),
      store.tutors.get(),
    ]);

    // Build lookup maps
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.fullName || u.email || 'Unknown']));
    const tutorMap = Object.fromEntries(tutors.map((t) => [t.userId, t.name || 'Unknown Tutor']));

    const reviews = (rawReviews || []).map((r) => ({
      id: r.id || r._id?.toString(),
      rating: r.rating,
      comment: r.comment,
      tutorId: r.tutorId,
      studentId: r.studentId,
      tutorName: tutorMap[r.tutorId] || r.tutorName || 'Unknown Tutor',
      studentName: userMap[r.studentId] || r.studentName || 'Unknown Student',
      createdAt: r.createdAt || new Date().toISOString(),
    }));

    res.json({ reviews });
  } catch (err) {
    console.error('Admin get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews', message: err.message });
  }
});

// ──────────────────────────────────────────────────
// DELETE /api/admin/reviews/:id  — delete a review
// ──────────────────────────────────────────────────
adminRouter.delete('/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allReviews = await store.tutorReviews.get();
    const filtered = allReviews.filter((r) => {
      const rid = r.id || r._id?.toString();
      return rid !== id;
    });

    if (filtered.length === allReviews.length) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await store.tutorReviews.set(filtered);

    // Also remove from tutor's embedded reviews array
    const tutors = await store.tutors.get();
    const updatedTutors = tutors.map((t) => ({
      ...t,
      reviews: (t.reviews || []).filter((r) => {
        const rid = r.id || r._id?.toString();
        return rid !== id;
      }),
    }));
    await store.tutors.set(updatedTutors);

    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    console.error('Admin delete review error:', err);
    res.status(500).json({ error: 'Failed to delete review', message: err.message });
  }
});
