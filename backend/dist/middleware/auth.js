import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
export const authMiddleware = (req, res, next) => {
    const token = req.cookies.adminToken;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
//# sourceMappingURL=auth.js.map