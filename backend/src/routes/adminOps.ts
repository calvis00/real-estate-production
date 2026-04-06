import { Router } from 'express';
import os from 'os';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import { pool } from '../db/index.js';

const router = Router();

router.get('/observability', authMiddleware, requireRoles(['ADMIN']), async (_req, res) => {
  const mem = process.memoryUsage();
  const startedAt = new Date(Date.now() - process.uptime() * 1000).toISOString();

  let dbLatencyMs = -1;
  const dbStart = Date.now();
  try {
    await pool.query('SELECT 1');
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbLatencyMs = -1;
  }

  let slowQueries: any[] = [];
  try {
    const result = await pool.query(
      `SELECT pid, now() - query_start AS duration, state, query
       FROM pg_stat_activity
       WHERE state = 'active'
         AND now() - query_start > interval '2 seconds'
       ORDER BY query_start ASC
       LIMIT 20`,
    );
    slowQueries = result.rows;
  } catch {
    slowQueries = [];
  }

  let communicationHealth = {
    totalConversations: 0,
    totalMessages: 0,
    totalCalls: 0,
    ringingCalls: 0,
    connectedCalls: 0,
    staleRingingCalls: 0,
    totalRecordings: 0,
  };
  try {
    const result = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM communication_conversations) AS total_conversations,
         (SELECT COUNT(*)::int FROM communication_messages) AS total_messages,
         (SELECT COUNT(*)::int FROM communication_calls) AS total_calls,
         (SELECT COUNT(*)::int FROM communication_calls WHERE status = 'RINGING') AS ringing_calls,
         (SELECT COUNT(*)::int FROM communication_calls WHERE status = 'CONNECTED') AS connected_calls,
         (SELECT COUNT(*)::int FROM communication_calls WHERE status = 'RINGING' AND created_at <= NOW() - INTERVAL '2 minutes') AS stale_ringing_calls,
         (SELECT COUNT(*)::int FROM communication_call_recordings) AS total_recordings`,
    );
    const row = result.rows[0] || {};
    communicationHealth = {
      totalConversations: Number(row.total_conversations || 0),
      totalMessages: Number(row.total_messages || 0),
      totalCalls: Number(row.total_calls || 0),
      ringingCalls: Number(row.ringing_calls || 0),
      connectedCalls: Number(row.connected_calls || 0),
      staleRingingCalls: Number(row.stale_ringing_calls || 0),
      totalRecordings: Number(row.total_recordings || 0),
    };
  } catch {
    // ignore communication metrics errors
  }

  res.json({
    data: {
      serverTime: new Date().toISOString(),
      nodeUptimeSec: Math.round(process.uptime()),
      startedAt,
      cpuLoad: os.loadavg(),
      memory: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        external: mem.external,
      },
      dbLatencyMs,
      slowQueries,
      backupStatus: {
        configured: process.env.BACKUP_STATUS === 'enabled',
        message: process.env.BACKUP_STATUS_MESSAGE || 'No automated backup status configured',
      },
      communicationHealth,
    },
  });
});

export default router;
