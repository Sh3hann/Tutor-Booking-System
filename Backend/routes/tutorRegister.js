import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../data/store-mongo.js';
import { organizeUsersByRole } from '../data/organize-by-role.js';
import { signToken } from '../middleware/auth.js';
import fsNode from 'fs';
import pathNode from 'path';
import { fileURLToPath as ftu } from 'url';

const _dir = pathNode.dirname(ftu(import.meta.url));

export const tutorRegisterRouter = Router();

// Public search: no auth. Query params category, subject, medium, classType, classFormat (all optional).
// Only filter by a param when it is provided and non-empty.
// Returns tutors with avgRating, ratingCount; sorted by avgRating DESC, ratingCount DESC, fullName ASC.
tutorRegisterRouter.get('/search', async (req, res) => {
  try {
    const { category, subject, medium, classType, classFormat } = req.query;
    const users = await store.users.get();
    console.log(`[Search] Total users: ${users.length}`);
    const tutorUsers = users.filter((u) => (u.role || '').toLowerCase() === 'tutor');
    console.log(`[Search] Tutor users (role=tutor): ${tutorUsers.length}`, tutorUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));
    
    // Get all subscriptions to see who is active
    const subscriptions = await store.subscriptions.get() || [];
    const activeSubscriptionIds = new Set();
    const now = new Date();
    for (const sub of subscriptions) {
      if (sub?.tutorId && new Date(sub.expiresAt) > now) {
        activeSubscriptionIds.add(sub.tutorId);
      }
    }
    
    // Both approved (role=tutor) AND active subscription required
    const validTutorIds = new Set(tutorUsers.filter(u => activeSubscriptionIds.has(u.id)).map(u => u.id));
    
    let tutors = (await store.tutors.get() || []).filter((t) => validTutorIds.has(t.id));
    console.log(`[Search] Tutors in DB: ${(await store.tutors.get() || []).length}, Active/Visible tutors: ${tutors.length}`);

    const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

    if (norm(category)) {
      const cat = norm(category);
      tutors = tutors.filter((t) =>
        (t.subjects || []).some((s) => {
          const c = typeof s === 'object' && s !== null ? (s.category || '').toLowerCase() : '';
          return c === cat;
        })
      );
    }
    if (norm(subject)) {
      const sub = norm(subject);
      tutors = tutors.filter((t) =>
        (t.subjects || []).some((s) => {
          const name = typeof s === 'object' && s !== null ? (s.subject || '').toLowerCase() : String(s || '').toLowerCase();
          return name === sub;
        })
      );
    }
    if (norm(medium)) {
      const med = norm(medium);
      tutors = tutors.filter((t) =>
        (t.subjects || []).some((s) => {
          const arr = typeof s === 'object' && s !== null && Array.isArray(s.mediums) ? s.mediums : [];
          return arr.some((m) => String(m).toLowerCase() === med);
        })
      );
    }
    if (norm(classType)) {
      const ct = norm(classType);
      tutors = tutors.filter((t) => (t.classTypes || []).map((c) => String(c).toLowerCase()).includes(ct));
    }
    if (norm(classFormat)) {
      const cf = norm(classFormat);
      tutors = tutors.filter((t) => (t.classFormats || []).map((c) => String(c).toLowerCase()).includes(cf));
    }

    const reviews = await store.tutorReviews.get() || [];
    const byTutor = {};
    reviews.forEach((r) => {
      if (!byTutor[r.tutorId]) byTutor[r.tutorId] = [];
      byTutor[r.tutorId].push(r);
    });

    const approvedRequests = (await store.tutorProfileRequests.get() || []).filter((r) => r.status === 'APPROVED');
    const rateByTutorId = {};
    approvedRequests.forEach((r) => {
      if (r.userId && (r.submittedData?.hourlyRate != null && r.submittedData.hourlyRate !== '')) {
        rateByTutorId[r.userId] = Number(r.submittedData.hourlyRate);
      }
    });

    const withRatings = tutors.map((t) => {
      const list = byTutor[t.id] || [];
      const sum = list.reduce((a, r) => a + (r.rating || 0), 0);
      const avgRating = list.length ? Math.round((sum / list.length) * 10) / 10 : 0;
      const ratingCount = list.length;
      const rawRate = t.hourlyRate ?? rateByTutorId[t.id];
      const hourlyRate = (rawRate != null && rawRate !== '') ? Number(rawRate) : null;
      return {
        tutorId: t.id,
        id: t.id,
        name: t.fullName || t.name || 'Tutor',
        fullName: t.fullName || t.name || 'Tutor',
        subjects: t.subjects || [],
        classTypes: t.classTypes || [],
        classFormats: t.classFormats || [],
        bio: t.bio || '',
        hourlyRate,
        photoUrl: t.photoUrl || '',
        location: t.location || '',
        contactPhone: t.contactPhone || '',
        introVideoUrl: t.introVideoUrl || '',
        instituteId: t.instituteId || 'none',
        avgRating,
        ratingCount,
      };
    });

    withRatings.sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      if (b.ratingCount !== a.ratingCount) return b.ratingCount - a.ratingCount;
      return (a.name || '').localeCompare(b.name || '');
    });

    res.json({ tutors: withRatings });
  } catch (err) {
    console.error('Tutor search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Update Tutor Profile
tutorRegisterRouter.put('/profile', async (req, res) => {
  try {
    const { tutorId, name, bio, photo, photoUrl, hourlyRate, location, contactPhone, timetable, qualifications, subjects, classTypes, classFormats, introVideoUrl, meetingLink, instituteId } = req.body;
    
    // Security check: ensure the authenticated user is the one they claim to be
    // Handle both cases: header might exist from apiCall but req.user might not be populated if authMiddleware wasn't used globally
    const authTutorId = req.user?.id;
    const finalTutorId = tutorId || authTutorId;
    
    if (!finalTutorId) return res.status(400).json({ error: 'tutorId is required' });
    if (authTutorId && authTutorId !== finalTutorId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot update another tutor\'s profile' });
    }

    const existingTutor = await store.tutors.getById(finalTutorId);
    let updatedTutor;
    if (existingTutor) {
      const updates = {
        fullName: name || existingTutor.fullName,
        bio: bio ?? existingTutor.bio,
        photoUrl: photo || photoUrl || existingTutor.photoUrl,
        hourlyRate: hourlyRate ?? existingTutor.hourlyRate,
        location: location ?? existingTutor.location,
        contactPhone: contactPhone ?? existingTutor.contactPhone,
        timetable: timetable ?? existingTutor.timetable,
        qualifications: qualifications ?? existingTutor.qualifications,
        subjects: subjects ?? existingTutor.subjects,
        classTypes: classTypes ?? existingTutor.classTypes,
        classFormats: classFormats ?? existingTutor.classFormats,
        introVideoUrl: introVideoUrl ?? existingTutor.introVideoUrl,
        meetingLink: meetingLink ?? existingTutor.meetingLink ?? '',
        instituteId: instituteId !== undefined ? instituteId : (existingTutor.instituteId ?? 'none'),
      };
      await store.tutors.updateOne(finalTutorId, updates);
      updatedTutor = { ...existingTutor, ...updates };
    } else {
      updatedTutor = {
        id: finalTutorId,
        fullName: name || 'Tutor',
        bio: bio || '',
        photoUrl: photo || photoUrl || '',
        hourlyRate: hourlyRate || 0,
        location: location || '',
        contactPhone: contactPhone || '',
        timetable: timetable || '',
        qualifications: qualifications || [],
        subjects: subjects || [],
        classTypes: classTypes || [],
        classFormats: classFormats || [],
        introVideoUrl: introVideoUrl || '',
        meetingLink: meetingLink || '',
        instituteId: instituteId || 'none',
      };
      await store.tutors.insertOne(updatedTutor);
    }

    res.json({ success: true, tutorId: finalTutorId, tutor: updatedTutor });
  } catch (err) {
    console.error('Tutor profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

tutorRegisterRouter.post('/register', async (req, res) => {
  try {
    const body = req.body || {};
    const {
      email,
      password,
      fullName,
      name,
      bio,
      photo,
      photoUrl,
      hourlyRate,
      location,
      contactPhone,
      timetable,
      qualifications,
      subjects,
      classTypes,
      classFormats,
      introVideoUrl,
      // Institute Manager fields
      isInstituteManager,
      instituteRegistrationNo,
      instituteName,
      instituteLocation,
      instituteDescription,
    } = body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if email already registered
    const existingUser = await store.users.getByEmail(String(email).toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const id = uuidv4();
    const displayName = fullName || name || email || 'Tutor';

    const newUser = {
      id,
      email: String(email).toLowerCase(),
      passwordHash,
      fullName: displayName,
      role: 'tutor_pending',
      // Store institute manager flag on the user record for admin visibility
      ...(isInstituteManager && {
        isInstituteManager: true,
        instituteRegistrationNo: instituteRegistrationNo || '',
        instituteName: instituteName || '',
      }),
      createdAt: new Date().toISOString(),
    };
    await store.users.insertOne(newUser);

    // Organize users by role after tutor registration
    const allUsers = await store.users.get();
    await organizeUsersByRole(allUsers).catch((err) =>
      console.error('Failed to organize users:', err.message)
    );

    let requests = await store.tutorProfileRequests.get();
    if (!Array.isArray(requests)) requests = [];
    const requestId = uuidv4();
    const submittedData = {
      name: displayName,
      email: newUser.email,
      bio: bio || '',
      photo: photo || photoUrl || '',
      hourlyRate: typeof hourlyRate === 'number' ? hourlyRate : parseFloat(hourlyRate) || 0,
      location: location || instituteLocation || '',
      contactPhone: contactPhone || '',
      timetable: timetable || '',
      qualifications: Array.isArray(qualifications) ? qualifications : [],
      subjects: Array.isArray(subjects) ? subjects : [],
      classTypes: Array.isArray(classTypes) ? classTypes : [],
      classFormats: Array.isArray(classFormats) ? classFormats : [],
      introVideoUrl: typeof introVideoUrl === 'string' ? introVideoUrl : '',
      // Institute manager fields — visible to admin in review
      ...(isInstituteManager && {
        isInstituteManager: true,
        instituteRegistrationNo: instituteRegistrationNo || '',
        instituteName: instituteName || '',
        instituteLocation: instituteLocation || '',
        instituteDescription: instituteDescription || '',
      }),
    };
    requests.push({
      id: requestId,
      userId: id,
      submittedData,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedByAdminId: null,
      rejectionReason: null,
    });
    await store.tutorProfileRequests.set(requests);

    const token = signToken({ id, email: newUser.email, role: newUser.role }, '7d');
    res.status(201).json({
      message: 'Submitted for admin approval',
      userId: id,
      requestId,
      token,
      user: { id, role: newUser.role, fullName: displayName, email: newUser.email },
    });
  } catch (err) {
    console.error('Tutor register error:', err);
    const message = err && err.message ? err.message : 'Registration failed';
    res.status(500).json({ error: message });
  }
});

// GET /me/profile — authenticated tutor fetches their OWN profile for the edit/update page
tutorRegisterRouter.get('/me/profile', async (req, res) => {
  try {
    // req.user is populated by the optional authMiddleware in server.js when Authorization header is present
    const tutorId = req.user?.id;
    if (!tutorId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Fetch the tutor record from the tutors collection
    const tutors = await store.tutors.get() || [];
    const t = tutors.find((x) => x.id === tutorId) ||
              tutors.find((x) => x.userId === tutorId);

    // Also fetch any profile request (approved or pending) for fallback data
    const requests = await store.tutorProfileRequests.get() || [];
    const relevantReq = requests
      .filter((r) => r.userId === tutorId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
    const submittedData = relevantReq?.submittedData || {};

    // Fetch the user record for basic info
    const users = await store.users.get();
    const tutorUser = users.find((u) => u.id === tutorId);

    // Build profile — prefer live tutor record over submitted data
    const profile = {
      tutorId,
      id: tutorId,
      name: t?.fullName || submittedData.name || tutorUser?.fullName || '',
      fullName: t?.fullName || submittedData.name || tutorUser?.fullName || '',
      email: tutorUser?.email || submittedData.email || '',
      bio: t?.bio ?? submittedData.bio ?? '',
      photoUrl: t?.photoUrl || submittedData.photo || submittedData.photoUrl || '',
      hourlyRate:
        (t?.hourlyRate != null && t.hourlyRate !== '') ? Number(t.hourlyRate) :
        ((submittedData.hourlyRate != null && submittedData.hourlyRate !== '') ?
          (typeof submittedData.hourlyRate === 'number' ? submittedData.hourlyRate : parseFloat(submittedData.hourlyRate)) : 0),
      location: t?.location ?? submittedData.location ?? '',
      contactPhone: t?.contactPhone ?? submittedData.contactPhone ?? '',
      timetable: t?.timetable ?? submittedData.timetable ?? '',
      qualifications: (t?.qualifications && t.qualifications.length > 0) ? t.qualifications : (submittedData.qualifications || []),
      subjects: (t?.subjects && t.subjects.length > 0) ? t.subjects : (submittedData.subjects || []),
      classTypes: (t?.classTypes && t.classTypes.length > 0) ? t.classTypes : (submittedData.classTypes || []),
      classFormats: (t?.classFormats && t.classFormats.length > 0) ? t.classFormats : (submittedData.classFormats || []),
      introVideoUrl: t?.introVideoUrl || submittedData.introVideoUrl || '',
      meetingLink: t?.meetingLink || submittedData.meetingLink || '',
      instituteId: t?.instituteId || 'none',
      requestStatus: relevantReq?.status || null,
    };

    res.json({ profile });
  } catch (err) {
    console.error('Get my profile error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// ─── PUT /me/materials — Tutor saves learning materials per subject ──────────
tutorRegisterRouter.put('/me/materials', async (req, res) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) return res.status(401).json({ error: 'Authentication required' });
    if ((req.user?.role || '').toLowerCase() !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can update learning materials' });
    }

    const { learningMaterials } = req.body;
    if (!Array.isArray(learningMaterials)) {
      return res.status(400).json({ error: 'learningMaterials must be an array' });
    }

    // Ensure uploads directory exists
    const uploadsDir = pathNode.join(_dir, '..', 'uploads', 'materials', tutorId);
    fsNode.mkdirSync(uploadsDir, { recursive: true });

    // Helper: write a base64 data-URI to disk, return the served URL path
    const saveBase64File = async (dataUri, prefix) => {
      const match = dataUri.match(/^data:([^;]+);base64,(.+)$/s);
      if (!match) return null;
      const mimeType = match[1];
      const rawExt = mimeType.split('/')[1]?.split(';')[0] || 'bin';
      const ext = rawExt === 'quicktime' ? 'mov'
                : rawExt === 'x-msvideo' ? 'avi'
                : rawExt;
      const buffer = Buffer.from(match[2], 'base64');
      const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      await fsNode.promises.writeFile(pathNode.join(uploadsDir, filename), buffer);
      return `/api/materials/file/${tutorId}/${filename}`;
    };

    // Process each subject's videos and PDFs
    const processed = await Promise.all(
      learningMaterials.map(async (mat) => {
        const videos = await Promise.all((mat.videos || []).map(async (v) => {
          if (v.fileBase64 && v.fileBase64.startsWith('data:')) {
            // New local file upload — save to disk
            const fileUrl = await saveBase64File(v.fileBase64, 'vid');
            if (fileUrl) return { title: v.title, description: v.description, fileUrl, fileName: v.fileName, type: 'local' };
          }
          // Existing fileUrl (already on disk) — keep as-is
          if (v.fileUrl) return { title: v.title, description: v.description, fileUrl: v.fileUrl, fileName: v.fileName, type: 'local' };
          // URL-type (YouTube/Vimeo)
          return { title: v.title, description: v.description, url: v.url, type: 'url' };
        }));

        const pdfs = await Promise.all((mat.pdfs || []).map(async (p) => {
          if (p.fileBase64 && p.fileBase64.startsWith('data:')) {
            // New PDF upload — save to disk
            const fileUrl = await saveBase64File(p.fileBase64, 'pdf');
            if (fileUrl) return { title: p.title, fileName: p.fileName, fileUrl };
          }
          // Existing fileUrl — keep
          if (p.fileUrl) return { title: p.title, fileName: p.fileName, fileUrl: p.fileUrl };
          // Legacy base64 stored directly (backward compat)
          if (p.fileBase64) return { title: p.title, fileName: p.fileName, fileBase64: p.fileBase64 };
          return p;
        }));

        return { subject: mat.subject, category: mat.category, syllabus: mat.syllabus, videos, pdfs };
      })
    );

    // Persist to tutor document
    const existingTutor = await store.tutors.getById(tutorId);
    if (!existingTutor) {
      const tutors = await store.tutors.get();
      const t = tutors.find(x => x.userId === tutorId);
      if (!t) return res.status(404).json({ error: 'Tutor profile not found. Please complete your profile first.' });
      await store.tutors.updateOne(t.id, { learningMaterials: processed });
    } else {
      await store.tutors.updateOne(tutorId, { learningMaterials: processed });
    }

    res.json({ success: true, message: 'Learning materials saved successfully' });
  } catch (err) {
    console.error('Save learning materials error:', err);
    res.status(500).json({ error: 'Failed to save learning materials' });
  }
});


// ─── GET /:tutorId/materials — Student fetches materials (requires PAID booking) ──
tutorRegisterRouter.get('/:tutorId/materials', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const requestingUserId = req.user?.id;
    const requestingRole = (req.user?.role || '').toLowerCase();

    // Tutors can always see their own materials
    if (requestingUserId === tutorId && requestingRole === 'tutor') {
      const tutors = await store.tutors.get();
      const t = tutors.find(x => x.id === tutorId) || tutors.find(x => x.userId === tutorId);
      return res.json({ materials: t?.learningMaterials || [], tutorName: t?.fullName || '' });
    }

    // Admin can always see
    if (requestingRole === 'admin') {
      const tutors = await store.tutors.get();
      const t = tutors.find(x => x.id === tutorId) || tutors.find(x => x.userId === tutorId);
      return res.json({ materials: t?.learningMaterials || [], tutorName: t?.fullName || '' });
    }

    // Students: must have at least one PAID booking with this tutor
    if (!requestingUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const bookings = await store.bookings.get() || [];
    const hasPaidBooking = bookings.some(
      b => b.studentId === requestingUserId &&
           b.tutorId === tutorId &&
           b.paymentStatus === 'PAID'
    );

    if (!hasPaidBooking) {
      return res.status(403).json({
        error: 'Access denied. Complete payment for a class with this tutor to unlock learning materials.',
        locked: true
      });
    }

    const tutors = await store.tutors.get();
    const t = tutors.find(x => x.id === tutorId) || tutors.find(x => x.userId === tutorId);
    res.json({ materials: t?.learningMaterials || [], tutorName: t?.fullName || '' });
  } catch (err) {
    console.error('Get learning materials error:', err);
    res.status(500).json({ error: 'Failed to fetch learning materials' });
  }
});

// Detailed public profile for a single tutor (used by student-facing profile page)
tutorRegisterRouter.get('/:tutorId/details', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const users = await store.users.get();
    const tutorUser = users.find((u) => u.id === tutorId && ['tutor', 'tutor_pending', 'admin'].includes((u.role || '').toLowerCase()));
    if (!tutorUser) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    const tutors = await store.tutors.get() || [];
    // Match by id OR userId (tutor profile may be stored under userId = login user id)
    const t = tutors.find((x) => x.id === tutorId) ||
              tutors.find((x) => x.userId === tutorId);

    const requests = await store.tutorProfileRequests.get() || [];
    // Include PENDING requests so tutors can see their own data while waiting
    const relevantReq = requests
      .filter((r) => r.userId === tutorId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
    const submittedData = relevantReq?.submittedData || {};

    const reviews = await store.tutorReviews.get() || [];
    const thisTutorReviews = reviews.filter((r) => r.tutorId === tutorId);
    const sum = thisTutorReviews.reduce((a, r) => a + (r.rating || 0), 0);
    const avgRating = thisTutorReviews.length ? Math.round((sum / thisTutorReviews.length) * 10) / 10 : 0;
    const ratingCount = thisTutorReviews.length;

    const reviewsWithNames = thisTutorReviews.map((r) => {
      const student = users.find((u) => u.id === r.studentId);
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        studentName: student ? student.fullName : null,
      };
    });

    const profile = {
      tutorId,
      id: tutorId,
      name: t?.fullName || submittedData.name || tutorUser.fullName || 'Tutor',
      fullName: t?.fullName || submittedData.name || tutorUser.fullName || 'Tutor',
      subjects: (t?.subjects && t.subjects.length > 0) ? t.subjects : (submittedData.subjects || []),
      classTypes: (t?.classTypes && t.classTypes.length > 0) ? t.classTypes : (submittedData.classTypes || []),
      classFormats: (t?.classFormats && t.classFormats.length > 0) ? t.classFormats : (submittedData.classFormats || []),
      bio: t?.bio || submittedData.bio || '',
      hourlyRate:
        (t?.hourlyRate != null && t.hourlyRate !== '') ? t.hourlyRate :
        ((submittedData.hourlyRate != null && submittedData.hourlyRate !== '') ? 
          (typeof submittedData.hourlyRate === 'number' ? submittedData.hourlyRate : parseFloat(submittedData.hourlyRate)) : 0),
      photoUrl: t?.photoUrl || submittedData.photo || submittedData.photoUrl || '',
      location: t?.location || submittedData.location || '',
      contactPhone: t?.contactPhone || submittedData.contactPhone || '',
      timetable: t?.timetable || submittedData.timetable || '',
      qualifications: (t?.qualifications && t.qualifications.length > 0) ? t.qualifications : (submittedData.qualifications || []),
      introVideoUrl: t?.introVideoUrl || submittedData.introVideoUrl || '',
      meetingLink: t?.meetingLink || submittedData.meetingLink || '',
      instituteId: t?.instituteId || 'none',
      avgRating,
      ratingCount,
      reviews: reviewsWithNames,
      status: t?.status || 'offline'
    };

    if (profile.instituteId && profile.instituteId !== 'none') {
      const institutes = await store.institutes.get() || [];
      const inst = institutes.find(i => i.id === profile.instituteId);
      if (inst) {
        profile.institute = { name: inst.name, photo: inst.photo, location: inst.location };
        profile.location = inst.location || profile.location;
      }
    }

    res.json({ tutor: profile });
  } catch (err) {
    console.error('Tutor detail error:', err);
    res.status(500).json({ error: 'Failed to load tutor profile' });
  }
});
