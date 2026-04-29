import bcrypt from 'bcryptjs';
import { connectDB, getDB } from './config/mongodb.js';

const passwords = {
  'student@gmail.com': 'password123',
  'tutor@gmail.com': 'password123',
  'tutor1@gmail.com': 'password123',
  'admin@gmail.com': 'admin@gmail.com',
  'methvanjayaweera@gmail.com': 'password123',
  'achintha@gmail.com': 'password123',
};

async function resetPasswords() {
  try {
    await connectDB();
    const db = await getDB();
    const collection = db.collection('users');

    for (const [email, password] of Object.entries(passwords)) {
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await collection.updateOne(
        { email: email.toLowerCase() },
        { $set: { passwordHash } }
      );
      console.log(`Updated password for ${email}: ${result.modifiedCount > 0 ? 'OK' : 'NOT FOUND'}`);
    }
    console.log('✓ All passwords reset');
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

resetPasswords();
