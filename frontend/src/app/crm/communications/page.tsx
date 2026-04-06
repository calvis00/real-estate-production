'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/utils/api';

type CallRow = {
  id: string;
  conversation_id: string;
  property_id: string;
  caller_email: string;
  caller_role: string;
  status: string;
  accepted_by: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

type AnalyticsData = {
  overview: {
    total_conversations: number;
    total_messages: number;
    total_calls: number;
    connected_calls: number;
    rejected_calls: number;
    ringing_calls: number;
    avg_call_duration_sec: number;
  };
  byProperty: Array<{
    property_id: string;
    conversations: number;
    calls: number;
    messages: number;
  }>;
  trend30d: Array<{
    day: string;
    conversations: number;
    calls: number;
    messages: number;
  }>;
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

export default function CrmCommunicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [callsRes, analyticsRes] = await Promise.all([
        fetch(apiUrl('/api/communications/calls?limit=300'), {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(apiUrl('/api/communications/analytics'), {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      if (callsRes.status === 401 || analyticsRes.status === 401) {
        router.push('/crm/login');
        return;
      }
      if (!callsRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to load communication analytics');
      }

      const callsData = await callsRes.json();
      const analyticsData = await analyticsRes.json();
      setCalls((callsData?.data || []) as CallRow[]);
      setAnalytics((analyticsData?.data || null) as AnalyticsData | null);
    } catch (loadErr) {
      console.error(loadErr);
      setError('Unable to load communication insights.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const overview = analytics?.overview;

  return (
    <div className="min-h-screen bg-background px-6 py-8 text-on-surface md:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">CRM Communications</p>
            <h1 className="mt-1 text-3xl font-extrabold font-headline text-primary">Call History & Analytics</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/crm/chat')}
              className="rounded-xl border border-surface-container bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary"
            >
              Back To Chat
            </button>
            <button
              onClick={loadData}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-surface-container bg-surface p-6 text-sm text-outline">Loading communication report...</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {[
                ['Conversations', overview?.total_conversations ?? 0],
                ['Messages', overview?.total_messages ?? 0],
                ['Calls', overview?.total_calls ?? 0],
                ['Connected', overview?.connected_calls ?? 0],
                ['Rejected', overview?.rejected_calls ?? 0],
                ['Avg Call Sec', Math.round(overview?.avg_call_duration_sec || 0)],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-surface-container bg-surface p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-outline">{label}</p>
                  <p className="mt-2 text-2xl font-extrabold text-primary">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-surface-container bg-surface p-5">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-outline">Top Properties By Engagement</p>
                {(analytics?.byProperty || []).length ? (
                  <div className="space-y-2">
                    {(analytics?.byProperty || []).slice(0, 12).map((row) => (
                      <div key={row.property_id} className="rounded-xl border border-surface-container bg-background/40 px-3 py-2">
                        <p className="text-xs font-bold text-primary">Property: {row.property_id.slice(0, 12)}...</p>
                        <p className="text-[11px] text-outline">
                          Conversations: {row.conversations} • Calls: {row.calls} • Messages: {row.messages}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-outline">No property analytics yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-surface-container bg-surface p-5">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-outline">30-Day Trend</p>
                {(analytics?.trend30d || []).length ? (
                  <div className="space-y-2">
                    {(analytics?.trend30d || []).slice(-14).map((row) => (
                      <div key={row.day} className="rounded-xl border border-surface-container bg-background/40 px-3 py-2">
                        <p className="text-xs font-bold text-primary">{formatDateTime(`${row.day}T00:00:00`)}</p>
                        <p className="text-[11px] text-outline">
                          Conversations: {row.conversations} • Calls: {row.calls} • Messages: {row.messages}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-outline">No trend data yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-surface-container bg-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-outline">Call History</p>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                  {calls.length} Calls
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-container text-outline">
                      <th className="px-2 py-2">Created</th>
                      <th className="px-2 py-2">Call ID</th>
                      <th className="px-2 py-2">Conversation</th>
                      <th className="px-2 py-2">Property</th>
                      <th className="px-2 py-2">Caller</th>
                      <th className="px-2 py-2">Accepted By</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Started</th>
                      <th className="px-2 py-2">Ended</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((call) => (
                      <tr key={call.id} className="border-b border-surface-container/60">
                        <td className="px-2 py-2">{formatDateTime(call.created_at)}</td>
                        <td className="px-2 py-2 font-bold text-primary">{call.id.slice(0, 14)}...</td>
                        <td className="px-2 py-2">{call.conversation_id.slice(0, 14)}...</td>
                        <td className="px-2 py-2">{call.property_id.slice(0, 10)}...</td>
                        <td className="px-2 py-2">{call.caller_email}</td>
                        <td className="px-2 py-2">{call.accepted_by || '-'}</td>
                        <td className="px-2 py-2">
                          <span
                            className={`rounded-full px-2 py-1 font-bold uppercase tracking-wider ${
                              call.status === 'CONNECTED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : call.status === 'RINGING'
                                ? 'bg-amber-100 text-amber-700'
                                : call.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {call.status}
                          </span>
                        </td>
                        <td className="px-2 py-2">{formatDateTime(call.started_at)}</td>
                        <td className="px-2 py-2">{formatDateTime(call.ended_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

