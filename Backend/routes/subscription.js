import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { store } from '../data/store-mongo.js';

export const subscriptionRouter = Router();

// Helper: Create trial subscription in MongoDB
async function createTrialSubscription(tutorId) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const subscription = {
    tutorId,
    plan: 'trial',
    status: 'active',
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await store.subscriptions.upsertByTutorId(tutorId, subscription);
  return subscription;
}

// Helper: Create paid subscription
async function createPaidSubscription(tutorId, plan) {
  const now = new Date();
  const days = plan === 'annual' ? 365 : 30;
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const subscription = {
    tutorId,
    plan,
    status: 'active',
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await store.subscriptions.upsertByTutorId(tutorId, subscription);
  return subscription;
}

// POST /api/subscription/trial — for tutors logged in via Node backend
subscriptionRouter.post('/trial', authMiddleware, async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    if (role !== 'tutor' && role !== 'tutor_pending') {
      return res.status(403).json({ error: 'Only tutors can accept free trial' });
    }

    const tutorId = req.user.id;

    // ✅ FIX: Promote tutor_pending → tutor so they appear in student search
    if (role === 'tutor_pending') {
      try {
        const users = await store.users.get();
        const updatedUsers = users.map((u) =>
          u.id === tutorId ? { ...u, role: 'tutor' } : u
        );
        await store.users.set(updatedUsers);
        console.log(`[Subscription] Promoted tutor ${tutorId} from tutor_pending to tutor`);
      } catch (err) {
        console.error('[Subscription] Failed to promote user role:', err.message);
      }
    }

    const subscription = await createTrialSubscription(tutorId);

    const expiresAt = new Date(subscription.expiresAt);
    const now = new Date();
    const active = expiresAt > now;

    res.json({
      subscription: {
        ...subscription,
        active,
        isTrial: subscription.plan === 'trial',
      },
      newRole: 'tutor',
    });
  } catch (err) {
    console.error('Subscription trial error:', err);
    res.status(500).json({ error: 'Failed to start free trial' });
  }
});

// POST /api/subscription/pay — subscribe to monthly or annual plan (simulated)
subscriptionRouter.post('/pay', authMiddleware, async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    if (role !== 'tutor' && role !== 'tutor_pending') {
      return res.status(403).json({ error: 'Only tutors can subscribe' });
    }

    const { plan } = req.body || {};
    if (!['monthly', 'annual'].includes(plan)) {
      return res.status(400).json({ error: 'Plan must be monthly or annual' });
    }

    const tutorId = req.user.id;

    // Promote tutor_pending → tutor if paying directly
    if (role === 'tutor_pending') {
      try {
        const users = await store.users.get();
        const updatedUsers = users.map((u) =>
          u.id === tutorId ? { ...u, role: 'tutor' } : u
        );
        await store.users.set(updatedUsers);
        console.log(`[Subscription] Promoted tutor ${tutorId} via paid subscription`);
      } catch (err) {
        console.error('[Subscription] Failed to promote user role:', err.message);
      }
    }

    const subscription = await createPaidSubscription(tutorId, plan);

    const expiresAt = new Date(subscription.expiresAt);
    const now = new Date();
    const active = expiresAt > now;

    res.json({
      subscription: {
        ...subscription,
        active,
        isTrial: false,
      },
      newRole: 'tutor',
    });
  } catch (err) {
    console.error('Subscription pay error:', err);
    res.status(500).json({ error: 'Failed to process subscription' });
  }
});

// GET /api/subscription/:tutorId — fetch subscription info for a tutor (public endpoint)
subscriptionRouter.get('/:tutorId', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const sub = await store.subscriptions.getByTutorId(tutorId);

    if (!sub) {
      return res.json({ subscription: null });
    }

    const expiresAt = new Date(sub.expiresAt);
    const now = new Date();
    const active = expiresAt > now;

    res.json({
      subscription: {
        ...sub,
        active,
        isTrial: sub.plan === 'trial',
      },
    });
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});
