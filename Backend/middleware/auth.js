import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tutor-chat-secret-change-in-production';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token' });
  }
  const token = authHeader.split(' ')[1];
  
  // Handle local tokens (from frontend fallback storage)
  if (token.startsWith('local-')) {
    try {
      const decoded = JSON.parse(atob(token.substring(6)));
      req.user = decoded;
      next();
      return;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid local token' });
    }
  }
  
  // Handle JWT tokens (from backend)
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.split(' ')[1];
  
  // Handle local tokens (from frontend fallback storage)
  if (token.startsWith('local-')) {
    try {
      const decoded = JSON.parse(atob(token.substring(6)));
      req.user = decoded;
      next();
      return;
    } catch (err) {
      req.user = null;
      next();
      return;
    }
  }
  
  // Handle JWT tokens (from backend)
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
}
