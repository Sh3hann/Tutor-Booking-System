// In-memory fallback database for development
class InMemoryDB {
  constructor() {
    this.collections = {
      users: [],
      tutors: [],
      chat_requests: [],
      chat_threads: [],
      chat_messages: [],
      tutor_profile_requests: [],
      subjects: null,
      tutor_reviews: [],
      subscriptions: [],
    };
  }

  collection(name) {
    return {
      find: async () => ({
        toArray: async () => this.collections[name] || [],
      }),
      findOne: async (query) => {
        const collection = this.collections[name] || [];
        if (query._id) {
          return collection.find(doc => doc._id?.toString() === query._id.toString());
        }
        return collection.find(doc => Object.entries(query).every(([k, v]) => doc[k] === v));
      },
      insertOne: async (doc) => {
        const collection = this.collections[name] || [];
        this.collections[name] = [...collection, doc];
        return { insertedId: doc._id };
      },
      insertMany: async (docs) => {
        this.collections[name] = docs;
        return { insertedIds: docs.map(d => d._id) };
      },
      updateOne: async (query, update, options = {}) => {
        const collection = this.collections[name] || [];
        const index = collection.findIndex(doc => 
          Object.entries(query).every(([k, v]) => doc[k] === v)
        );
        if (index >= 0) {
          // Update existing document
          const updatedDoc = { ...collection[index], ...update.$set };
          const newCollection = [...collection];
          newCollection[index] = updatedDoc;
          this.collections[name] = newCollection;
          return { modifiedCount: 1 };
        } else if (options.upsert) {
          // Insert new document if upsert is true and document not found
          const newDoc = { ...query, ...update.$set };
          const newCollection = [...collection, newDoc];
          this.collections[name] = newCollection;
          return { modifiedCount: 0, upsertedId: query.id || query._id };
        }
        return { modifiedCount: 0 };
      },
      deleteMany: async () => {
        this.collections[name] = [];
        return {};
      },
      createIndex: async () => ({}),
    };
  }

  async admin() {
    return { ping: async () => ({ ok: 1 }) };
  }

  db(name) {
    return this;
  }

  async close() {
    console.log('✓ In-memory database closed');
  }
}

let client = null;
let db = null;
let isInMemory = false;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutors_db';
const DB_NAME = 'tutors_db';

export async function connectDB() {
  try {
    if (client) {
      console.log('Database already connected');
      return db;
    }

    try {
      const { MongoClient, ServerApiVersion } = await import('mongodb');
      
      client = new MongoClient(MONGODB_URI, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        maxPoolSize: 10,
        minPoolSize: 2,
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
      });

      await client.connect();
      db = client.db(DB_NAME);

      // Verify connection
      await db.admin().ping();
      console.log('✓ MongoDB connected successfully');
      isInMemory = false;

      // Create collections if they don't exist
      await createCollections(db);

      return db;
    } catch (mongoError) {
      console.warn('⚠ MongoDB not available, using in-memory database');
      console.warn('  Error:', mongoError.message);
      
      // Fallback to in-memory database
      client = new InMemoryDB();
      db = client;
      isInMemory = true;
      
      console.log('✓ Using in-memory database (development mode)');
      console.log('ℹ Data will NOT persist between restarts');
      
      return db;
    }
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
}

async function createCollections(database) {
  if (isInMemory) return; // In-memory DB doesn't need collection creation
  
  try {
    const collections = [
      'users',
      'tutors',
      'chat_requests',
      'chat_threads',
      'chat_messages',
      'tutor_profile_requests',
      'subjects',
      'quizzes',
      'tutor_reviews',
      'subscriptions',
    ];

    for (const collection of collections) {
      try {
        await database.createCollection(collection);
        console.log(`✓ Created collection: ${collection}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`✓ Collection already exists: ${collection}`);
        } else {
          throw error;
        }
      }
    }

    // Create indexes for common queries
    await createIndexes(database);
  } catch (error) {
    console.error('Error creating collections:', error.message);
  }
}

async function createIndexes(database) {
  if (isInMemory) return; // In-memory DB doesn't need indexes
  
  try {
    // Drop old incorrect userId index if it exists
    try {
      await database.collection('tutors').dropIndex('userId_1');
      console.log('✓ Dropped old userId index');
    } catch (err) {
      // Index may not exist, that's fine
    }
    
    // Users indexes
    await database.collection('users').createIndex({ email: 1 }, { unique: true });
    
    // Tutors indexes - Use 'id' field, not 'userId'
    await database.collection('tutors').createIndex({ id: 1 }, { unique: true });
    
    // Chat requests indexes
    await database.collection('chat_requests').createIndex({ fromId: 1 });
    await database.collection('chat_requests').createIndex({ toId: 1 });
    
    // Chat threads indexes
    await database.collection('chat_threads').createIndex({ participantIds: 1 });
    
    // Chat messages indexes
    await database.collection('chat_messages').createIndex({ threadId: 1 });
    await database.collection('chat_messages').createIndex({ senderId: 1 });
    
    // Subscriptions indexes
    await database.collection('subscriptions').createIndex({ tutorId: 1 }, { unique: true });
    
    // Tutor reviews indexes
    await database.collection('tutor_reviews').createIndex({ tutorId: 1 });
    
    console.log('✓ Database indexes created successfully');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✓ Indexes already exist');
    }
  }
}

export async function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}

export async function disconnectDB() {
  if (client) {
    if (client.close) {
      await client.close();
    }
    client = null;
    db = null;
    console.log('Database disconnected');
  }
}
