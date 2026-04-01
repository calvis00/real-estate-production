import { Router } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/auth.js';

const router = Router();
const useSecureCookies = process.env.COOKIE_SECURE === 'true';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (user && user.role === 'ADMIN' && user.password === password) { // Replace with bcrypt.compare after migrating stored passwords.
      const token = jwt.sign({ email, role: user.role }, getJwtSecret(), { expiresIn: '1d' });
      
      res.cookie('adminToken', token, {
          httpOnly: true,
          secure: useSecureCookies,
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      return res.json({ 
        message: 'Login successful', 
        user: { email: user.email, role: user.role }
      });
    }

    res.status(401).json({ message: 'Invalid admin credentials' });
  } catch (error) {
    res.status(500).json({ message: 'Authentication error', error });
  }
});

router.post('/logout', (req, res) => {
    res.clearCookie('adminToken', {
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: 'lax',
        expires: new Date(0) // Set to an expired date
    });
    res.json({ message: 'Logged out successfully' });
});

export default router;
