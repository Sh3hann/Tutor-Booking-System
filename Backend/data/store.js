import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson(file) {
  ensureDir();
  const filePath = path.join(DATA_DIR, `${file}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(file, data) {
  ensureDir();
  const filePath = path.join(DATA_DIR, `${file}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export const store = {
  users: {
    get: () => readJson('users') || [],
    set: (data) => writeJson('users', data),
  },
  tutors: {
    get: () => readJson('tutors') || [],
    set: (data) => writeJson('tutors', data),
  },
  chatRequests: {
    get: () => readJson('chat_requests') || [],
    set: (data) => writeJson('chat_requests', data),
  },
  chatThreads: {
    get: () => readJson('chat_threads') || [],
    set: (data) => writeJson('chat_threads', data),
  },
  chatMessages: {
    get: () => readJson('chat_messages') || [],
    set: (data) => writeJson('chat_messages', data),
  },
  tutorProfileRequests: {
    get: () => readJson('tutor_profile_requests') || [],
    set: (data) => writeJson('tutor_profile_requests', data),
  },
  subjects: {
    get: () => readJson('subjects') || null,
    set: (data) => writeJson('subjects', data),
  },
  tutorReviews: {
    get: () => readJson('tutor_reviews') || [],
    set: (data) => writeJson('tutor_reviews', data),
  },
  subscriptions: {
    get: () => readJson('subscriptions') || [],
    set: (data) => writeJson('subscriptions', data),
  },
};
