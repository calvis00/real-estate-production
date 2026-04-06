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
    },
  });
});

export default router;

