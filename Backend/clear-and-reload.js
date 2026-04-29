import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, getDB } from './config/mongodb.js';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function clearAndReload() {
  try {
    await connectDB();
    const db = await getDB();
    
    console.log('Clearing all collections...');
    const collections = ['users', 'tutors', 'chat_requests', 'chat_threads', 'chat_messages', 'tutor_profile_requests', 'subjects', 'tutor_reviews', 'subscriptions'];
    
    for (const col of collections) {
      await db.collection(col).deleteMany({});
      console.log(`✓ Cleared ${col}`);
    }
    
    // Load users from JSON
    console.log('\nLoading data from JSON files...');
    const dataPath = path.join(__dirname, 'data', 'json');
    
    // Load users
    const usersFile = path.join(dataPath, 'users.json');
    const usersData = JSON.parse(await fs.readFile(usersFile, 'utf-8'));
    
    // Reset passwords to known values
    const passwordMap = {
      'student@gmail.com': 'password123',
      'tutor@gmail.com': 'password123',
      'tutor1@gmail.com': 'password123',
      'admin@gmail.com': 'admin@gmail.com',
      'methvanjayaweera@gmail.com': 'password123',
      'achintha@gmail.com': 'password123',
    };
    
    for (const user of usersData) {
      const password = passwordMap[user.email] || 'password123';
      user.passwordHash = await bcrypt.hash(password, 10);
    }
    
    await db.collection('users').insertMany(usersData);
    console.log(`✓ Loaded ${usersData.length} users with reset passwords`);
    
    // Load tutors
    try {
      const tutorsFile = path.join(dataPath, 'tutors.json');
      const tutorsData = JSON.parse(await fs.readFile(tutorsFile, 'utf-8'));
      await db.collection('tutors').insertMany(tutorsData);
      console.log(`✓ Loaded ${tutorsData.length} tutors`);
    } catch (err) {
      console.warn('✗ No tutors.json found or error loading:', err.message);
    }
    
    // Load chat requests
    try {
      const chatRequestsFile = path.join(dataPath, 'chat_requests.json');
      const chatRequestsData = JSON.parse(await fs.readFile(chatRequestsFile, 'utf-8'));
      if (chatRequestsData.length > 0) {
        await db.collection('chat_requests').insertMany(chatRequestsData);
        console.log(`✓ Loaded ${chatRequestsData.length} chat requests`);
      }
    } catch (err) {
      console.warn(`✗ Could not load chat requests:`, err.message);
    }
    
    // Load chat threads
    try {
      const chatThreadsFile = path.join(dataPath, 'chat_threads.json');
      const chatThreadsData = JSON.parse(await fs.readFile(chatThreadsFile, 'utf-8'));
      if (chatThreadsData.length > 0) {
        await db.collection('chat_threads').insertMany(chatThreadsData);
        console.log(`✓ Loaded ${chatThreadsData.length} chat threads`);
      }
    } catch (err) {
      console.warn(`✗ Could not load chat threads:`, err.message);
    }
    
    // DO NOT load subscriptions from JSON - they should be empty
    // Only when a tutor accepts the free trial will a subscription be created
    console.log(`✓ Subscriptions collection left empty (tutors must accept trial)`);
    
    console.log('\n✓ Database cleared and reloaded successfully');
    console.log('\nTest credentials:');
    console.log('  Student: student@gmail.com / password123');
    console.log('  Tutor: tutor@gmail.com / password123');
    console.log('  Admin: admin@gmail.com / admin@gmail.com');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

clearAndReload();
