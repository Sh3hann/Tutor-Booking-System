import { getDB } from '../config/mongodb.js';

// Helper function to handle MongoDB documents with UUID-based id fields
function convertMongoDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { ...rest };
}

function convertMongoDocs(docs) {
  return docs.map(convertMongoDoc);
}

export const store = {
  users: {
    get: async () => {
      const db = await getDB();
      const docs = await db.collection('users').find({}).toArray();
      return convertMongoDocs(docs);
    },
    set: async (data) => {
      const db = await getDB();
      const collection = db.collection('users');
      if (!Array.isArray(data)) {
        throw new Error('users.set() requires an array');
      }
      // Delete all and insert new data atomically
      await collection.deleteMany({});
      if (data.length > 0) {
        await collection.insertMany(data);
      }
    },
    getById: async (id) => {
      const db = await getDB();
      const doc = await db.collection('users').findOne({ id });
      return convertMongoDoc(doc);
    },
    getByEmail: async (email) => {
      const db = await getDB();
      const doc = await db.collection('users').findOne({ email: email.toLowerCase() });
      return convertMongoDoc(doc);
    },
    updateOne: async (id, updates) => {
      const db = await getDB();
      const result = await db.collection('users').updateOne(
        { id },
        { $set: updates }
      );
      return result.modifiedCount > 0;
    },
    insertOne: async (user) => {
      const db = await getDB();
      await db.collection('users').insertOne(user);
      return { ...user };
    },
  },

  tutors: {
    get: async () => {
      const db = await getDB();
      const docs = await db.collection('tutors').find({}).toArray();
      return convertMongoDocs(docs);
    },
    set: async (data) => {
      const db = await getDB();
      const collection = db.collection('tutors');
      if (!Array.isArray(data)) {
        throw new Error('tutors.set() requires an array');
      }
      await collection.deleteMany({});
      if (data.length > 0) {
        await collection.insertMany(data);
      }
    },
    getById: async (id) => {
      const db = await getDB();
      const doc = await db.collection('tutors').findOne({ id });
      return convertMongoDoc(doc);
    },
    findByUserId: async (userId) => {
      const db = await getDB();
      const doc = await db.collection('tutors').findOne({ userId });
      return convertMongoDoc(doc);
    },
    updateOne: async (id, updates) => {
      const db = await getDB();
      const result = await db.collection('tutors').updateOne(
        { id },
        { $set: updates }
      );
      return result.modifiedCount > 0;
    },
    insertOne: async (tutor) => {
      const db = await getDB();
      await db.collection('tutors').insertOne(tutor);
      return { ...tutor };
    },
  },

  chatRequests: {
    get: async () => {
      const db = await getDB();
      const docs = await db.collection('chat_requests').find({}).toArray();
      return convertMongoDocs(docs);
    },
    set: async (data) => {
      const db = await getDB();
      const collection = db.collection('chat_requests');
      await collection.deleteMany({});
      if (data.length > 0) {
        await collection.insertMany(data);
      }
    },
    insertOne: async (request) => {
      const db = await getDB();
      await db.collection('chat_requests').insertOne(request);
      return { ...request };
    },
    updateOne: async (id, updates) => {
      const db = await getDB();
      const result = await db.collection('chat_requests').updateOne(
        { id },
        { $set: updates }
      );
      return result.modifiedCount > 0;
    },
  },

  chatThreads: {
    get: async () => {
      const db = await getDB();
      const docs = await db.collection('chat_threads').find({}).toArray();
      return convertMongoDocs(docs);
    },
    set: async (data) => {
      const db = await getDB();
      const collection = db.collection('chat_threads');
      await collection.deleteMany({});
      if (data.length > 0) {
        await collection.insertMany(data);
      }
    },
    insertOne: async (thread) => {
      const db = await getDB();
      await db.collection('chat_threads').insertOne(thread);
      return { ...thread };
    },
    getById: async (id) => {
      const db = await getDB();
      const doc = await db.collection('chat_threads').findOne({ id });
      return convertMongoDoc(doc);
    },
  },

  chatMessages: {
    get: async () => {
      const db = await getDB();
      const docs = await db.collection('chat_messages').find({}).toArray();
      return convertMongoDocs(docs);
    },
    set: async (data) => {
      const db = await getDB();
      const collection = db.collection('chat_messages');
      await collection.deleteMany({});
      if (data.length > 0) {
        await collection.insertMany(data);
      }
    },
    insertOne: async (message) => {
      const db = await getDB();
      await db.collection('chat_messages').insertOne(message);
      return { ...message };
    },
  },

  tutorProfileRequests: {
    get: async () => {
      const db = await getDB();
      const docs = await db.collection('tutor_profile_requests').find({}).toArray();
      return convertMongoDocs(docs);
    },
    set: async (data) => {
      const db = await getDB();
      const collection = db.collection('tutor_profile_requests');
      if (!Array.isArray(data)) {
        throw new Error('tutorProfileRequests.set() requires an array');
      }
      await collection.deleteMany({});
      if (data.length > 0) {
        await collection.insertMany(data);
      }
    },
    insertOne: async (request) => {
      const db = await getDB();
      await db.collection('tutor_profile_requests').insertOne(request);
      return { ...request };
    },
    updateOne: async (id, updates) => {
      const db = await getDB();
      const result = await db.collection('tutor_profile_requests').updateOne(
        { id },
        { $set: updates }
      );
      return result.modifiedCount > 0;
    },
  },

  subjects: {
    get: async () => {
      const db = await getDB();
      const doc = await db.collection('subjects').findOne({ key: 'default' });
      return doc ? doc.data : null;
    },
    set: async (data) => {
      const db = await getDB();
      await db.collection('subjects').updateOne(
        { key: 'default' },
        { $set: { key: 'default', data } },
        { upsert: true }
      );
    },
  },

  quizzes: {
    get: async () => {
      const db = await getDB();
      const doc = await db.collection('quizzes').findOne({ key: 'master' });
      return doc ? doc.data : [];
    },
    set: async (data) => {
      const db = await getDB();
      await db.collection('quizzes').updateOne(
        { key: 'master' },
        { $set: { key: 'master', data } },
        { upsert: true }
      );
    },
  },

  tutorReviews: {
    get: async () => {
      const db = await getDB();
      const docs = await db.collection('tutor_reviews').find({}).toArray();
      return convertMongoDocs(docs);
    },
    set: async (data) => {
      const db = await getDB();
      const collection = db.collection('tutor_reviews');
      if (!Array.isArray(data)) {
        throw new Error('tutorReviews.set() requires an array');
      }
      await collection.deleteMany({});
      if (data.length > 0) {
        await collection.insertMany(data);
      }
    },
    insertOne: async (review) => {
      const db = await getDB();
      await db.collection('tutor_reviews').insertOne(review);
      return { ...review };
    },
  },

  subscriptions: {
    get: async () => {
      const db = await getDB();
      const docs = await db.collection('subscriptions').find({}).toArray();
      return convertMongoDocs(docs);
    },
    set: async (data) => {
      const db = await getDB();
      const collection = db.collection('subscriptions');
      await collection.deleteMany({});
      if (data.length > 0) {
        const docsToInsert = data.map(doc => {
          const { id, ...rest } = doc;
          return { _id: id ? new ObjectId(id) : new ObjectId(), ...rest };
        });
        await collection.insertMany(docsToInsert);
      }
    },
    getByTutorId: async (tutorId) => {
      const db = await getDB();
      const doc = await db.collection('subscriptions').findOne({ tutorId });
      return convertMongoDoc(doc);
    },
    updateOne: async (id, updates) => {
      const db = await getDB();
      const result = await db.collection('subscriptions').updateOne(
        { _id: new ObjectId(id) },
        { $set: updates }
      );
      return result.modifiedCount > 0;
    },
    insertOne: async (subscription) => {
      const db = await getDB();
      const { id, ...rest } = subscription;
      const result = await db.collection('subscriptions').insertOne({
        _id: id ? new ObjectId(id) : new ObjectId(),
        ...rest
      });
      return convertMongoDoc({ ...subscription, _id: result.insertedId });
    },
    upsertByTutorId: async (tutorId, updates) => {
      const db = await getDB();
      const result = await db.collection('subscriptions').updateOne(
        { tutorId },
        { $set: { tutorId, ...updates } },
        { upsert: true }
      );
      return result;
    },
  },

  bookings: {
    get: async () => {
      const db = await getDB();
      const docs = await db.collection('bookings').find({}).toArray();
      return convertMongoDocs(docs);
    },
    set: async (data) => {
      const db = await getDB();
      const collection = db.collection('bookings');
      await collection.deleteMany({});
      if (data.length > 0) {
        await collection.insertMany(data);
      }
    },
    getById: async (id) => {
      const db = await getDB();
      const doc = await db.collection('bookings').findOne({ id });
      return convertMongoDoc(doc);
    },
    insertOne: async (booking) => {
      const db = await getDB();
      await db.collection('bookings').insertOne(booking);
      return { ...booking };
    },
    updateOne: async (id, updates) => {
      const db = await getDB();
      const result = await db.collection('bookings').updateOne(
        { id },
        { $set: updates }
      );
      return result.modifiedCount > 0;
    },
  },

  // ── Institutes ──────────────────────────────────────────────────────────────
  institutes: {
    get: async () => {
      const db = await getDB();
      const docs = await db.collection('institutes').find({}).toArray();
      return convertMongoDocs(docs);
    },
    getById: async (id) => {
      const db = await getDB();
      const doc = await db.collection('institutes').findOne({ id });
      return convertMongoDoc(doc);
    },
    insertOne: async (institute) => {
      const db = await getDB();
      await db.collection('institutes').insertOne(institute);
      return { ...institute };
    },
    updateOne: async (id, updates) => {
      const db = await getDB();
      const result = await db.collection('institutes').updateOne(
        { id },
        { $set: updates }
      );
      return result.modifiedCount > 0;
    },
    deleteOne: async (id) => {
      const db = await getDB();
      const result = await db.collection('institutes').deleteOne({ id });
      return result.deletedCount > 0;
    },
  },

  // ── Institute Requests (tutors requesting a new institute) ──────────────────
  instituteRequests: {
    get: async () => {
      const db = await getDB();
      const docs = await db.collection('institute_requests').find({}).toArray();
      return convertMongoDocs(docs);
    },
    getById: async (id) => {
      const db = await getDB();
      const doc = await db.collection('institute_requests').findOne({ id });
      return convertMongoDoc(doc);
    },
    insertOne: async (req) => {
      const db = await getDB();
      await db.collection('institute_requests').insertOne(req);
      return { ...req };
    },
    updateOne: async (id, updates) => {
      const db = await getDB();
      const result = await db.collection('institute_requests').updateOne(
        { id },
        { $set: updates }
      );
      return result.modifiedCount > 0;
    },
    deleteOne: async (id) => {
      const db = await getDB();
      await db.collection('institute_requests').deleteOne({ id });
    },
  },

  // ── Institute Join Requests (tutors requesting to join existing institute) ──
  instituteJoinRequests: {
    get: async () => {
      const db = await getDB();
      const docs = await db.collection('institute_join_requests').find({}).toArray();
      return convertMongoDocs(docs);
    },
    getById: async (id) => {
      const db = await getDB();
      const doc = await db.collection('institute_join_requests').findOne({ id });
      return convertMongoDoc(doc);
    },
    insertOne: async (req) => {
      const db = await getDB();
      await db.collection('institute_join_requests').insertOne(req);
      return { ...req };
    },
    updateOne: async (id, updates) => {
      const db = await getDB();
      const result = await db.collection('institute_join_requests').updateOne(
        { id },
        { $set: updates }
      );
      return result.modifiedCount > 0;
    },
    deleteOne: async (id) => {
      const db = await getDB();
      await db.collection('institute_join_requests').deleteOne({ id });
    },
  },
};

