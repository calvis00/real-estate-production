import crypto from 'crypto';
import { pool } from '../db/index.js';

export type LoginAttemptRecord = {
  email: string;
  success: boolean;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  reason?: string | undefined;
};

export type SessionRecord = {
  sessionId: string;
  email: string;
  role: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
};

export async function ensureSecurityTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS security_login_attempts (
      id BIGSERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      success BOOLEAN NOT NULL,
      reason TEXT,
      ip_address VARCHAR(128),
      user_agent TEXT,
      attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS security_sessions (
      session_id VARCHAR(128) PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL,
      ip_address VARCHAR(128),
      user_agent TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at TIMESTAMPTZ
    );
  `);
}

export function createSessionId() {
  return crypto.randomBytes(20).toString('hex');
}

export async function logLoginAttempt(record: LoginAttemptRecord) {
  await pool.query(
    `INSERT INTO security_login_attempts (email, success, reason, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [record.email, record.success, record.reason || null, record.ipAddress || null, record.userAgent || null],
  );
}

export async function openSession(record: SessionRecord) {
  await pool.query(
    `INSERT INTO security_sessions (session_id, email, role, ip_address, user_agent, is_active)
     VALUES ($1, $2, $3, $4, $5, TRUE)
     ON CONFLICT (session_id) DO UPDATE
     SET email = EXCLUDED.email,
         role = EXCLUDED.role,
         ip_address = EXCLUDED.ip_address,
         user_agent = EXCLUDED.user_agent,
         is_active = TRUE,
         last_seen_at = NOW(),
         ended_at = NULL`,
    [record.sessionId, record.email, record.role, record.ipAddress || null, record.userAgent || null],
  );
}

export async function touchSession(sessionId: string) {
  await pool.query(
    `UPDATE security_sessions
     SET last_seen_at = NOW()
     WHERE session_id = $1 AND is_active = TRUE`,
    [sessionId],
  );
}

export async function closeSession(sessionId: string) {
  await pool.query(
    `UPDATE security_sessions
     SET is_active = FALSE, ended_at = NOW(), last_seen_at = NOW()
     WHERE session_id = $1`,
    [sessionId],
  );
}

export async function isSessionActive(sessionId: string) {
  const result = await pool.query(
    `SELECT is_active
     FROM security_sessions
     WHERE session_id = $1
     LIMIT 1`,
    [sessionId],
  );

  if (!result.rowCount) return false;
  return Boolean(result.rows[0]?.is_active);
}

export async function listRecentSessions(limit = 100) {
  const result = await pool.query(
    `SELECT session_id, email, role, ip_address, user_agent, is_active, created_at, last_seen_at, ended_at
     FROM security_sessions
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}

export async function revokeSession(sessionId: string) {
  await closeSession(sessionId);
}

export async function listRecentLoginAttempts(limit = 100) {
  const result = await pool.query(
    `SELECT id, email, success, reason, ip_address, user_agent, attempted_at
     FROM security_login_attempts
     ORDER BY attempted_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}
