import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (user && user.password === password) { // In production, use bcrypt.compare
            const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
            res.cookie('adminToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            });
            return res.json({
                message: 'Login successful',
                user: { email: user.email, role: user.role }
            });
        }
        res.status(401).json({ message: 'Invalid credentials' });
    }
    catch (error) {
        res.status(500).json({ message: 'Authentication error', error });
    }
});
router.post('/logout', (req, res) => {
    res.clearCookie('adminToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0) // Set to an expired date
    });
    res.json({ message: 'Logged out successfully' });
});
export default router;
//# sourceMappingURL=auth.js.map