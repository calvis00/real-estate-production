'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl, withCsrfHeader } from '@/utils/api';

type UserRole = 'ADMIN' | 'SALES' | 'VIEWER';
type SessionRow = {
  session_id: string;
  email: string;
  role: string;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  created_at: string;
  last_seen_at: string;
  ended_at: string | null;
};
type LoginAttemptRow = {
  id: number;
  email: string;
  success: boolean;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  attempted_at: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CrmSecurityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('VIEWER');
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [attempts, setAttempts] = useState<LoginAttemptRow[]>([]);
  const [ops, setOps] = useState<any>(null);
  const [error, setError] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  const canAccess = role === 'ADMIN';

  async function loadSecurityData() {
    try {
      setLoading(true);
      setError('');

      const meRes = await fetch(apiUrl('/api/auth/me'), { credentials: 'include', cache: 'no-store' });
      if (meRes.status === 401) {
        router.push('/crm/login');
        return;
      }

      const meData = await meRes.json();
      const currentRole = String(meData?.user?.role || '').toUpperCase() as UserRole;
      setRole(currentRole);

      if (currentRole !== 'ADMIN') {
        setError('Only admin users can access security and observability reports.');
        return;
      }

      const [sessionsRes, attemptsRes, opsRes] = await Promise.all([
        fetch(apiUrl('/api/auth/security/sessions'), { credentials: 'include', cache: 'no-store' }),
        fetch(apiUrl('/api/auth/security/login-attempts'), { credentials: 'include', cache: 'no-store' }),
        fetch(apiUrl('/api/admin/observability'), { credentials: 'include', cache: 'no-store' }),
      ]);

      if (!sessionsRes.ok || !attemptsRes.ok || !opsRes.ok) {
        setError('Failed to load one or more security data sections.');
        return;
      }

      const sessionsData = await sessionsRes.json();
      const attemptsData = await attemptsRes.json();
      const opsData = await opsRes.json();
      setSessions(sessionsData?.data || []);
      setAttempts(attemptsData?.data || []);
      setOps(opsData?.data || null);
    } catch (loadError) {
      console.error(loadError);
      setError('Unable to load security report.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSecurityData();
  }, [refreshTick]);

  const activeSessionCount = useMemo(() => sessions.filter((item) => item.is_active).length, [sessions]);
  const failedAttempts = useMemo(() => attempts.filter((item) => !item.success).length, [attempts]);

  async function revokeSession(sessionId: string) {
    if (!window.confirm('Force logout this session?')) return;
    const res = await fetch(apiUrl(`/api/auth/security/sessions/${sessionId}/revoke`), {
      method: 'POST',
      credentials: 'include',
      headers: withCsrfHeader(),
    });
    if (res.ok) {
      setRefreshTick((n) => n + 1);
      return;
    }
    window.alert('Failed to revoke session.');
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8 text-on-surface md:px-8">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Phase 3</p>
            <h1 className="mt-1 text-3xl font-extrabold font-headline text-primary">Security & Observability</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
              {role}
            </span>
            <button
              onClick={() => router.push('/crm/dashboard')}
              className="rounded-xl border border-surface-container bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary"
            >
              Back To CRM
            </button>
            <button
              onClick={() => setRefreshTick((n) => n + 1)}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-surface-container bg-surface p-6 text-sm text-outline">Loading report...</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : !canAccess ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            Admin access is required for this route.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-surface-container bg-surface p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-outline">Active Sessions</p>
                <p className="mt-2 text-2xl font-extrabold text-primary">{activeSessionCount}</p>
              </div>
              <div className="rounded-2xl border border-surface-container bg-surface p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-outline">Failed Logins</p>
                <p className="mt-2 text-2xl font-extrabold text-rose-700">{failedAttempts}</p>
              </div>
              <div className="rounded-2xl border border-surface-container bg-surface p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-outline">Uptime (Sec)</p>
                <p className="mt-2 text-2xl font-extrabold text-primary">{ops?.nodeUptimeSec ?? '-'}</p>
              </div>
              <div className="rounded-2xl border border-surface-container bg-surface p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-outline">DB Latency</p>
                <p className="mt-2 text-2xl font-extrabold text-primary">{ops?.dbLatencyMs ?? '-'} ms</p>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-container bg-surface p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-outline">Observability</p>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <p>Server Time: <strong>{formatDateTime(ops?.serverTime)}</strong></p>
                <p>Started At: <strong>{formatDateTime(ops?.startedAt)}</strong></p>
                <p>Backup Configured: <strong>{ops?.backupStatus?.configured ? 'Yes' : 'No'}</strong></p>
                <p>Backup Note: <strong>{ops?.backupStatus?.message || '-'}</strong></p>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-container bg-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-outline">Session List</p>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                  {sessions.length} Total
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-container text-outline">
                      <th className="px-2 py-2">Email</th>
                      <th className="px-2 py-2">Role</th>
                      <th className="px-2 py-2">IP</th>
                      <th className="px-2 py-2">Created</th>
                      <th className="px-2 py-2">Last Seen</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 120).map((row) => (
                      <tr key={row.session_id} className="border-b border-surface-container/60">
                        <td className="px-2 py-2">{row.email}</td>
                        <td className="px-2 py-2">{row.role}</td>
                        <td className="px-2 py-2">{row.ip_address || '-'}</td>
                        <td className="px-2 py-2">{formatDateTime(row.created_at)}</td>
                        <td className="px-2 py-2">{formatDateTime(row.last_seen_at)}</td>
                        <td className="px-2 py-2">
                          <span className={`rounded-full px-2 py-1 font-bold uppercase ${row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {row.is_active ? 'Active' : 'Ended'}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => revokeSession(row.session_id)}
                            disabled={!row.is_active}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 font-bold uppercase tracking-wider text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-container bg-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-outline">Login Attempt History</p>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                  {attempts.length} Total
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-container text-outline">
                      <th className="px-2 py-2">At</th>
                      <th className="px-2 py-2">Email</th>
                      <th className="px-2 py-2">Result</th>
                      <th className="px-2 py-2">Reason</th>
                      <th className="px-2 py-2">IP</th>
                      <th className="px-2 py-2">User Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.slice(0, 150).map((row) => (
                      <tr key={row.id} className="border-b border-surface-container/60">
                        <td className="px-2 py-2">{formatDateTime(row.attempted_at)}</td>
                        <td className="px-2 py-2">{row.email}</td>
                        <td className="px-2 py-2">
                          <span className={`rounded-full px-2 py-1 font-bold uppercase ${row.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {row.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-2 py-2">{row.reason || '-'}</td>
                        <td className="px-2 py-2">{row.ip_address || '-'}</td>
                        <td className="max-w-[380px] truncate px-2 py-2">{row.user_agent || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-container bg-surface p-5">
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-outline">Slow Query Snapshot</p>
              {(ops?.slowQueries || []).length ? (
                <div className="space-y-2 text-xs">
                  {(ops.slowQueries as any[]).slice(0, 20).map((query, idx) => (
                    <div key={`q-${idx}`} className="rounded-xl border border-surface-container bg-background/40 p-3">
                      <p><strong>Duration:</strong> {String(query.duration || '-')}</p>
                      <p><strong>State:</strong> {String(query.state || '-')}</p>
                      <p className="mt-1 break-all text-outline">{String(query.query || '-')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-outline">No active slow queries over threshold at this moment.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
