import { getOptionalAdminUser, verifyAdminToken } from '../utils/auth.js';
import { isSessionActive, touchSession } from '../services/securityStore.js';

const ROLE_WEIGHT: Record<string, number> = {
  VIEWER: 1,
  SALES: 2,
  ADMIN: 3,
};

export const authMiddleware = async (req: any, res: any, next: any) => {
  const token = req.cookies.adminToken;
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = verifyAdminToken(token);
    if (!decoded?.sid) {
      return res.status(401).json({ message: 'Session missing. Please login again.' });
    }

    const active = await isSessionActive(decoded.sid);
    if (!active) {
      return res.status(401).json({ message: 'Session has been revoked. Please login again.' });
    }

    await touchSession(decoded.sid);
    req.user = decoded;
    next();
  } catch (err) {
    const message = err instanceof Error && err.message === 'Forbidden'
      ? 'Admin access required'
      : 'Invalid or expired token';

    res.status(401).json({ message });
  }
};

export const attachOptionalAdmin = (req: any, _res: any, next: any) => {
  req.user = getOptionalAdminUser(req.cookies?.adminToken);
  next();
};

export const requireRoles = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    const role = String(req.user?.role || '').toUpperCase();
    if (!roles.includes(role)) {
      return res.status(403).json({ message: 'Insufficient role permissions' });
    }
    next();
  };
};

export const canEditField = (role: string, field: string) => {
  const normalizedRole = String(role || '').toUpperCase();
  if (normalizedRole === 'ADMIN') return true;
  if (normalizedRole === 'SALES') {
    return [
      'customerName',
      'phone',
      'email',
      'requirementText',
      'propertyType',
      'preferredLocation',
      'budgetMin',
      'budgetMax',
      'status',
      'priority',
      'source',
      'nextFollowUpDate',
      'lastContactedAt',
      'notes',
      'tags',
    ].includes(field);
  }
  return false;
};

export const hasRoleAtLeast = (role: string, required: string) => {
  return (ROLE_WEIGHT[String(role || '').toUpperCase()] || 0) >= (ROLE_WEIGHT[String(required || '').toUpperCase()] || 0);
};
