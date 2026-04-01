import { Router } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getJwtSecret } from '../utils/auth.js';
import { sanitizeEmail, sanitizeLooseText } from '../utils/sanitize.js';
import { createCsrfToken, requireCsrfToken } from '../middleware/security.js';
const router = Router();
const useSecureCookies = process.env.COOKIE_SECURE === 'true';
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
        if (user && user.role === 'ADMIN') {
            if (user.password.startsWith('$2')) {
                passwordValid = await bcrypt.compare(password, user.password);
            }
            else {
                passwordValid = user.password === password;
                shouldUpgradeLegacyPassword = passwordValid;
            }
        }
        if (user && user.role === 'ADMIN' && passwordValid) {
            if (shouldUpgradeLegacyPassword) {
                const hashedPassword = await bcrypt.hash(password, 12);
                await db.update(users)
                    .set({ password: hashedPassword, updatedAt: new Date() })
                    .where(eq(users.id, user.id));
            }
            const token = jwt.sign({ email, role: user.role }, getJwtSecret(), { expiresIn: '1d' });
            const csrfToken = createCsrfToken();
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
                user: { email: user.email, role: user.role },
                csrfToken
            });
        }
        res.status(401).json({ message: 'Invalid admin credentials' });
    }
    catch (error) {
        res.status(500).json({ message: 'Authentication error', error });
    }
});
router.post('/logout', requireCsrfToken, (req, res) => {
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
export default router;
//# sourceMappingURL=auth.js.map