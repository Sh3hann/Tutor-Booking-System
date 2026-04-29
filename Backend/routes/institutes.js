import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../data/store-mongo.js';
import { authMiddleware } from '../middleware/auth.js';

export const institutesRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getTutorMemberCount(instituteId) {
  const tutors = (await store.tutors.get()) || [];
  return tutors.filter(t => t.instituteId === instituteId).length;
}

// ─── PUBLIC: List all approved institutes ────────────────────────────────────
institutesRouter.get('/', async (req, res) => {
  try {
    const institutes = (await store.institutes.get()) || [];
    const validInstituteIds = new Set(institutes.map(i => i.id));

    const tutors = (await store.tutors.get()) || [];
    const instituteTutors = tutors.filter(t => t.instituteId && validInstituteIds.has(t.instituteId));
    
    const totalTutors = instituteTutors.length;
    
    const uniqueSubjects = new Set();
    instituteTutors.forEach(t => {
      if (Array.isArray(t.subjects)) {
        t.subjects.forEach(s => {
          const subjectName = typeof s === 'object' ? s.subject : s;
          if (subjectName) {
            uniqueSubjects.add(subjectName.toLowerCase().trim());
          }
        });
      }
    });
    
    res.json({ institutes, totalTutors, totalSubjects: uniqueSubjects.size });
  } catch (err) {
    console.error('List institutes error:', err);
    res.status(500).json({ error: 'Failed to fetch institutes' });
  }
});

// ─── PUBLIC: Get a single institute + its tutors ─────────────────────────────
institutesRouter.get('/:id', async (req, res, next) => {
  if (['manager-registrations', 'my-institute', 'requests', 'my'].includes(req.params.id)) {
    return next('route');
  }
  try {
    const institute = await store.institutes.getById(req.params.id);
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    // Fetch tutors that belong to this institute
    const tutors = (await store.tutors.get()) || [];
    const members = tutors.filter(t => t.instituteId === req.params.id);
    const users   = await store.users.get() || [];

    const tutorList = members.map(t => {
      // Tutor records store the user's UUID in t.id (no separate t.userId field)
      const u = users.find(u => u.id === t.id);
      return {
        id: t.id,
        name: u?.fullName || t.fullName || 'Unknown',
        photoUrl: t.photoUrl || t.photo || '',
        subjects: t.subjects || [],
        hourlyRate: t.hourlyRate || t.rate || 0,
        location: t.location || '',
        avgRating: t.avgRating || 0,
        ratingCount: t.ratingCount || 0,
        instituteTimetable: t.instituteTimetable || '',
      };
    });

    res.json({ institute, tutors: tutorList });
  } catch (err) {
    console.error('Get institute error:', err);
    res.status(500).json({ error: 'Failed to fetch institute' });
  }
});

// ─── BLOCKED: Direct admin creation disabled ─────────────────────────────────────────
// Institutes can only be created through:
//   a) The institute manager registration flow (/institute/register)
//   b) Admins approving 4+ tutor requests (/api/institutes/requests/approve)
institutesRouter.post('/', authMiddleware, async (req, res) => {
  return res.status(405).json({
    error: 'Direct institute creation is disabled.',
    info: 'Institutes are created by approving tutor join requests (4+ tutors required) or through the institute manager registration form.',
  });
});

// ─── MANAGER-ONLY: Update institute via admin panel (blocked for admins) ─────────────
// Use PUT /:id/settings instead (manager-only route)
institutesRouter.put('/:id', authMiddleware, async (req, res) => {
  try {
    const institute = await store.institutes.getById(req.params.id);
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    // Only the institute manager (creator) can edit — admins cannot bypass this
    const isManager = institute.managerId === req.user.id;
    if (!isManager) {
      return res.status(403).json({
        error: 'Only the institute manager (creator) can edit institute details.',
      });
    }

    const { name, description, location, timetable, photo } = req.body;
    const updates = {
      ...(name        !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(location    !== undefined && { location: location.trim() }),
      ...(timetable   !== undefined && { timetable: timetable.trim() }),
      ...(photo       !== undefined && { photo }),
      updatedAt: new Date().toISOString(),
    };

    const ok = await store.institutes.updateOne(req.params.id, updates);
    if (!ok) return res.status(404).json({ error: 'Institute not found' });

    const updated = await store.institutes.getById(req.params.id);
    res.json({ success: true, institute: updated });
  } catch (err) {
    console.error('Update institute error:', err);
    res.status(500).json({ error: 'Failed to update institute' });
  }
});

// ─── ADMIN: Delete an institute ───────────────────────────────────────────────
institutesRouter.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    await store.institutes.deleteOne(req.params.id);

    // Clear instituteId on tutors that belonged to this institute
    const tutors = (await store.tutors.get()) || [];
    const toUpdate = tutors.filter(t => t.instituteId === req.params.id);
    for (const t of toUpdate) {
      await store.tutors.updateOne(t.id || t.userId, { instituteId: 'none' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete institute error:', err);
    res.status(500).json({ error: 'Failed to delete institute' });
  }
});

// ─── ADMIN: Get pending institute manager registrations ───────────────────────
// These come from the tutor registration endpoint when isInstituteManager=true
institutesRouter.get('/manager-registrations', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const allRequests = (await store.tutorProfileRequests.get()) || [];
    // Filter to only institute manager registrations
    const managerReqs = allRequests.filter(r =>
      r.submittedData?.isInstituteManager === true && r.status === 'PENDING'
    );

    // Enrich with user data
    const users = (await store.users.get()) || [];
    const enriched = managerReqs.map(r => {
      const user = users.find(u => u.id === r.userId) || {};
      return {
        id:                   r.id,
        userId:               r.userId,
        status:               r.status,
        createdAt:            r.createdAt,
        managerName:          r.submittedData?.name || user.fullName || '',
        email:                r.submittedData?.email || user.email || '',
        instituteName:        r.submittedData?.instituteName || '',
        instituteLocation:    r.submittedData?.instituteLocation || '',
        instituteDescription: r.submittedData?.instituteDescription || '',
        instituteRegistrationNo: r.submittedData?.instituteRegistrationNo || '',
      };
    });

    res.json({ registrations: enriched });
  } catch (err) {
    console.error('Get manager registrations error:', err);
    res.status(500).json({ error: 'Failed to fetch manager registrations' });
  }
});

// ─── ADMIN: Approve an institute manager registration ─────────────────────────
institutesRouter.post('/manager-registrations/:requestId/approve', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { requestId } = req.params;
    const allRequests = (await store.tutorProfileRequests.get()) || [];
    const req_ = allRequests.find(r => r.id === requestId);
    if (!req_) return res.status(404).json({ error: 'Request not found' });

    // 1. Promote user role to institute_manager
    const users = (await store.users.get()) || [];
    const userIdx = users.findIndex(u => u.id === req_.userId);
    if (userIdx === -1) return res.status(404).json({ error: 'User not found' });

    users[userIdx].role = 'institute_manager';
    users[userIdx].isInstituteManager = true;
    await store.users.set(users);

    // 2. Create the institute and link it to this manager
    const institute = {
      id: req_.userId, // use userId as institute id for easy lookup
      name:        req_.submittedData?.instituteName || 'Unnamed Institute',
      description: req_.submittedData?.instituteDescription || '',
      location:    req_.submittedData?.instituteLocation || '',
      timetable:   '',
      photo:       '',
      managerId:   req_.userId,
      managerName: req_.submittedData?.name || users[userIdx].fullName || '',
      registrationNo: req_.submittedData?.instituteRegistrationNo || '',
      createdBy:   'registration',
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    };

    const existing = (await store.institutes.get()) || [];
    const clash = existing.find(i => i.name.toLowerCase() === institute.name.toLowerCase());
    if (!clash) {
      await store.institutes.insertOne(institute);
    } else {
      // Link existing institute to this manager
      await store.institutes.updateOne(clash.id, { managerId: req_.userId, updatedAt: new Date().toISOString() });
      institute.id = clash.id;
    }

    // 3. Mark request as APPROVED
    const idx = allRequests.findIndex(r => r.id === requestId);
    allRequests[idx].status = 'APPROVED';
    allRequests[idx].reviewedAt = new Date().toISOString();
    allRequests[idx].reviewedByAdminId = req.user.id;
    await store.tutorProfileRequests.set(allRequests);

    res.json({ success: true, instituteId: institute.id, message: 'Institute manager approved and institute created.' });
  } catch (err) {
    console.error('Approve manager registration error:', err);
    res.status(500).json({ error: 'Failed to approve registration' });
  }
});

// ─── ADMIN: Reject an institute manager registration ──────────────────────────
institutesRouter.patch('/manager-registrations/:requestId/reject', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { requestId } = req.params;
    const allRequests = (await store.tutorProfileRequests.get()) || [];
    const idx = allRequests.findIndex(r => r.id === requestId);
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });

    allRequests[idx].status = 'REJECTED';
    allRequests[idx].rejectionReason = req.body.reason || 'Rejected by admin';
    allRequests[idx].reviewedAt = new Date().toISOString();
    await store.tutorProfileRequests.set(allRequests);

    res.json({ success: true });
  } catch (err) {
    console.error('Reject manager registration error:', err);
    res.status(500).json({ error: 'Failed to reject registration' });
  }
});

// ─── INSTITUTE MANAGER: Get own institute ─────────────────────────────────────
institutesRouter.get('/my-institute', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'institute_manager') return res.status(403).json({ error: 'Institute managers only' });

    const institutes = (await store.institutes.get()) || [];
    const institute = institutes.find(i => i.managerId === req.user.id);
    if (!institute) return res.status(404).json({ error: 'No institute linked to your account yet' });

    // Get pending join requests from tutors
    const joinRequests = (await store.instituteJoinRequests?.get?.() || []).filter(
      r => r.instituteId === institute.id && (r.status === 'PENDING' || r.status === 'pending')
    );

    res.json({ institute, joinRequests });
  } catch (err) {
    console.error('Get my institute error:', err);
    res.status(500).json({ error: 'Failed to fetch institute' });
  }
});

// ─── ADMIN: Get all institute requests ────────────────────────────────────────
institutesRouter.get('/requests/all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const requests = (await store.instituteRequests.get()) || [];
    const pending  = requests.filter(r => r.status === 'PENDING');

    // Group by lowercased institute name to count unique tutors per name
    const grouped = {};
    for (const r of pending) {
      const key = r.instituteName.trim().toLowerCase();
      if (!grouped[key]) grouped[key] = { instituteName: r.instituteName.trim(), tutors: [], ids: [] };
      if (!grouped[key].tutors.includes(r.tutorId)) grouped[key].tutors.push(r.tutorId);
      grouped[key].ids.push(r.id);
    }

    const groups = Object.values(grouped).map(g => ({
      instituteName: g.instituteName,
      tutorCount:    g.tutors.length,
      requestIds:    g.ids,
      canApprove:    g.tutors.length >= 4,
    }));

    res.json({ requests: groups, rawRequests: pending });
  } catch (err) {
    console.error('Get institute requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// ─── TUTOR: Request a new institute ───────────────────────────────────────────
institutesRouter.post('/requests', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'tutor') return res.status(403).json({ error: 'Only tutors can request institutes' });

    const { instituteName } = req.body;
    if (!instituteName?.trim()) return res.status(400).json({ error: 'Institute name is required' });

    // Check if institute already exists (by name)
    const institutes = (await store.institutes.get()) || [];
    const exists = institutes.find(i => i.name.toLowerCase() === instituteName.trim().toLowerCase());
    if (exists) return res.status(400).json({ error: 'This institute already exists. Please select it from the list.' });

    // Check for duplicate request from same tutor
    const allRequests = (await store.instituteRequests.get()) || [];
    const duplicate = allRequests.find(
      r => r.tutorId === req.user.id &&
           r.instituteName.toLowerCase() === instituteName.trim().toLowerCase() &&
           r.status === 'PENDING'
    );
    if (duplicate) return res.status(400).json({ error: 'You already have a pending request for this institute' });

    const request = {
      id: uuidv4(),
      tutorId: req.user.id,
      instituteName: instituteName.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    await store.instituteRequests.insertOne(request);

    // Count how many tutors have requested this name
    const sameNameRequests = allRequests.filter(
      r => r.instituteName.toLowerCase() === instituteName.trim().toLowerCase() && r.status === 'PENDING'
    );
    const tutorCount = new Set([...sameNameRequests.map(r => r.tutorId), req.user.id]).size;

    res.status(201).json({
      success: true,
      request,
      tutorCount,
      message: `Request submitted! ${tutorCount}/4 tutors needed before admin can create this institute.`,
    });
  } catch (err) {
    console.error('Request institute error:', err);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// ─── ADMIN: Approve a request group (creates the institute) ──────────────────
institutesRouter.post('/requests/approve', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { instituteName, name, description, location, timetable, photo } = req.body;
    const resolvedName = (name || instituteName || '').trim();
    if (!resolvedName) return res.status(400).json({ error: 'Institute name required' });

    // Validate tutor count
    const allRequests = (await store.instituteRequests.get()) || [];
    const matchingRequests = allRequests.filter(
      r => r.instituteName.toLowerCase() === resolvedName.toLowerCase() && r.status === 'PENDING'
    );
    const uniqueTutors = new Set(matchingRequests.map(r => r.tutorId));
    if (uniqueTutors.size < 4) {
      return res.status(400).json({
        error: `Need at least 4 tutors to create this institute. Currently have ${uniqueTutors.size}.`,
      });
    }

    // Create the institute
    const institute = {
      id: uuidv4(),
      name: resolvedName,
      description: (description || '').trim(),
      location: (location || '').trim(),
      timetable: (timetable || '').trim(),
      photo: photo || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await store.institutes.insertOne(institute);

    // Mark all requests for this name as APPROVED
    for (const r of matchingRequests) {
      await store.instituteRequests.updateOne(r.id, {
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
        instituteId: institute.id,
      });
    }

    res.json({ success: true, institute });
  } catch (err) {
    console.error('Approve institute request error:', err);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// ─── ADMIN: Reject a request ─────────────────────────────────────────────────
institutesRouter.patch('/requests/:id/reject', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    await store.instituteRequests.updateOne(req.params.id, {
      status: 'REJECTED',
      rejectedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Reject institute request error:', err);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// ─── BLOCKED: Tutor direct institute creation disabled ──────────────────────────────
// Tutors can only request to JOIN an existing institute via POST /:id/join
// or request a new institute name via POST /requests (needs 4 tutors for approval)
institutesRouter.post('/create-by-tutor', authMiddleware, async (req, res) => {
  return res.status(405).json({
    error: 'Tutors cannot create institutes directly.',
    info: 'To request a new institute, use POST /api/institutes/requests. Your request will be created once 4+ tutors request the same institute name and an admin approves it.',
  });
});

// ─── PUBLIC: Get a single institute with manager flag for caller ───────────────
// This must be BEFORE the `/:id` route or it would be shadowed — but since we use
// a different sub-path style (/manager suffix) we place it here and it works fine
// Note: /:id already exists above; this is a separate shape endpoint.
institutesRouter.get('/:id/manager-info', async (req, res) => {
  try {
    const institute = await store.institutes.getById(req.params.id);
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    // Determine caller from Authorization header (optional — not enforced)
    let callerId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const JWT_SECRET = process.env.JWT_SECRET || 'tutor-chat-secret-change-in-production';
        const decoded = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
        callerId = decoded.id;
      } catch { /* not authenticated — fine */ }
    }

    const tutors = (await store.tutors.get()) || [];
    const members = tutors.filter(t => t.instituteId === req.params.id);
    const users = await store.users.get() || [];

    const tutorList = members.map(t => {
      const u = users.find(u => u.id === t.userId || u.id === t.id);
      return {
        id: t.userId || t.id,
        name: u?.fullName || t.fullName || 'Unknown',
        photoUrl: t.photoUrl || t.photo || '',
        subjects: t.subjects || [],
        hourlyRate: t.hourlyRate || t.rate || 0,
        location: t.location || '',
        avgRating: t.avgRating || 0,
        ratingCount: t.ratingCount || 0,
        instituteTimetable: t.instituteTimetable || '',
      };
    });

    res.json({
      institute,
      tutors: tutorList,
      isManager: !!(callerId && institute.managerId === callerId),
    });
  } catch (err) {
    console.error('Get institute manager-info error:', err);
    res.status(500).json({ error: 'Failed to fetch institute' });
  }
});

// ─── MANAGER-ONLY: Update institute settings ────────────────────────────────────────────
institutesRouter.put('/:id/settings', authMiddleware, async (req, res) => {
  try {
    const institute = await store.institutes.getById(req.params.id);
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    // ONLY the original creator/manager can edit — admins cannot bypass
    const isManager = institute.managerId === req.user.id;
    if (!isManager) {
      return res.status(403).json({
        error: 'Only the institute creator (manager) can edit settings.',
      });
    }

    const { name, description, location, timetable, photo, banner } = req.body;

    // Name uniqueness check (only if changing the name)
    if (name && name.trim().toLowerCase() !== institute.name.toLowerCase()) {
      const all = (await store.institutes.get()) || [];
      const clash = all.find(i => i.id !== req.params.id && i.name.toLowerCase() === name.trim().toLowerCase());
      if (clash) return res.status(400).json({ error: 'Another institute already has this name.' });
    }

    const updates = {
      ...(name        !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(location    !== undefined && { location: location.trim() }),
      ...(timetable   !== undefined && { timetable: timetable.trim() }),
      ...(photo       !== undefined && { photo }),
      ...(banner      !== undefined && { banner }),
      updatedAt: new Date().toISOString(),
    };

    await store.institutes.updateOne(req.params.id, updates);
    const updated = await store.institutes.getById(req.params.id);
    res.json({ success: true, institute: updated });
  } catch (err) {
    console.error('Update institute settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ─── MANAGER / ADMIN: Delete own institute ────────────────────────────────────
institutesRouter.delete('/:id/manager', authMiddleware, async (req, res) => {
  try {
    const institute = await store.institutes.getById(req.params.id);
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const isAdmin   = req.user.role === 'admin';
    const isManager = institute.managerId === req.user.id;
    if (!isAdmin && !isManager) return res.status(403).json({ error: 'Not authorized' });

    await store.institutes.deleteOne(req.params.id);

    // Unlink tutors from this institute
    const tutors = (await store.tutors.get()) || [];
    for (const t of tutors.filter(t => t.instituteId === req.params.id)) {
      await store.tutors.updateOne(t.id || t.userId, { instituteId: 'none' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete institute (manager) error:', err);
    res.status(500).json({ error: 'Failed to delete institute' });
  }
});

// ─── TUTOR: Request to join an existing institute ─────────────────────────────
institutesRouter.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'tutor') return res.status(403).json({ error: 'Only tutors can join institutes' });
    
    const institute = await store.institutes.getById(req.params.id);
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    // Check if already requested
    const allRequests = await store.instituteJoinRequests.get() || [];
    const pendingRequest = allRequests.find(r => r.tutorId === req.user.id && r.status === 'PENDING');
    if (pendingRequest) {
      return res.status(400).json({ error: 'You already have a pending request.' });
    }

    const acceptedRequest = allRequests.find(r => r.tutorId === req.user.id && r.instituteId === institute.id && r.status === 'APPROVED');
    if (acceptedRequest) {
      return res.status(400).json({ error: 'You have already been accepted to this institute.' });
    }

    const tutors = await store.tutors.get() || [];
    const t = tutors.find(t => t.id === req.user.id || t.userId === req.user.id);
    if (t && t.instituteId === institute.id) {
      return res.status(400).json({ error: 'You are already a member of this institute.' });
    }

    const users = await store.users.get();
    const user = users.find(u => u.id === req.user.id);

    const request = {
      id: uuidv4(),
      tutorId: req.user.id,
      tutorName: user?.fullName || req.user.email,
      instituteId: institute.id,
      instituteName: institute.name,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    await store.instituteJoinRequests.insertOne(request);
    res.status(201).json({ success: true, request });
  } catch (err) {
    console.error('Join institute error:', err);
    res.status(500).json({ error: 'Failed to request joining' });
  }
});

// ─── GET /my/tutor-join-request: Tutor fetch their own pending request ───────
institutesRouter.get('/my/tutor-join-request', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'tutor') return res.status(403).json({ error: 'Only tutors' });
    const allRequests = await store.instituteJoinRequests.get() || [];
    const existing = allRequests.find(r => r.tutorId === req.user.id && r.status === 'PENDING');
    res.json({ request: existing || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch join request' });
  }
});

// ─── MANAGER: Get pending join requests for their institute ───────────────────
institutesRouter.get('/my/join-requests', authMiddleware, async (req, res) => {
  try {
    const allInstitutes = await store.institutes.get() || [];
    const myInstitute = allInstitutes.find(i => i.managerId === req.user.id);
    if (!myInstitute) return res.json({ requests: [] });

    const allRequests = await store.instituteJoinRequests.get() || [];
    const pending = allRequests.filter(r => r.instituteId === myInstitute.id && r.status === 'PENDING');
    res.json({ requests: pending });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch join requests' });
  }
});

// ─── MANAGER: Approve Join Request ────────────────────────────────────────────
institutesRouter.post('/join-requests/:requestId/approve', authMiddleware, async (req, res) => {
  try {
    const reqItem = await store.instituteJoinRequests.getById(req.params.requestId);
    if (!reqItem) return res.status(404).json({ error: 'Request not found' });

    const institute = await store.institutes.getById(reqItem.instituteId);
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    // Must be manager or admin
    if (institute.managerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    reqItem.status = 'APPROVED';
    reqItem.approvedAt = new Date().toISOString();
    await store.instituteJoinRequests.updateOne(reqItem.id, reqItem);

    // Update the tutor's instituteId
    const tutors = await store.tutors.get() || [];
    const t = tutors.find(t => t.id === reqItem.tutorId || t.userId === reqItem.tutorId);
    if (t) {
      await store.tutors.updateOne(t.id, { instituteId: institute.id });
    }

    res.json({ success: true, request: reqItem });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve' });
  }
});

// ─── MANAGER: Reject Join Request ────────────────────────────────────────────
institutesRouter.post('/join-requests/:requestId/reject', authMiddleware, async (req, res) => {
  try {
    const reqItem = await store.instituteJoinRequests.getById(req.params.requestId);
    if (!reqItem) return res.status(404).json({ error: 'Request not found' });

    const institute = await store.institutes.getById(reqItem.instituteId);
    if (!institute || (institute.managerId !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    reqItem.status = 'REJECTED';
    reqItem.rejectedAt = new Date().toISOString();
    await store.instituteJoinRequests.updateOne(reqItem.id, reqItem);

    res.json({ success: true, request: reqItem });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject' });
  }
});

// ─── MANAGER: Update Tutor Institute Timetable ─────────────────────────────────
institutesRouter.put('/:id/tutors/:tutorId/timetable', authMiddleware, async (req, res) => {
  try {
    const institute = await store.institutes.getById(req.params.id);
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    // Only manager or admin can edit
    if (institute.managerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { tutorId } = req.params;
    const { instituteTimetable } = req.body;

    const tutors = await store.tutors.get() || [];
    const tutor = tutors.find(t => (t.id === tutorId || t.userId === tutorId) && t.instituteId === institute.id);
    
    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found in this institute' });
    }

    await store.tutors.updateOne(tutor.id, { instituteTimetable: instituteTimetable || '' });

    res.json({ success: true, message: 'Timetable updated' });
  } catch (err) {
    console.error('Update institute timetable error:', err);
    res.status(500).json({ error: 'Failed to update timetable' });
  }
});
