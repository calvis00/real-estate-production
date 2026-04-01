import { getOptionalAdminUser, verifyAdminToken } from '../utils/auth.js';
export const authMiddleware = (req, res, next) => {
    const token = req.cookies.adminToken;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = verifyAdminToken(token);
        req.user = decoded;
        next();
    }
    catch (err) {
        const message = err instanceof Error && err.message === 'Forbidden'
            ? 'Admin access required'
            : 'Invalid or expired token';
        res.status(401).json({ message });
    }
};
export const attachOptionalAdmin = (req, _res, next) => {
    req.user = getOptionalAdminUser(req.cookies?.adminToken);
    next();
};
//# sourceMappingURL=auth.js.map