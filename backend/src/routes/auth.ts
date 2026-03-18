import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Mock Admin Credentials
const ADMIN_EMAIL = 'admin@realestatetn.com';
const ADMIN_PASSWORD = 'password123';

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ 
      message: 'Login successful', 
      token,
      user: { email, role: 'ADMIN' }
    });
  }

  res.status(401).json({ message: 'Invalid credentials' });
});

export default router;
