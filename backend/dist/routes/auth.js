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
            return res.json({
                message: 'Login successful',
                token,
                user: { email: user.email, role: user.role }
            });
        }
        res.status(401).json({ message: 'Invalid credentials' });
    }
    catch (error) {
        res.status(500).json({ message: 'Authentication error', error });
    }
});
export default router;
//# sourceMappingURL=auth.js.map