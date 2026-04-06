import { Router } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getJwtSecret } from '../utils/auth.js';
import { sanitizeEmail, sanitizeLooseText } from '../utils/sanitize.js';
import { createCsrfToken, requireCsrfToken } from '../middleware/security.js';
import {
  createSessionId,
  closeSession,
  listRecentLoginAttempts,
  listRecentSessions,
  logLoginAttempt,
  openSession,
  revokeSession,
} from '../services/securityStore.js';
import { authMiddleware, requireRoles } from '../middleware/auth.js';

const router = Router();
const useSecureCookies = process.env.COOKIE_SECURE === 'true';
const ALLOWED_USER_ROLES = ['ADMIN', 'SALES', 'VIEWER'] as const;

router.post('/login', async (req, res) => {
  const email = sanitizeEmail(req.body?.email);
  const password = sanitizeLooseText(req.body?.password);

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid login payload' });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    let passwordValid = false;
    let shouldUpgradeLegacyPassword = false;

    if (user && ALLOWED_USER_ROLES.includes(String(user.role).toUpperCase() as any)) {
      if (user.password.startsWith('$2')) {
        passwordValid = await bcrypt.compare(password, user.password);
      } else {
        passwordValid = user.password === password;
        shouldUpgradeLegacyPassword = passwordValid;
      }
    }

    if (user && passwordValid && ALLOWED_USER_ROLES.includes(String(user.role).toUpperCase() as any)) {
      if (shouldUpgradeLegacyPassword) {
        const hashedPassword = await bcrypt.hash(password, 12);
        await db.update(users)
          .set({ password: hashedPassword, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }

      const sessionId = createSessionId();
      const token = jwt.sign({ email, role: user.role, sid: sessionId }, getJwtSecret(), { expiresIn: '1d' });
      const csrfToken = createCsrfToken();
      await openSession({
        sessionId,
        email: user.email,
        role: user.role,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
      });
      await logLoginAttempt({
        email,
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
      });
      
      res.cookie('adminToken', token, {
          httpOnly: true,
          secure: useSecureCookies,
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      res.cookie('csrfToken', csrfToken, {
          httpOnly: false,
          secure: useSecureCookies,
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000
      });

      return res.json({ 
        message: 'Login successful', 
        user: { email: user.email, role: user.role, sessionId },
        csrfToken
      });
    }

    await logLoginAttempt({
      email,
      success: false,
      reason: 'Invalid credentials',
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || '',
    });
    res.status(401).json({ message: 'Invalid admin credentials' });
  } catch (error) {
    res.status(500).json({ message: 'Authentication error', error });
  }
});

router.post('/logout', requireCsrfToken, (req, res) => {
    const token = req.cookies?.adminToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, getJwtSecret()) as any;
        if (decoded?.sid) {
          closeSession(decoded.sid).catch(() => undefined);
        }
      } catch {
        // Ignore decode failures during logout.
      }
    }
    res.clearCookie('adminToken', {
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: 'lax',
        expires: new Date(0) // Set to an expired date
    });
    res.clearCookie('csrfToken', {
        httpOnly: false,
        secure: useSecureCookies,
        sameSite: 'lax',
        expires: new Date(0)
    });
    res.json({ message: 'Logged out successfully' });
});

router.get('/me', authMiddleware, (req: any, res) => {
  res.json({
    user: {
      email: req.user?.email,
      role: req.user?.role,
      sid: req.user?.sid,
    },
  });
});

router.get('/security/sessions', authMiddleware, requireRoles(['ADMIN']), async (_req, res) => {
  const sessions = await listRecentSessions(200);
  res.json({ data: sessions });
});

router.post('/security/sessions/:sid/revoke', authMiddleware, requireRoles(['ADMIN']), requireCsrfToken, async (req, res) => {
  const sid = sanitizeLooseText(req.params?.sid);
  if (!sid) return res.status(400).json({ message: 'Invalid session id' });
  await revokeSession(sid);
  res.json({ message: 'Session revoked', sid });
});

router.get('/security/login-attempts', authMiddleware, requireRoles(['ADMIN']), async (_req, res) => {
  const attempts = await listRecentLoginAttempts(300);
  res.json({ data: attempts });
});

router.get('/users', authMiddleware, requireRoles(['ADMIN']), async (_req, res) => {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users);

  res.json({ data: rows });
});

router.post('/users', authMiddleware, requireRoles(['ADMIN']), requireCsrfToken, async (req, res) => {
  const email = sanitizeEmail(req.body?.email);
  const password = sanitizeLooseText(req.body?.password);
  const role = String(sanitizeLooseText(req.body?.role) || '').toUpperCase();

  if (!email || !password || !ALLOWED_USER_ROLES.includes(role as any)) {
    return res.status(400).json({ message: 'Invalid user payload' });
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  res.status(201).json({ message: 'User created', data: newUser });
});

router.put('/users/:id', authMiddleware, requireRoles(['ADMIN']), requireCsrfToken, async (req, res) => {
  const id = sanitizeLooseText(req.params?.id);
  if (!id) return res.status(400).json({ message: 'Invalid user id' });

  const email = req.body?.email !== undefined ? sanitizeEmail(req.body?.email) : undefined;
  const password = req.body?.password !== undefined ? sanitizeLooseText(req.body?.password) : undefined;
  const role = req.body?.role !== undefined ? String(sanitizeLooseText(req.body?.role) || '').toUpperCase() : undefined;

  if (role !== undefined && !ALLOWED_USER_ROLES.includes(role as any)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const updatePayload: any = { updatedAt: new Date() };
  if (email !== undefined) updatePayload.email = email;
  if (role !== undefined) updatePayload.role = role;
  if (password) updatePayload.password = await bcrypt.hash(password, 12);

  const [updated] = await db
    .update(users)
    .set(updatePayload)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  if (!updated) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ message: 'User updated', data: updated });
});

router.delete('/users/:id', authMiddleware, requireRoles(['ADMIN']), requireCsrfToken, async (req: any, res) => {
  const id = sanitizeLooseText(req.params?.id);
  if (!id) return res.status(400).json({ message: 'Invalid user id' });

  const target = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target.length) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (String(target[0]?.email || '').toLowerCase() === String(req.user?.email || '').toLowerCase()) {
    return res.status(400).json({ message: 'You cannot delete your current logged in user' });
  }

  await db.delete(users).where(eq(users.id, id));
  res.json({ message: 'User deleted' });
});

export default router;
