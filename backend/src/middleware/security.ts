import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const isProduction = process.env.NODE_ENV === 'production';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again shortly.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

export const publicFormLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions. Please wait and try again.' },
});

export const adminWriteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many admin write actions. Please slow down.' },
});

export const chatbotAskLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: isProduction ? 100 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many chatbot requests. Please wait and try again.' },
});

export const chatbotPollLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: isProduction ? 1000 : 20000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many chatbot sync requests. Please retry shortly.' },
});

export const chatbotHandoffWriteLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: isProduction ? 200 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const conversationId = String(req.params?.conversationId || '').trim();
    const visitorToken = String(req.body?.visitorToken || '').trim();
    return visitorToken && conversationId ? `${conversationId}:${visitorToken}` : String(req.ip || 'unknown');
  },
  message: { message: 'Too many support chat messages. Please wait and try again.' },
});

export const communicationReadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many communication read requests. Please retry shortly.' },
});

export const communicationWriteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 160,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many communication write actions. Please slow down.' },
});

export const communicationSignalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many call signal events. Please retry.' },
});

export const createCsrfToken = () => crypto.randomBytes(24).toString('hex');

export const publicSubmissionGuard = (req: any, res: any, next: any) => {
  const body = req.body ?? {};
  const honeypotFields = ['website', 'homepage', 'url', 'company', 'fax'];
  const hasTrapValue = honeypotFields.some((field) => {
    const value = body?.[field];
    return typeof value === 'string' && value.trim().length > 0;
  });

  if (hasTrapValue) {
    return res.status(400).json({ message: 'Invalid submission payload' });
  }

  next();
};

export const requireCsrfToken = (req: any, res: any, next: any) => {
  const csrfCookie = req.cookies?.csrfToken;
  const csrfHeader = req.get('x-csrf-token');

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'CSRF token mismatch' });
  }

  next();
};
