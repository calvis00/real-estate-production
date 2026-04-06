import jwt, { type JwtPayload } from 'jsonwebtoken';

export interface AdminJwtPayload extends JwtPayload {
  email: string;
  role: string;
  sid?: string;
}

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  return secret;
};

export const verifyAdminToken = (token: string) => {
  const decoded = jwt.verify(token, getJwtSecret()) as AdminJwtPayload;

  if (!['ADMIN', 'SALES', 'VIEWER'].includes(String(decoded.role || '').toUpperCase())) {
    throw new Error('Forbidden');
  }

  return decoded;
};

export const getOptionalAdminUser = (token?: string) => {
  if (!token) {
    return null;
  }

  try {
    return verifyAdminToken(token);
  } catch {
    return null;
  }
};
