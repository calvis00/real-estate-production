import crypto from 'crypto';
import { pool } from '../db/index.js';

export type ConversationCreateInput = {
  propertyId: string;
  createdByEmail: string;
  createdByRole: string;
  clientName?: string | undefined;
  clientEmail?: string | undefined;
  clientPhone?: string | undefined;
  subject?: string | undefined;
};

export type MessageCreateInput = {
  conversationId: string;
  senderEmail: string;
  senderRole: string;
  messageType: string;
  messageText?: string | undefined;
  attachmentUrl?: string | undefined;
  attachmentName?: string | undefined;
  attachmentMime?: string | undefined;
  isSystem?: boolean | undefined;
};

export type CallCreateInput = {
  conversationId: string;
  propertyId: string;
  callerEmail: string;
  callerRole: string;
  targetEmails: string[];
};

export type CallRecordingCreateInput = {
  callId: string;
  conversationId: string;
  propertyId: string;
  recordedByEmail: string;
  mimeType?: string | undefined;
  fileUrl: string;
  fileName?: string | undefined;
  durationSec?: number | undefined;
};

export async function ensureCommunicationTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS communication_conversations (
      id VARCHAR(64) PRIMARY KEY,
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      created_by_email VARCHAR(255) NOT NULL,
      created_by_role VARCHAR(32) NOT NULL,
      client_name VARCHAR(255),
      client_email VARCHAR(255),
      client_phone VARCHAR(40),
      subject TEXT,
      status VARCHAR(24) NOT NULL DEFAULT 'OPEN',
      last_message_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS communication_participants (
      conversation_id VARCHAR(64) NOT NULL REFERENCES communication_conversations(id) ON DELETE CASCADE,
      user_email VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (conversation_id, user_email)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS communication_messages (
      id BIGSERIAL PRIMARY KEY,
      conversation_id VARCHAR(64) NOT NULL REFERENCES communication_conversations(id) ON DELETE CASCADE,
      sender_email VARCHAR(255) NOT NULL,
      sender_role VARCHAR(32) NOT NULL,
      message_type VARCHAR(24) NOT NULL DEFAULT 'TEXT',
      message_text TEXT,
      attachment_url TEXT,
      attachment_name TEXT,
      attachment_mime VARCHAR(255),
      is_system BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS communication_typing (
      conversation_id VARCHAR(64) NOT NULL REFERENCES communication_conversations(id) ON DELETE CASCADE,
      user_email VARCHAR(255) NOT NULL,
      is_typing BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (conversation_id, user_email)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS communication_presence (
      user_email VARCHAR(255) PRIMARY KEY,
      is_online BOOLEAN NOT NULL DEFAULT FALSE,
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS communication_calls (
      id VARCHAR(64) PRIMARY KEY,
      conversation_id VARCHAR(64) NOT NULL REFERENCES communication_conversations(id) ON DELETE CASCADE,
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      caller_email VARCHAR(255) NOT NULL,
      caller_role VARCHAR(32) NOT NULL,
      target_emails TEXT[] NOT NULL DEFAULT '{}',
      status VARCHAR(24) NOT NULL DEFAULT 'RINGING',
      accepted_by VARCHAR(255),
      started_at TIMESTAMPTZ,
      ended_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS communication_call_recordings (
      id BIGSERIAL PRIMARY KEY,
      call_id VARCHAR(64) NOT NULL REFERENCES communication_calls(id) ON DELETE CASCADE,
      conversation_id VARCHAR(64) NOT NULL REFERENCES communication_conversations(id) ON DELETE CASCADE,
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      recorded_by_email VARCHAR(255) NOT NULL,
      mime_type VARCHAR(128),
      file_url TEXT NOT NULL,
      file_name TEXT,
      duration_sec INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_comm_conversations_property ON communication_conversations(property_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_comm_conversations_last_message ON communication_conversations(last_message_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_comm_messages_conversation ON communication_messages(conversation_id, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_comm_calls_conversation ON communication_calls(conversation_id, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_comm_call_recordings_call ON communication_call_recordings(call_id, created_at DESC);`);
}

export function createConversationId() {
  return `conv_${crypto.randomBytes(12).toString('hex')}`;
}

export function createCallId() {
  return `call_${crypto.randomBytes(12).toString('hex')}`;
}

export async function propertyExists(propertyId: string) {
  const result = await pool.query(`SELECT id FROM properties WHERE id = $1 LIMIT 1`, [propertyId]);
  return Boolean(result.rowCount);
}

export async function createConversation(input: ConversationCreateInput) {
  const conversationId = createConversationId();
  const result = await pool.query(
    `INSERT INTO communication_conversations (
      id, property_id, created_by_email, created_by_role, client_name, client_email, client_phone, subject, status, last_message_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN', NOW())
    RETURNING *`,
    [
      conversationId,
      input.propertyId,
      input.createdByEmail,
      input.createdByRole,
      input.clientName || null,
      input.clientEmail || null,
      input.clientPhone || null,
      input.subject || null,
    ],
  );

  await pool.query(
    `INSERT INTO communication_participants (conversation_id, user_email, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (conversation_id, user_email) DO NOTHING`,
    [conversationId, input.createdByEmail, input.createdByRole],
  );

  return result.rows[0];
}

export async function listConversationsForUser(userEmail: string, role: string, propertyId?: string) {
  const normalizedRole = String(role || '').toUpperCase();
  const values: any[] = [userEmail];
  let query = `
    SELECT c.*, COALESCE(m.message_text, '') AS last_message_text,
           m.created_at AS last_message_created_at
    FROM communication_conversations c
    LEFT JOIN LATERAL (
      SELECT message_text, created_at
      FROM communication_messages
      WHERE conversation_id = c.id
      ORDER BY created_at DESC
      LIMIT 1
    ) m ON TRUE
    WHERE
  `;

  if (normalizedRole === 'ADMIN') {
    query += ` 1=1 `;
  } else {
    query += ` (
      c.created_by_email = $1
      OR EXISTS (
        SELECT 1 FROM communication_participants p
        WHERE p.conversation_id = c.id AND p.user_email = $1
      )
    ) `;
  }

  if (propertyId) {
    values.push(propertyId);
    query += ` AND c.property_id = $${values.length} `;
  }

  query += ` ORDER BY COALESCE(c.last_message_at, c.updated_at) DESC, c.created_at DESC LIMIT 200 `;
  const result = await pool.query(query, values);
  return result.rows;
}

export async function canAccessConversation(conversationId: string, userEmail: string, role: string) {
  const normalizedRole = String(role || '').toUpperCase();
  if (normalizedRole === 'ADMIN') return true;

  const result = await pool.query(
    `SELECT 1
     FROM communication_conversations c
     WHERE c.id = $1
       AND (
         c.created_by_email = $2
         OR EXISTS (
           SELECT 1 FROM communication_participants p
           WHERE p.conversation_id = c.id AND p.user_email = $2
         )
       )
     LIMIT 1`,
    [conversationId, userEmail],
  );
  return Boolean(result.rowCount);
}

export async function getConversationById(conversationId: string) {
  const result = await pool.query(`SELECT * FROM communication_conversations WHERE id = $1 LIMIT 1`, [conversationId]);
  return result.rows[0] || null;
}

export async function listParticipants(conversationId: string) {
  const result = await pool.query(
    `SELECT conversation_id, user_email, role, joined_at
     FROM communication_participants
     WHERE conversation_id = $1
     ORDER BY joined_at ASC`,
    [conversationId],
  );
  return result.rows;
}

export async function addParticipant(conversationId: string, userEmail: string, role: string) {
  await pool.query(
    `INSERT INTO communication_participants (conversation_id, user_email, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (conversation_id, user_email) DO UPDATE
     SET role = EXCLUDED.role`,
    [conversationId, userEmail, role],
  );
}

export async function createMessage(input: MessageCreateInput) {
  const result = await pool.query(
    `INSERT INTO communication_messages (
      conversation_id, sender_email, sender_role, message_type, message_text,
      attachment_url, attachment_name, attachment_mime, is_system
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      input.conversationId,
      input.senderEmail,
      input.senderRole,
      input.messageType,
      input.messageText || null,
      input.attachmentUrl || null,
      input.attachmentName || null,
      input.attachmentMime || null,
      Boolean(input.isSystem),
    ],
  );

  await pool.query(
    `UPDATE communication_conversations
     SET last_message_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [input.conversationId],
  );

  return result.rows[0];
}

export async function listMessages(conversationId: string, limit = 100) {
  const cappedLimit = Math.min(300, Math.max(1, limit));
  const result = await pool.query(
    `SELECT *
     FROM communication_messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [conversationId, cappedLimit],
  );
  return [...result.rows].reverse();
}

export async function updateTypingState(conversationId: string, userEmail: string, isTyping: boolean) {
  await pool.query(
    `INSERT INTO communication_typing (conversation_id, user_email, is_typing, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (conversation_id, user_email)
     DO UPDATE SET is_typing = EXCLUDED.is_typing, updated_at = NOW()`,
    [conversationId, userEmail, isTyping],
  );
}

export async function listTyping(conversationId: string) {
  const result = await pool.query(
    `SELECT conversation_id, user_email, is_typing, updated_at
     FROM communication_typing
     WHERE conversation_id = $1
       AND is_typing = TRUE
       AND updated_at >= NOW() - INTERVAL '15 seconds'`,
    [conversationId],
  );
  return result.rows;
}

export async function touchPresence(userEmail: string, isOnline = true) {
  await pool.query(
    `INSERT INTO communication_presence (user_email, is_online, last_seen_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (user_email)
     DO UPDATE SET is_online = EXCLUDED.is_online, last_seen_at = NOW(), updated_at = NOW()`,
    [userEmail, isOnline],
  );
}

export async function setPresenceOffline(userEmail: string) {
  await pool.query(
    `UPDATE communication_presence
     SET is_online = FALSE, updated_at = NOW()
     WHERE user_email = $1`,
    [userEmail],
  );
}

export async function listPresence(emails?: string[]) {
  if (emails?.length) {
    const result = await pool.query(
      `SELECT user_email, is_online, last_seen_at
       FROM communication_presence
       WHERE user_email = ANY($1::text[])`,
      [emails],
    );
    return result.rows;
  }

  const result = await pool.query(
    `SELECT user_email, is_online, last_seen_at
     FROM communication_presence
     ORDER BY updated_at DESC
     LIMIT 500`,
  );
  return result.rows;
}

export async function createCall(input: CallCreateInput) {
  const callId = createCallId();
  const result = await pool.query(
    `INSERT INTO communication_calls (
      id, conversation_id, property_id, caller_email, caller_role, target_emails, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6::text[], 'RINGING', NOW(), NOW())
    RETURNING *`,
    [callId, input.conversationId, input.propertyId, input.callerEmail, input.callerRole, input.targetEmails],
  );
  return result.rows[0];
}

export async function getCallById(callId: string) {
  const result = await pool.query(`SELECT * FROM communication_calls WHERE id = $1 LIMIT 1`, [callId]);
  return result.rows[0] || null;
}

export async function listCalls(conversationId: string, limit = 50) {
  const cappedLimit = Math.min(200, Math.max(1, limit));
  const result = await pool.query(
    `SELECT *
     FROM communication_calls
     WHERE conversation_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [conversationId, cappedLimit],
  );
  return result.rows;
}

export async function getActiveCallForConversation(conversationId: string) {
  const result = await pool.query(
    `SELECT *
     FROM communication_calls
     WHERE conversation_id = $1
       AND status IN ('RINGING', 'CONNECTED')
     ORDER BY created_at DESC
     LIMIT 1`,
    [conversationId],
  );
  return result.rows[0] || null;
}

export async function acceptCall(callId: string, acceptedByEmail: string) {
  const result = await pool.query(
    `UPDATE communication_calls
     SET status = 'CONNECTED',
         accepted_by = $2,
         started_at = COALESCE(started_at, NOW()),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [callId, acceptedByEmail],
  );
  return result.rows[0] || null;
}

export async function rejectCall(callId: string) {
  const result = await pool.query(
    `UPDATE communication_calls
     SET status = 'REJECTED',
         ended_at = COALESCE(ended_at, NOW()),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [callId],
  );
  return result.rows[0] || null;
}

export async function endCall(callId: string) {
  const result = await pool.query(
    `UPDATE communication_calls
     SET status = 'ENDED',
         ended_at = COALESCE(ended_at, NOW()),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [callId],
  );
  return result.rows[0] || null;
}

export async function createCallRecording(input: CallRecordingCreateInput) {
  const result = await pool.query(
    `INSERT INTO communication_call_recordings (
      call_id, conversation_id, property_id, recorded_by_email, mime_type, file_url, file_name, duration_sec
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      input.callId,
      input.conversationId,
      input.propertyId,
      input.recordedByEmail,
      input.mimeType || null,
      input.fileUrl,
      input.fileName || null,
      input.durationSec ?? null,
    ],
  );
  return result.rows[0] || null;
}

export async function listCallRecordings(callId: string, limit = 30) {
  const cappedLimit = Math.min(200, Math.max(1, limit));
  const result = await pool.query(
    `SELECT *
     FROM communication_call_recordings
     WHERE call_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [callId, cappedLimit],
  );
  return result.rows;
}

export async function listCallsForUser(userEmail: string, role: string, limit = 200) {
  const normalizedRole = String(role || '').toUpperCase();
  const cappedLimit = Math.min(500, Math.max(1, limit));
  if (normalizedRole === 'ADMIN') {
    const result = await pool.query(
      `SELECT c.*
       FROM communication_calls c
       ORDER BY c.created_at DESC
       LIMIT $1`,
      [cappedLimit],
    );
    return result.rows;
  }

  const result = await pool.query(
    `SELECT c.*
     FROM communication_calls c
     WHERE EXISTS (
       SELECT 1
       FROM communication_conversations conv
       WHERE conv.id = c.conversation_id
         AND (
           conv.created_by_email = $1
           OR EXISTS (
             SELECT 1
             FROM communication_participants p
             WHERE p.conversation_id = conv.id
               AND p.user_email = $1
           )
         )
     )
     ORDER BY c.created_at DESC
     LIMIT $2`,
    [userEmail, cappedLimit],
  );
  return result.rows;
}

export async function getCommunicationAnalyticsForUser(userEmail: string, role: string) {
  const normalizedRole = String(role || '').toUpperCase();

  const scopeWhere =
    normalizedRole === 'ADMIN'
      ? `1=1`
      : `(
          conv.created_by_email = $1
          OR EXISTS (
            SELECT 1 FROM communication_participants p
            WHERE p.conversation_id = conv.id AND p.user_email = $1
          )
        )`;

  const params = normalizedRole === 'ADMIN' ? [] : [userEmail];

  const overviewResult = await pool.query(
    `SELECT
      COUNT(DISTINCT conv.id)::int AS total_conversations,
      COUNT(m.id)::int AS total_messages,
      COUNT(c.id)::int AS total_calls,
      COUNT(CASE WHEN c.status = 'CONNECTED' THEN 1 END)::int AS connected_calls,
      COUNT(CASE WHEN c.status = 'REJECTED' THEN 1 END)::int AS rejected_calls,
      COUNT(CASE WHEN c.status = 'RINGING' THEN 1 END)::int AS ringing_calls,
      COALESCE(AVG(c.duration_sec), 0)::float AS avg_call_duration_sec
    FROM communication_conversations conv
    LEFT JOIN communication_messages m ON m.conversation_id = conv.id
    LEFT JOIN (
      SELECT
        id,
        conversation_id,
        status,
        CASE
          WHEN started_at IS NOT NULL AND ended_at IS NOT NULL THEN EXTRACT(EPOCH FROM (ended_at - started_at))
          ELSE NULL
        END AS duration_sec
      FROM communication_calls
    ) c ON c.conversation_id = conv.id
    WHERE ${scopeWhere}`,
    params,
  );

  const propertyResult = await pool.query(
    `SELECT
      conv.property_id,
      COUNT(DISTINCT conv.id)::int AS conversations,
      COUNT(DISTINCT c.id)::int AS calls,
      COUNT(m.id)::int AS messages
    FROM communication_conversations conv
    LEFT JOIN communication_calls c ON c.conversation_id = conv.id
    LEFT JOIN communication_messages m ON m.conversation_id = conv.id
    WHERE ${scopeWhere}
    GROUP BY conv.property_id
    ORDER BY calls DESC, messages DESC
    LIMIT 20`,
    params,
  );

  const trendResult = await pool.query(
    `SELECT
      DATE_TRUNC('day', conv.created_at)::date AS day,
      COUNT(DISTINCT conv.id)::int AS conversations,
      COUNT(DISTINCT c.id)::int AS calls,
      COUNT(m.id)::int AS messages
    FROM communication_conversations conv
    LEFT JOIN communication_calls c ON c.conversation_id = conv.id
    LEFT JOIN communication_messages m ON m.conversation_id = conv.id
    WHERE ${scopeWhere}
      AND conv.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('day', conv.created_at)::date
    ORDER BY day ASC`,
    params,
  );

  return {
    overview: overviewResult.rows[0] || {
      total_conversations: 0,
      total_messages: 0,
      total_calls: 0,
      connected_calls: 0,
      rejected_calls: 0,
      ringing_calls: 0,
      avg_call_duration_sec: 0,
    },
    byProperty: propertyResult.rows,
    trend30d: trendResult.rows,
  };
}

export async function expireStaleRingingCalls(timeoutMinutes = 2) {
  const result = await pool.query(
    `UPDATE communication_calls
     SET status = 'MISSED',
         ended_at = COALESCE(ended_at, NOW()),
         updated_at = NOW()
     WHERE status = 'RINGING'
       AND created_at <= NOW() - ($1::text || ' minutes')::interval
     RETURNING *`,
    [String(timeoutMinutes)],
  );
  return result.rows;
}

export async function pruneStaleTypingStates() {
  await pool.query(
    `DELETE FROM communication_typing
     WHERE updated_at <= NOW() - INTERVAL '5 minutes'`,
  );
}
