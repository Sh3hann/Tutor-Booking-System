import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { optionalAuthMiddleware } from '../middleware/auth.js';

const SYSTEM_PROMPT = `You are the TutorHub Assistant — a knowledgeable, friendly, and concise support chatbot built into the TutorHub platform.

Your ONLY job is to answer questions about TutorHub based on the platform summary below. You must NEVER guess, fabricate, or assume features.

--- TUTORHUB PLATFORM SUMMARY ---

OVERVIEW:
TutorHub is an online tutor finding and management platform connecting students with qualified tutors. Everything happens in one system.

USER ROLES:
- STUDENT: Register, search tutors (filters: Subject, Grade, Medium, Class Type/Format), view profiles, chat, send requests, rate tutors.
- TUTOR: Create profile (review required), qualifications, subjects, availability, messaging, handle requests, add demo videos.
- ADMIN: Manage users, roles, subjects, approve tutor profiles, monitor activity.

KEY FEATURES:
- Search System: Filter by Subject, Category, Medium, Type, Format.
- Rating System: Star ratings and written reviews.
- Chat System: Built-in real-time messaging.
- Requests: Students send class requests; Tutors accept or manage them.
- Demo Videos: Tutor profiles can include demo videos. Tutors embed YouTube or Vimeo links in their profile’s “Demo Video” section. Students (who must be logged in to view profiles) can click the video thumbnail on the tutor’s page to play it directly in the browser without any additional downloads or secondary logins.

--- RESPONSE STYLE RULES (MANDATORY) ---

1. BE CONCISE: Keep replies between 3–8 lines. Avoid long paragraphs.
2. CHAT-FIRST FORMAT:
   - Use short paragraphs and clear spacing.
   - Use **bold** for key terms or section labels only.
   - Use bullet points for features.
   - Use numbered steps (1-2 lines each) for "how to" questions.
3. TONE: Friendly, modern, and helpful. Avoid robotic or overly formal language.
4. DIRECT ANSWERS: Start with the answer immediately. No "Sure! Here's how..." or filler intros.
5. UI-SAFE: No tables. No huge blocks of text. No generic AI disclaimers.

--- FORMAT BY QUESTION TYPE ---

- HOW-TO: Short intro + numbered steps.
- FEATURES/INFO: Short bullets or 2-4 compact paragraphs.
- YES/NO: Start with "Yes" or "No" + brief explanation.
- PAYMENTS/BOOKINGS: Specific to TutorHub. Practical and action-oriented.`;

export const aiChatRouter = Router();

aiChatRouter.use(optionalAuthMiddleware);

function getClientId(req) {
  return req.user?.id || req.headers['x-guest-id'] || 'anonymous';
}

function normalize(text = '') {
  return String(text).toLowerCase().trim();
}

function faqAnswer(promptRaw = '') {
  const prompt = normalize(promptRaw);

  const rules = [
    {
      when: (p) => /book|booking|request|schedule|class/.test(p),
      answer:
        'Booking a tutor is simple:\n\n1. **Open a tutor profile**\n2. **Select date & time**\n3. **Send request**\n4. **Wait for approval**\n\nYour request stays "Pending" until the tutor accepts it.',
    },
    {
      when: (p) => /edit|change|update.*booking|resched/.test(p),
      answer:
        'You can edit a booking request only while it is **Pending**. Once a tutor accepts it, the request is locked and cannot be changed.',
    },
    {
      when: (p) => /cancel|delete.*booking/.test(p),
      answer:
        'Yes, you can cancel a request if it is still **Pending**. If it’s already accepted, please contact the tutor directly to cancel.',
    },
    {
      when: (p) => /pay|payment|paid|card|price|cost|fee/.test(p),
      answer:
        'Payments are made after the tutor accepts your request. Once paid, the booking status will update automatically.',
    },
    {
      when: (p) => /meeting|link|online|zoom|google meet|meet/.test(p),
      answer:
        'For online classes, the meeting link becomes visible on your dashboard only after the booking is **accepted and paid**.',
    },
    {
      when: (p) => /chat|message|conversation/.test(p),
      answer:
        'To message a tutor:\n\n1. Go to the **Tutors List**\n2. Click **Add Chat** on their card\n3. Once they accept, start chatting in real-time.',
    },
    {
      when: (p) => /tutor|find.*tutor|search|subject/.test(p),
      answer:
        'Use **Student Search** to find tutors. You can filter by subject, grade, class format (online/physical), and teaching medium.',
    },
    {
      when: (p) => /help|support|contact/.test(p),
      answer:
        'I can help with bookings, payments, and finding tutors. What are you looking to do today?',
    },
  ];

  for (const r of rules) {
    if (r.when(prompt)) return r.answer;
  }

  return 'I can help with booking, payments, chat, and finding tutors. What are you trying to do?';
}

async function getAllSessions() {
  // Stored inside Mongo via generic store "aiChatSessions" / "aiChatMessages" like other entities.
  // If store methods don’t exist yet, fall back to raw collections via existing patterns.
  const db = await (await import('../config/mongodb.js')).getDB();
  const sessions = await db.collection('ai_chat_sessions').find({}).toArray();
  return sessions.map(({ _id, ...rest }) => rest);
}

async function setAllSessions(next) {
  const db = await (await import('../config/mongodb.js')).getDB();
  const col = db.collection('ai_chat_sessions');
  await col.deleteMany({});
  if (next.length) await col.insertMany(next);
}

aiChatRouter.get('/health', async (req, res) => {
  try {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/tags`, { method: 'GET' }).catch(() => null);
    
    if (response && response.ok) {
      res.json({ success: true, ollama: true });
    } else {
      res.json({ success: false, ollama: false });
    }
  } catch (err) {
    res.json({ success: false, ollama: false });
  }
});

async function getAllMessages() {
  const db = await (await import('../config/mongodb.js')).getDB();
  const docs = await db.collection('ai_chat_messages').find({}).toArray();
  return docs.map(({ _id, ...rest }) => rest);
}

async function setAllMessages(next) {
  const db = await (await import('../config/mongodb.js')).getDB();
  const col = db.collection('ai_chat_messages');
  await col.deleteMany({});
  if (next.length) await col.insertMany(next);
}

aiChatRouter.get('/sessions', async (req, res) => {
  try {
    const clientId = getClientId(req);
    const all = await getAllSessions();
    const mine = all
      .filter((s) => (s.userId === clientId || s.guestId === clientId))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json({ sessions: mine });
  } catch (err) {
    console.error('AI chat list sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

aiChatRouter.post('/sessions', async (req, res) => {
  try {
    const clientId = getClientId(req);
    const now = new Date().toISOString();
    const session = {
      id: uuidv4(),
      userId: req.user ? req.user.id : null,
      guestId: req.user ? null : clientId,
      title: 'New chat',
      createdAt: now,
      updatedAt: now,
    };

    const all = await getAllSessions();
    all.push(session);
    await setAllSessions(all);

    res.status(201).json({ session });
  } catch (err) {
    console.error('AI chat create session error:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

aiChatRouter.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const clientId = getClientId(req);
    const sessions = await getAllSessions();
    const session = sessions.find((s) => s.id === sessionId && (s.userId === clientId || s.guestId === clientId));
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const all = await getAllMessages();
    const mine = all
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json({ messages: mine });
  } catch (err) {
    console.error('AI chat get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

aiChatRouter.post('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const clientId = getClientId(req);
    const { content } = req.body || {};
    const text = String(content || '').trim();
    if (!text) return res.status(400).json({ error: 'content required' });

    const sessions = await getAllSessions();
    const idx = sessions.findIndex((s) => s.id === sessionId && (s.userId === clientId || s.guestId === clientId));
    if (idx === -1) return res.status(404).json({ error: 'Session not found' });

    const now = new Date().toISOString();
    const userMessage = {
      id: uuidv4(),
      sessionId,
      role: 'user',
      content: text.slice(0, 4000),
      createdAt: now,
    };

    const allMessages = await getAllMessages();
    const history = allMessages
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

    let aiResponse = '';
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';

    try {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          stream: false,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: text },
          ],
        }),
      });

      if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
      const data = await response.json();
      aiResponse = data.message?.content || faqAnswer(text);
    } catch (err) {
      console.error('Ollama API error:', err);
      aiResponse = faqAnswer(text); // Fallback
    }

    const assistantMessage = {
      id: uuidv4(),
      sessionId,
      role: 'assistant',
      content: aiResponse,
      createdAt: new Date(Date.now() + 5).toISOString(),
    };

    allMessages.push(userMessage, assistantMessage);
    await setAllMessages(allMessages);

    // Update session title & updatedAt
    const nextTitle = sessions[idx].title === 'New chat' ? text.slice(0, 60) : sessions[idx].title;
    sessions[idx] = { ...sessions[idx], title: nextTitle, updatedAt: new Date().toISOString() };
    await setAllSessions(sessions);

    res.status(201).json({ userMessage, assistantMessage, session: sessions[idx] });
  } catch (err) {
    console.error('AI chat send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

aiChatRouter.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const clientId = getClientId(req);
    const sessions = await getAllSessions();
    const session = sessions.find((s) => s.id === sessionId && (s.userId === clientId || s.guestId === clientId));
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const nextSessions = sessions.filter((s) => s.id !== sessionId);
    await setAllSessions(nextSessions);

    const msgs = await getAllMessages();
    const nextMsgs = msgs.filter((m) => m.sessionId !== sessionId);
    await setAllMessages(nextMsgs);

    res.json({ success: true });
  } catch (err) {
    console.error('AI chat delete session error:', err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

aiChatRouter.delete('/sessions', async (req, res) => {
  try {
    const clientId = getClientId(req);
    const sessions = await getAllSessions();
    const mineIds = new Set(
      sessions
        .filter((s) => s.userId === clientId || s.guestId === clientId)
        .map((s) => s.id)
    );

    const nextSessions = sessions.filter((s) => !mineIds.has(s.id));
    await setAllSessions(nextSessions);

    const msgs = await getAllMessages();
    const nextMsgs = msgs.filter((m) => !mineIds.has(m.sessionId));
    await setAllMessages(nextMsgs);

    res.json({ success: true });
  } catch (err) {
    console.error('AI chat clear sessions error:', err);
    res.status(500).json({ error: 'Failed to clear sessions' });
  }
});

