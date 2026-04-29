import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { store } from '../data/store-mongo.js';

export const chatRouter = Router();

chatRouter.use(authMiddleware);

chatRouter.get('/requests/tutor/pending', async (req, res) => {
  try {
    if (req.user.role !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can view requests' });
    }

    const requests = await store.chatRequests.get();
    const users = await store.users.get();
    
    const tutorRequests = requests
      .filter((r) => r.tutorId === req.user.id && r.status === 'PENDING')
      .map((r) => {
        const student = users.find((u) => u.id === r.studentId);
        return {
          ...r,
          student: student ? { id: student.id, fullName: student.fullName } : null,
        };
      });

    res.json({ requests: tutorRequests });
  } catch (err) {
    console.error('Get tutor requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

chatRouter.get('/tutor/chat/requests', async (req, res) => {
  try {
    if (req.user.role !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can view requests' });
    }

    const { status = 'PENDING' } = req.query;
    const requests = await store.chatRequests.get();
    const users = await store.users.get();
    
    const tutorRequests = requests
      .filter((r) => r.tutorId === req.user.id && r.status === status)
      .map((r) => {
        const student = users.find((u) => u.id === r.studentId);
        return {
          ...r,
          student: student ? { id: student.id, fullName: student.fullName } : null,
        };
      });

    res.json({ requests: tutorRequests });
  } catch (err) {
    console.error('Get tutor requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

chatRouter.post('/requests', async (req, res) => {
  try {
    const { tutorId } = req.body;
    const studentId = req.user.id;

    const role = (req.user?.role || '').toLowerCase();
    if (role !== 'student') {
      return res.status(403).json({ error: 'Only students can create chat requests' });
    }
    if (!tutorId) {
      return res.status(400).json({ error: 'tutorId required' });
    }

    const tutors = await store.tutors.get();
    if (!tutors.some((t) => t.id === tutorId)) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    const requests = await store.chatRequests.get();
    const existing = requests.find(
      (r) => r.studentId === studentId && r.tutorId === tutorId && r.status === 'PENDING'
    );
    if (existing) {
      return res.status(400).json({ error: 'Request already pending' });
    }

    const id = uuidv4();
    const request = {
      id,
      studentId,
      tutorId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    requests.push(request);
    await store.chatRequests.set(requests);

    const users = await store.users.get();
    const student = users.find((u) => u.id === studentId);

    res.status(201).json({
      request: {
        ...request,
        student: student ? { id: student.id, fullName: student.fullName } : null,
      },
    });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

chatRouter.patch('/requests/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get('io');
    if (req.user.role !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can accept requests' });
    }

    const requests = await store.chatRequests.get();
    const reqIndex = requests.findIndex((r) => r.id === id && r.tutorId === req.user.id);
    if (reqIndex === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const chatReq = requests[reqIndex];
    if (chatReq.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    chatReq.status = 'ACCEPTED';
    await store.chatRequests.set(requests);

    let threads = await store.chatThreads.get();
    let thread = threads.find(
      (t) => t.studentId === chatReq.studentId && t.tutorId === chatReq.tutorId
    );

    if (!thread) {
      thread = {
        id: uuidv4(),
        studentId: chatReq.studentId,
        tutorId: chatReq.tutorId,
        requestId: id,
        createdAt: new Date().toISOString(),
      };
      threads.push(thread);
      await store.chatThreads.set(threads);
    }

    io?.emit('requestUpdated', {
      requestId: id,
      status: 'ACCEPTED',
      threadId: thread.id,
      studentId: chatReq.studentId,
    });

    res.json({
      request: chatReq,
      threadId: thread.id,
    });
  } catch (err) {
    console.error('Accept request error:', err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

chatRouter.patch('/requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get('io');
    if (req.user.role !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can reject requests' });
    }

    const requests = await store.chatRequests.get();
    const reqIndex = requests.findIndex((r) => r.id === id && r.tutorId === req.user.id);
    if (reqIndex === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const chatReq = requests[reqIndex];
    chatReq.status = 'REJECTED';
    await store.chatRequests.set(requests);

    io?.emit('requestUpdated', {
      requestId: id,
      status: 'REJECTED',
      studentId: chatReq.studentId,
    });

    res.json({ request: chatReq });
  } catch (err) {
    console.error('Reject request error:', err);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

chatRouter.get('/threads', async (req, res) => {
  try {
    const threads = await store.chatThreads.get();
    const requests = await store.chatRequests.get();
    const users = await store.users.get();
    const tutors = await store.tutors.get();

    const myThreads = threads.filter(
      (t) => t.studentId === req.user.id || t.tutorId === req.user.id
    );

    const acceptedRequestIds = new Set(
      requests.filter((r) => r.status === 'ACCEPTED').map((r) => r.id)
    );

    const result = myThreads
      .filter((t) => !t.requestId || acceptedRequestIds.has(t.requestId))
      .map((t) => {
        const isStudent = req.user.role === 'student';
        const otherId = isStudent ? t.tutorId : t.studentId;
        const otherUser = users.find((u) => u.id === otherId);
        const tutor = tutors.find((tr) => tr.id === otherId);

        return {
          id: t.id,
          threadId: t.id,
          otherUser: {
            id: otherId,
            name: otherUser?.fullName || tutor?.fullName || 'Unknown',
            role: isStudent ? 'tutor' : 'student',
          },
          requestId: t.requestId,
          createdAt: t.createdAt,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ threads: result });
  } catch (err) {
    console.error('Get threads error:', err);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

chatRouter.get('/threads/:threadId/messages', async (req, res) => {
  try {
    const { threadId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const threads = await store.chatThreads.get();
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    if (thread.studentId !== req.user.id && thread.tutorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const requests = await store.chatRequests.get();
    const request = thread.requestId
      ? requests.find((r) => r.id === thread.requestId)
      : null;
    if (request && request.status !== 'ACCEPTED') {
      return res.status(403).json({ error: 'Chat not yet approved' });
    }

    const messages = await store.chatMessages.get();
    const threadMessages = messages
      .filter((m) => m.threadId === threadId)
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
      .slice(0, limit)
      .reverse();

    res.json({ messages: threadMessages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});
