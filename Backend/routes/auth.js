import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../data/store-mongo.js';
import { organizeUsersByRole } from '../data/organize-by-role.js';
import { signToken } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await store.users.getByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(
      { id: user.id, email: user.email, role: user.role },
      '7d'
    );

    const { passwordHash: _pw, ...safeUser } = user;
    res.json({
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, role, contactNumber, grade, age, parentName, parentContact } = req.body;
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Email, password, fullName, and role required' });
    }
    if (role.toLowerCase() !== 'student') {
      return res.status(400).json({ error: 'Use the tutor signup flow for tutor registration (requires admin approval)' });
    }

    const existing = await store.users.getByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const newUser = {
      id,
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      role,
      contactNumber: contactNumber || '',
      grade: grade || '',
      age: age ? parseInt(age) : null,
      parentName: parentName || '',
      parentContact: parentContact || '',
      createdAt: new Date().toISOString(),
    };
    const savedUser = await store.users.insertOne(newUser);

    // Organize users by role after new registration
    const allUsers = await store.users.get();
    await organizeUsersByRole(allUsers).catch((err) =>
      console.error('Failed to organize users:', err.message)
    );

    const token = signToken({ id, email: newUser.email, role }, '7d');
    const { passwordHash: _pw2, ...safeNewUser } = newUser;
    res.status(201).json({
      token,
      user: safeNewUser,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});
