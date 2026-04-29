import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../data/store-mongo.js';

export const tutorsRouter = Router();

const MAX_COMMENT_LENGTH = 2000;

// POST /api/tutors/:tutorId/reviews - student only, one review per student per tutor (upsert)
tutorsRouter.post('/:tutorId/reviews', async (req, res) => {
  try {
    if ((req.user?.role || '').toLowerCase() !== 'student') {
      return res.status(403).json({ error: 'Only students can submit ratings' });
    }
    const { tutorId } = req.params;
    const { rating, comment } = req.body || {};
    const ratingNum = typeof rating === 'number' ? rating : parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    const commentStr = typeof comment === 'string' ? comment.trim().slice(0, MAX_COMMENT_LENGTH) : '';
    const users = await store.users.get();
    const approvedIds = new Set(users.filter((u) => u.role === 'tutor').map((u) => u.id));
    if (!approvedIds.has(tutorId)) {
      return res.status(404).json({ error: 'Tutor not found' });
    }
    let reviews = await store.tutorReviews.get();
    if (!Array.isArray(reviews)) reviews = [];
    const studentId = req.user.id;
    const existing = reviews.findIndex((r) => r.tutorId === tutorId && r.studentId === studentId);
    const review = {
      id: existing >= 0 ? reviews[existing].id : uuidv4(),
      tutorId,
      studentId,
      rating: ratingNum,
      comment: commentStr,
      createdAt: new Date().toISOString(),
    };
    if (existing >= 0) {
      reviews[existing] = review;
    } else {
      reviews.push(review);
    }
    await store.tutorReviews.set(reviews);
    res.status(existing >= 0 ? 200 : 201).json({ success: true, review });
  } catch (err) {
    console.error('Post review error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// GET /api/tutors/:tutorId/reviews - public list of reviews for a tutor
tutorsRouter.get('/:tutorId/reviews', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const reviews = (await store.tutorReviews.get() || []).filter((r) => r.tutorId === tutorId);
    const users = await store.users.get();
    const withNames = reviews.map((r) => {
      const student = users.find((u) => u.id === r.studentId);
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        studentName: student ? student.fullName : null,
      };
    });
    res.json({ reviews: withNames });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/tutors/:tutorId - fetch tutor profile for autofill (authenticated users only)
tutorsRouter.get('/:tutorId', async (req, res) => {
  try {
    const { tutorId } = req.params;
    
    // Security check: only allow the tutor themselves or admins to fetch
    if (req.user.id !== tutorId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const tutor = await store.tutors.getById(tutorId);
    if (!tutor) {
      return res.status(404).json({ error: 'Tutor profile not found' });
    }
    
    res.json({ tutor });
  } catch (err) {
    console.error('Get tutor profile error:', err);
    res.status(500).json({ error: 'Failed to fetch tutor profile' });
  }
});
