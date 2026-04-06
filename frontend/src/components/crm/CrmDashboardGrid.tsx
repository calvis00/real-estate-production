'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type CellValueChangedEvent,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community';
import AddPropertyModal from '@/components/AddPropertyModal';
import { apiUrl, withCsrfHeader } from '@/utils/api';

ModuleRegistry.registerModules([AllCommunityModule]);

type ActiveTab = 'leads' | 'properties' | 'contacts' | 'listing_requests' | 'action_queue' | 'users';
type UserRole = 'ADMIN' | 'SALES' | 'VIEWER';
type NewIndicatorMap = Record<ActiveTab, number>;
type LastSeenMap = Record<ActiveTab, string>;
type ActivityItem = {
  id: string;
  at: string;
  tab: ActiveTab;
  action: string;
  message: string;
};
type DeleteEntity = 'lead' | 'contact' | 'listing_request' | 'property';
type PendingDeleteItem = {
  key: string;
  entity: DeleteEntity;
  id: string | number;
  tab: ActiveTab;
  row: any;
  expiresAt: number;
};

const crmStatusOptions = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'NEED_TO_RECALL', 'CLOSED'];
const crmPriorityOptions = ['LOW', 'MEDIUM', 'HIGH'];
const crmSourceOptions = [
  'NAV_CONTACT',
  'NAV_LISTING_REQUEST',
  'WALK_IN',
  'PHONE',
  'WEBSITE',
  'REFERRAL',
  'HERO_SEARCH',
];
const propertyStatusOptions = ['ACTIVE', 'HIDDEN', 'ARCHIVED', 'SOLD', 'DRAFT'];

const quartzTheme = themeQuartz.withParams({
  accentColor: '#0f766e',
  backgroundColor: '#fcfcf7',
  browserColorScheme: 'light',
  cellTextColor: '#203731',
  columnBorder: true,
  fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
  foregroundColor: '#203731',
  headerBackgroundColor: '#f3efe3',
  headerTextColor: '#17312d',
  rowHoverColor: '#eef5f1',
  selectedRowBackgroundColor: '#dcefe6',
});

const numericCellClass = 'ag-normal-number-font';
const dateCellClass = 'ag-normal-date-font';

function formatMoney(value?: number | null) {
  if (value == null) return '-';
  if (value >= 10000000) return `Rs ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(2)} L`;
  return `Rs ${Number(value).toLocaleString('en-IN')}`;
}

function formatDisplayId(value?: string | number | null) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value ?? '-');
  return String(numericValue + 999);
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

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

function formatDateInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function getFollowUpState(value?: string | null) {
  if (!value) return null;

  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() < today.getTime()) return 'overdue';
  if (target.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}

function getDateMs(value?: string | null) {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function getReminderKey(row: any) {
  return `${row.source || 'REMINDER'}-${row.id}`;
}

function getLatestCreatedAt(rows: any[]) {
  let latest = 0;
  rows.forEach((row) => {
    const ms = getDateMs(row.createdAt);
    if (ms > latest) latest = ms;
  });
  return latest ? new Date(latest).toISOString() : '';
}

function countNewRows(rows: any[], lastSeenIso: string) {
  const lastSeenMs = getDateMs(lastSeenIso);
  if (!lastSeenMs) return 0;
  return rows.filter((row) => getDateMs(row.createdAt) > lastSeenMs).length;
}

function getQueueEntryMs(row: any) {
  return Math.max(getDateMs(row.updatedAt), getDateMs(row.createdAt), getDateMs(row.nextFollowUpDate));
}

function getActionQueueRows(
  leads: any[],
  contacts: any[],
  listingRequests: any[],
  properties: any[],
) {
  const reminderRows = [...leads, ...contacts, ...listingRequests]
    .filter((row) => row.nextFollowUpDate)
    .map((row) => ({
      ...row,
      followUpState: getFollowUpState(row.nextFollowUpDate),
      followUpDateLabel: formatDate(row.nextFollowUpDate),
    }))
    .filter((row) => row.followUpState === 'overdue' || row.followUpState === 'today');

  const propertyAttentionRows = properties.filter((property) => property.status === 'DRAFT' || property.status === 'HIDDEN');
  return [...reminderRows, ...propertyAttentionRows];
}

function getLatestActionQueueSeenAt(
  leads: any[],
  contacts: any[],
  listingRequests: any[],
  properties: any[],
) {
  const rows = getActionQueueRows(leads, contacts, listingRequests, properties);
  let latest = 0;
  rows.forEach((row) => {
    const ms = getQueueEntryMs(row);
    if (ms > latest) latest = ms;
  });
  return latest ? new Date(latest).toISOString() : '';
}

function countNewActionQueueRows(
  leads: any[],
  contacts: any[],
  listingRequests: any[],
  properties: any[],
  lastSeenIso: string,
) {
  const lastSeenMs = getDateMs(lastSeenIso);
  if (!lastSeenMs) return 0;
  const rows = getActionQueueRows(leads, contacts, listingRequests, properties);
  return rows.filter((row) => getQueueEntryMs(row) > lastSeenMs).length;
}

function CrmActionCell({
  data,
  activeTab,
  canWrite,
  onDelete,
  onConvert,
}: {
  data: any;
  activeTab: ActiveTab;
  canWrite: boolean;
  onDelete: (id: string | number) => void;
  onConvert: (id: string | number) => void;
}) {
  return (
    <div className="flex h-full items-center gap-2 py-2">
      {activeTab !== 'leads' && (
        <button
          disabled={!canWrite}
          onClick={() => onConvert(data.id)}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Convert
        </button>
      )}
      <button
        disabled={!canWrite}
        onClick={() => onDelete(data.id)}
        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Delete
      </button>
    </div>
  );
}

function PropertyActionCell({
  data,
  canWrite,
  onEdit,
  onStatus,
  onDelete,
}: {
  data: any;
  canWrite: boolean;
  onEdit: (property: any) => void;
  onStatus: (id: string | number, status: string) => void;
  onDelete: (id: string | number) => void;
}) {
  return (
    <div className="flex h-full flex-wrap items-center gap-2 py-2">
      <button
        disabled={!canWrite}
        onClick={() => onEdit(data)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Edit
      </button>
      <button
        disabled={!canWrite}
        onClick={() => onStatus(data.id, data.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE')}
        className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {data.status === 'ACTIVE' ? 'Hide' : 'Activate'}
      </button>
      <button
        disabled={!canWrite}
        onClick={() => onStatus(data.id, 'SOLD')}
        className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Sold
      </button>
      <button
        disabled={!canWrite}
        onClick={() => onDelete(data.id)}
        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Delete
      </button>
    </div>
  );
}

function FollowUpCell({
  data,
  canWrite,
  onUpdate,
}: {
  data: any;
  canWrite: boolean;
  onUpdate: (id: string | number, field: string, value: any) => void;
}) {
  const followUpState = getFollowUpState(data.nextFollowUpDate);

  return (
    <div className="flex h-full items-center gap-2 py-2">
      <input
        type="date"
        value={formatDateInput(data.nextFollowUpDate)}
        disabled={!canWrite}
        onChange={(event) => {
          const nextValue = event.target.value
            ? new Date(`${event.target.value}T09:00:00`).toISOString()
            : null;
          onUpdate(data.id, 'nextFollowUpDate', nextValue);
        }}
        className="w-full min-w-[136px] rounded-lg border border-surface-container bg-white px-2 py-1 text-xs text-on-surface outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
      />
      {followUpState && (
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
            followUpState === 'overdue'
              ? 'bg-rose-100 text-rose-700'
              : followUpState === 'today'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-sky-100 text-sky-700'
          }`}
        >
          {followUpState}
        </span>
      )}
    </div>
  );
}

export default function CrmDashboardGrid({ initialTab }: { initialTab?: ActiveTab }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [listingRequests, setListingRequests] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [crmUsers, setCrmUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('leads');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [stats, setStats] = useState({ totalLeads: 0, totalProperties: 0, closed: 0 });
  const [selectedRowIds, setSelectedRowIds] = useState<Array<string | number>>([]);
  const [bulkStatusValue, setBulkStatusValue] = useState('NEW');
  const [bulkSourceValue, setBulkSourceValue] = useState('NAV_CONTACT');
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [pendingDeletes, setPendingDeletes] = useState<PendingDeleteItem[]>([]);
  const [snoozedReminders, setSnoozedReminders] = useState<Record<string, number>>({});
  const [nowMs, setNowMs] = useState(Date.now());
  const [crmGridApi, setCrmGridApi] = useState<any>(null);
  const [propertyGridApi, setPropertyGridApi] = useState<any>(null);
  const [lastSeenByTab, setLastSeenByTab] = useState<LastSeenMap>({
    action_queue: '',
    leads: '',
    contacts: '',
    listing_requests: '',
    properties: '',
    users: '',
  });
  const [newByTab, setNewByTab] = useState<NewIndicatorMap>({
    action_queue: 0,
    leads: 0,
    contacts: 0,
    listing_requests: 0,
    properties: 0,
    users: 0,
  });
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('ADMIN');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('SALES');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    requirementText: '',
  });
  const router = useRouter();
  const pendingDeleteTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const canWrite = currentUserRole !== 'VIEWER';
  const isAdmin = currentUserRole === 'ADMIN';

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      return;
    }

    const savedTab = localStorage.getItem('crmActiveTab') as ActiveTab | null;
    if (savedTab && ['action_queue', 'leads', 'properties', 'contacts', 'listing_requests', 'users'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const rawSeen = localStorage.getItem('crmLastSeenByTab');
    if (rawSeen) {
      try {
        const parsed = JSON.parse(rawSeen) as Partial<LastSeenMap>;
        setLastSeenByTab((current) => ({ ...current, ...parsed }));
      } catch {
        // Ignore malformed localStorage value.
      }
    }

    const rawActivity = localStorage.getItem('crmActivityFeed');
    if (rawActivity) {
      try {
        setActivityFeed(JSON.parse(rawActivity) as ActivityItem[]);
      } catch {
        // Ignore malformed localStorage value.
      }
    }

    const rawSnooze = localStorage.getItem('crmReminderSnoozes');
    if (rawSnooze) {
      try {
        setSnoozedReminders(JSON.parse(rawSnooze) as Record<string, number>);
      } catch {
        // Ignore malformed localStorage value.
      }
    }
  }, []);

  useEffect(() => {
    if (!initialTab) {
      localStorage.setItem('crmActiveTab', activeTab);
    }
    if (activeTab === 'users' && !isAdmin) {
      setActiveTab('leads');
      return;
    }
    setStatusFilter('All');
    setSourceFilter('All');
    setSearchTerm('');
    setSelectedRowIds([]);
    setBulkStatusValue(activeTab === 'properties' ? 'Active' : 'NEW');
    setBulkSourceValue('NAV_CONTACT');
  }, [activeTab, initialTab, isAdmin]);

  useEffect(() => {
    if (!pendingDeletes.length) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [pendingDeletes.length]);

  useEffect(() => {
    return () => {
      Object.values(pendingDeleteTimersRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function persistLastSeen(nextState: LastSeenMap) {
    setLastSeenByTab(nextState);
    localStorage.setItem('crmLastSeenByTab', JSON.stringify(nextState));
  }

  function pushActivity(action: string, message: string, tab: ActiveTab = activeTab) {
    const item: ActivityItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      tab,
      action,
      message,
    };

    setActivityFeed((current) => {
      const next = [item, ...current].slice(0, 80);
      localStorage.setItem('crmActivityFeed', JSON.stringify(next));
      return next;
    });
  }

  function persistSnoozes(next: Record<string, number>) {
    setSnoozedReminders(next);
    localStorage.setItem('crmReminderSnoozes', JSON.stringify(next));
  }

  function snoozeReminder(row: any, minutes: number) {
    const key = getReminderKey(row);
    const next = { ...snoozedReminders, [key]: Date.now() + minutes * 60 * 1000 };
    persistSnoozes(next);
    pushActivity('SNOOZE', `Snoozed reminder for #${formatDisplayId(row.id)} by ${minutes} minutes`, 'action_queue');
  }

  function unsnoozeReminder(row: any) {
    const key = getReminderKey(row);
    if (!(key in snoozedReminders)) return;
    const next = { ...snoozedReminders };
    delete next[key];
    persistSnoozes(next);
  }

  function openWhatsAppReminder(row: any) {
    const digits = String(row.phone || '').replace(/\D/g, '');
    const phone = digits.startsWith('91') ? digits : `91${digits}`;
    const message = encodeURIComponent(
      `Hello ${row.customerName || ''}, this is your real estate follow-up regarding ${row.requirementText || 'your enquiry'}.`,
    );
    if (phone.length >= 12) {
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      pushActivity('REMINDER_WHATSAPP', `Opened WhatsApp reminder for #${formatDisplayId(row.id)}`, 'action_queue');
      return;
    }
    window.alert('Phone number is not valid for WhatsApp.');
  }

  function openEmailReminder(row: any) {
    const email = String(row.email || '').trim();
    if (!email) {
      window.alert('No email available for this record.');
      return;
    }
    const subject = encodeURIComponent('Follow-up on your property enquiry');
    const body = encodeURIComponent(
      `Hello ${row.customerName || ''},\n\nWe are following up regarding ${row.requirementText || 'your enquiry'}.\n\nRegards,\nCRM Team`,
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self');
    pushActivity('REMINDER_EMAIL', `Opened email reminder for #${formatDisplayId(row.id)}`, 'action_queue');
  }

  function removeLocalRow(entity: DeleteEntity, id: string | number) {
    if (entity === 'lead') setLeads((current) => current.filter((row) => row.id !== id));
    if (entity === 'contact') setContacts((current) => current.filter((row) => row.id !== id));
    if (entity === 'listing_request') setListingRequests((current) => current.filter((row) => row.id !== id));
    if (entity === 'property') setProperties((current) => current.filter((row) => row.id !== id));
  }

  function restoreLocalRow(entity: DeleteEntity, row: any) {
    if (entity === 'lead') setLeads((current) => [row, ...current.filter((item) => item.id !== row.id)]);
    if (entity === 'contact') setContacts((current) => [row, ...current.filter((item) => item.id !== row.id)]);
    if (entity === 'listing_request') setListingRequests((current) => [row, ...current.filter((item) => item.id !== row.id)]);
    if (entity === 'property') setProperties((current) => [row, ...current.filter((item) => item.id !== row.id)]);
  }

  async function performDeleteRequest(entity: DeleteEntity, id: string | number) {
    const endpoint =
      entity === 'property'
        ? `/api/properties/${id}`
        : entity === 'contact'
          ? `/api/contacts/${id}`
          : entity === 'listing_request'
            ? `/api/listing-requests/${id}`
            : `/api/leads/${id}`;

    const res = await fetch(apiUrl(endpoint), {
      method: 'DELETE',
      headers: withCsrfHeader(),
      credentials: 'include',
    });
    return res.ok;
  }

  function queueDelete(entity: DeleteEntity, row: any, tab: ActiveTab) {
    const id = row.id;
    const key = `${entity}-${id}-${Date.now()}`;
    const expiresAt = Date.now() + 10000;

    removeLocalRow(entity, id);
    setPendingDeletes((current) => [...current, { key, entity, id, tab, row, expiresAt }]);

    pendingDeleteTimersRef.current[key] = setTimeout(async () => {
      const ok = await performDeleteRequest(entity, id);
      setPendingDeletes((current) => current.filter((item) => item.key !== key));
      delete pendingDeleteTimersRef.current[key];

      if (!ok) {
        restoreLocalRow(entity, row);
        window.alert(`Delete failed for #${formatDisplayId(id)}. Record restored.`);
        return;
      }
      pushActivity('DELETE', `Deleted #${formatDisplayId(id)}`, tab);
    }, 10000);
  }

  function undoDelete(key: string) {
    const target = pendingDeletes.find((item) => item.key === key);
    if (!target) return;

    const timer = pendingDeleteTimersRef.current[key];
    if (timer) clearTimeout(timer);
    delete pendingDeleteTimersRef.current[key];

    setPendingDeletes((current) => current.filter((item) => item.key !== key));
    restoreLocalRow(target.entity, target.row);
    pushActivity('UNDO_DELETE', `Restored #${formatDisplayId(target.id)} before delete commit`, target.tab);
  }

  async function fetchData() {
    try {
      const [meRes, leadsRes, contactsRes, listingRes, propsRes] = await Promise.all([
        fetch(apiUrl('/api/auth/me'), { credentials: 'include', cache: 'no-store' }),
        fetch(apiUrl('/api/leads'), { credentials: 'include', cache: 'no-store' }),
        fetch(apiUrl('/api/contacts'), { credentials: 'include', cache: 'no-store' }),
        fetch(apiUrl('/api/listing-requests'), { credentials: 'include', cache: 'no-store' }),
        fetch(apiUrl('/api/properties'), { credentials: 'include', cache: 'no-store' }),
      ]);

      if (meRes.status === 401 || leadsRes.status === 401) {
        router.push('/crm/login');
        return;
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        const role = String(meData?.user?.role || '').toUpperCase();
        if (role === 'ADMIN' || role === 'SALES' || role === 'VIEWER') {
          setCurrentUserRole(role as UserRole);
          if (role === 'ADMIN') {
            const usersRes = await fetch(apiUrl('/api/auth/users'), { credentials: 'include', cache: 'no-store' });
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              setCrmUsers(usersData.data || []);
            }
          }
        }
      }

      const leadsData = await leadsRes.json();
      const contactsData = await contactsRes.json();
      const listingData = await listingRes.json();
      const propsData = await propsRes.json();

      setLeads(leadsData.data || []);
      setContacts(contactsData.data || []);
      setListingRequests(listingData.data || []);
      setProperties(propsData.data || []);
      setStats({
        totalLeads: (leadsData.data || []).length,
        totalProperties: (propsData.data || []).filter((property: any) => property.status === 'ACTIVE').length,
        closed: (leadsData.data || []).filter((lead: any) => lead.status === 'CLOSED').length,
      });
      setLoading(false);
    } catch (error) {
      console.error(error);
      router.push('/crm/login');
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const entries = Object.entries(snoozedReminders);
    if (!entries.length) return;
    const now = Date.now();
    const next = entries.reduce<Record<string, number>>((acc, [key, until]) => {
      if (until > now) acc[key] = until;
      return acc;
    }, {});
    if (Object.keys(next).length !== entries.length) {
      persistSnoozes(next);
    }
  }, [nowMs]);

  useEffect(() => {
    if (loading) return;

    const initializedState: LastSeenMap = { ...lastSeenByTab };
    let changed = false;

    ([
      ['action_queue', []],
      ['leads', leads],
      ['contacts', contacts],
      ['listing_requests', listingRequests],
      ['properties', properties],
      ['users', crmUsers],
    ] as Array<[ActiveTab, any[]]>).forEach(([key, rows]) => {
      if (!initializedState[key]) {
        initializedState[key] =
          key === 'action_queue'
            ? getLatestActionQueueSeenAt(leads, contacts, listingRequests, properties)
            : getLatestCreatedAt(rows);
        changed = true;
      }
    });

    if (changed) {
      persistLastSeen(initializedState);
    }
  }, [loading, leads, contacts, listingRequests, properties]);

  useEffect(() => {
    if (loading) return;

    setNewByTab({
      action_queue: countNewActionQueueRows(leads, contacts, listingRequests, properties, lastSeenByTab.action_queue),
      leads: countNewRows(leads, lastSeenByTab.leads),
      contacts: countNewRows(contacts, lastSeenByTab.contacts),
      listing_requests: countNewRows(listingRequests, lastSeenByTab.listing_requests),
      properties: countNewRows(properties, lastSeenByTab.properties),
      users: countNewRows(crmUsers, lastSeenByTab.users),
    });
  }, [loading, leads, contacts, listingRequests, properties, crmUsers, lastSeenByTab]);

  useEffect(() => {
    if (loading) return;

    const sourceRows =
      activeTab === 'action_queue'
        ? []
        : activeTab === 'users'
        ? crmUsers
        : activeTab === 'leads'
        ? leads
        : activeTab === 'contacts'
          ? contacts
          : activeTab === 'listing_requests'
            ? listingRequests
            : properties;

    const latest =
      activeTab === 'action_queue'
        ? getLatestActionQueueSeenAt(leads, contacts, listingRequests, properties)
        : getLatestCreatedAt(sourceRows);
    if (!latest) return;

    if (lastSeenByTab[activeTab] === latest) return;

    const nextState: LastSeenMap = {
      ...lastSeenByTab,
      [activeTab]: latest,
    };
    persistLastSeen(nextState);
  }, [activeTab, loading, leads, contacts, listingRequests, properties, crmUsers]);

  function getActiveGridApi() {
    if (activeTab === 'users') return null;
    return activeTab === 'properties' ? propertyGridApi : crmGridApi;
  }

  function saveCurrentView() {
    const api = getActiveGridApi();
    if (!api) return;

    const viewPayload = {
      searchTerm,
      statusFilter,
      sourceFilter,
      sortModel: api.getSortModel?.() || [],
      filterModel: api.getFilterModel?.() || {},
      columnState: api.getColumnState?.() || [],
    };

    localStorage.setItem(`crmGridView:${activeTab}`, JSON.stringify(viewPayload));
    pushActivity('VIEW_SAVED', `Saved view for ${activeTab.replace('_', ' ')}`);
  }

  function loadCurrentView() {
    const api = getActiveGridApi();
    if (!api) return;

    const raw = localStorage.getItem(`crmGridView:${activeTab}`);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setSearchTerm(parsed.searchTerm ?? '');
      setStatusFilter(parsed.statusFilter ?? 'All');
      setSourceFilter(parsed.sourceFilter ?? 'All');
      api.applyColumnState?.({ state: parsed.columnState || [], applyOrder: true });
      api.setSortModel?.(parsed.sortModel || []);
      api.setFilterModel?.(parsed.filterModel || {});
      pushActivity('VIEW_LOADED', `Loaded saved view for ${activeTab.replace('_', ' ')}`);
    } catch {
      // Ignore malformed stored view.
    }
  }

  function resetCurrentView() {
    const api = getActiveGridApi();
    if (!api) return;

    setSearchTerm('');
    setStatusFilter('All');
    setSourceFilter('All');
    api.setFilterModel?.(null);
    api.setSortModel?.(null);
    api.resetColumnState?.();
    setSelectedRowIds([]);
    pushActivity('VIEW_RESET', `Reset view for ${activeTab.replace('_', ' ')}`);
  }

  function getSelectedRows() {
    const api = getActiveGridApi();
    if (!api) return [];
    return (api.getSelectedRows?.() || []) as any[];
  }

  async function runBulkDelete() {
    if (!canWrite) return;
    const selected = getSelectedRows();
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} selected records?`)) return;

    if (activeTab === 'properties') {
      selected.forEach((row) => queueDelete('property', row, 'properties'));
      pushActivity('BULK_DELETE_QUEUED', `Queued delete for ${selected.length} properties`, 'properties');
    } else {
      const entity: DeleteEntity =
        activeTab === 'contacts' ? 'contact' : activeTab === 'listing_requests' ? 'listing_request' : 'lead';
      selected.forEach((row) => queueDelete(entity, row, activeTab));
      pushActivity('BULK_DELETE_QUEUED', `Queued delete for ${selected.length} ${activeTab}`, activeTab);
    }
    setSelectedRowIds([]);
  }

  async function runBulkConvert() {
    if (!canWrite) return;
    const selected = getSelectedRows();
    if (!selected.length || (activeTab !== 'contacts' && activeTab !== 'listing_requests')) return;
    if (!window.confirm(`Convert ${selected.length} selected ${activeTab} to leads?`)) return;

    const endpoint = activeTab === 'contacts' ? 'contacts' : 'listing-requests';
    await Promise.all(
      selected.map((row) =>
        fetch(apiUrl(`/api/${endpoint}/${row.id}/convert`), {
          method: 'POST',
          headers: withCsrfHeader(),
          credentials: 'include',
        }),
      ),
    );

    await fetchData();
    setActiveTab('leads');
    setSelectedRowIds([]);
    pushActivity('BULK_CONVERT', `Converted ${selected.length} ${activeTab} to leads`, activeTab);
  }

  async function runBulkStatusUpdate() {
    if (!canWrite) return;
    const selected = getSelectedRows();
    if (!selected.length) return;

    if (activeTab === 'properties') {
      await Promise.all(selected.map((row) => setPropertyStatus(row.id, bulkStatusValue.toUpperCase())));
      pushActivity('BULK_STATUS', `Updated status for ${selected.length} properties`, 'properties');
    } else {
      await Promise.all(selected.map((row) => updateLeadField(row.id, 'status', bulkStatusValue)));
      pushActivity('BULK_STATUS', `Updated status for ${selected.length} ${activeTab}`, activeTab);
    }
    setSelectedRowIds([]);
  }

  async function runBulkSourceUpdate() {
    if (!canWrite) return;
    const selected = getSelectedRows();
    if (!selected.length || activeTab === 'properties') return;

    await Promise.all(selected.map((row) => updateLeadField(row.id, 'source', bulkSourceValue)));
    setSelectedRowIds([]);
    pushActivity('BULK_SOURCE', `Updated source for ${selected.length} ${activeTab}`, activeTab);
  }

  async function handleLogout() {
    await fetch(apiUrl('/api/auth/logout'), {
      method: 'POST',
      credentials: 'include',
      headers: withCsrfHeader(),
    });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('crmCsrfToken');
    }
    router.push('/crm/login');
  }

  async function deleteLead(id: string | number) {
    if (!canWrite) return;
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    const sourceRows =
      activeTab === 'contacts' ? contacts : activeTab === 'listing_requests' ? listingRequests : leads;
    const row = sourceRows.find((item) => item.id === id);
    if (!row) return;
    const entity: DeleteEntity =
      activeTab === 'contacts' ? 'contact' : activeTab === 'listing_requests' ? 'listing_request' : 'lead';
    queueDelete(entity, row, activeTab);
    pushActivity('DELETE_QUEUED', `Queued delete for #${formatDisplayId(id)} with undo window`, activeTab);
  }

  async function updateLeadField(id: string | number, field: string, value: any) {
    if (!canWrite) return;
    const endpoint =
      activeTab === 'contacts' ? 'contacts' : activeTab === 'listing_requests' ? 'listing-requests' : 'leads';

    await fetch(apiUrl(`/api/${endpoint}/${id}`), {
      method: 'PUT',
      headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ [field]: value }),
      credentials: 'include',
    });

    if (activeTab === 'leads') {
      setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, [field]: value } : lead)));
    }
    if (activeTab === 'contacts') {
      setContacts((current) => current.map((contact) => (contact.id === id ? { ...contact, [field]: value } : contact)));
    }
    if (activeTab === 'listing_requests') {
      setListingRequests((current) =>
        current.map((request) => (request.id === id ? { ...request, [field]: value } : request)),
      );
    }

    if (['status', 'priority', 'source', 'nextFollowUpDate'].includes(field)) {
      pushActivity('UPDATE', `Updated ${field} for #${id}`, activeTab);
    }
  }

  async function convertLead(id: string | number) {
    if (!canWrite) return;
    if (!window.confirm('Move this into the primary Leads pipeline? It will be removed from this tab.')) return;

    const endpoint = activeTab === 'contacts' ? 'contacts' : 'listing-requests';
    const res = await fetch(apiUrl(`/api/${endpoint}/${id}/convert`), {
      method: 'POST',
      headers: withCsrfHeader(),
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json();
      window.alert(data.message || 'Conversion failed');
      return;
    }

    await fetchData();
    setActiveTab('leads');
    pushActivity('CONVERT', `Converted #${id} into lead`, activeTab);
  }

  async function deleteProperty(id: string | number) {
    if (!canWrite) return;
    if (!window.confirm('Delete this property permanently? This action cannot be undone.')) return;
    const row = properties.find((item) => item.id === id);
    if (!row) return;
    queueDelete('property', row, 'properties');
    pushActivity('DELETE_QUEUED', `Queued delete for property #${formatDisplayId(id)} with undo window`, 'properties');
  }

  async function setPropertyStatus(id: string | number, status: string) {
    if (!canWrite) return;
    const res = await fetch(apiUrl(`/api/properties/${id}/status`), {
      method: 'PATCH',
      headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status }),
      credentials: 'include',
    });
    if (res.ok) {
      setProperties((current) => current.map((property) => (property.id === id ? { ...property, status } : property)));
      pushActivity('STATUS', `Set property #${id} to ${status}`, 'properties');
    }
  }

  function openEditModal(property: any) {
    if (!canWrite) return;
    setSelectedProperty(property);
    setIsModalOpen(true);
  }

  function exportLeads() {
    const rows = filteredCrmRows;
    const headers = ['ID', 'Customer', 'Phone', 'Source', 'Requirement', 'Status', 'Priority', 'Created At', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        [
          `"${formatDisplayId(row.id)}"`,
          `"${row.customerName || ''}"`,
          `"${row.phone || ''}"`,
          `"${row.source || ''}"`,
          `"${(row.requirementText || '').replace(/"/g, '""')}"`,
          `"${row.status || ''}"`,
          `"${row.priority || ''}"`,
          `"${formatDate(row.createdAt)}"`,
          `"${(row.notes || '').replace(/"/g, '""')}"`,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `crm_export_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
  }

  function exportProperties() {
    const rows = filteredProperties;
    const headers = [
      'ID',
      'Title',
      'City',
      'Locality',
      'Market Type',
      'Category',
      'Bedrooms',
      'Bathrooms',
      'Area Sqft',
      'Price',
      'Status',
      'Created At',
      'Last Modified',
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        [
          `"${formatDisplayId(row.id)}"`,
          `"${(row.title || '').replace(/"/g, '""')}"`,
          `"${row.city || ''}"`,
          `"${row.locality || ''}"`,
          `"${row.type || ''}"`,
          `"${row.category || ''}"`,
          `"${row.bedrooms ?? ''}"`,
          `"${row.bathrooms ?? ''}"`,
          `"${row.areaSqft ?? ''}"`,
          `"${row.price ?? ''}"`,
          `"${row.status || ''}"`,
          `"${formatDateTime(row.createdAt)}"`,
          `"${formatDateTime(row.updatedAt)}"`,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `properties_export_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
  }

  function openQuickAdd() {
    if (!canWrite) return;
    setQuickAddForm({
      customerName: '',
      phone: '',
      email: '',
      requirementText: '',
    });
    setIsQuickAddOpen(true);
  }

  async function createCrmRecord() {
    if (!canWrite) return;
    if (!['leads', 'contacts', 'listing_requests'].includes(activeTab)) return;

    const customerName = quickAddForm.customerName.trim();
    const phone = quickAddForm.phone.trim();
    const requirementText = quickAddForm.requirementText.trim();
    const email = quickAddForm.email.trim();

    if (!customerName || !phone || !requirementText) {
      window.alert('Please fill Name, Phone, and Requirement.');
      return;
    }

    const endpoint =
      activeTab === 'contacts'
        ? '/api/contacts'
        : activeTab === 'listing_requests'
        ? '/api/listing-requests'
        : '/api/leads';

    const payload = {
      customerName,
      phone,
      requirementText,
      ...(email ? { email } : {}),
      source:
        activeTab === 'contacts'
          ? 'NAV_CONTACT'
          : activeTab === 'listing_requests'
          ? 'NAV_LISTING_REQUEST'
          : 'MANUAL',
    };

    const res = await fetch(apiUrl(endpoint), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert(data?.message || 'Failed to add record');
      return;
    }

    setIsQuickAddOpen(false);
    await fetchData();
    pushActivity('CREATE', `Added new ${activeTab.replace('_', ' ')} record`, activeTab);
  }

  async function createUser() {
    if (!isAdmin) return;
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      window.alert('Email and password are required.');
      return;
    }

    const res = await fetch(apiUrl('/api/auth/users'), {
      method: 'POST',
      credentials: 'include',
      headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert(data?.message || 'Failed to create user');
      return;
    }

    setCrmUsers((current) => [data.data, ...current]);
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('SALES');
    pushActivity('USER_CREATE', `Created user ${data?.data?.email || ''}`, 'users');
  }

  async function updateUserRole(userId: string, nextRole: UserRole) {
    if (!isAdmin) return;
    const res = await fetch(apiUrl(`/api/auth/users/${userId}`), {
      method: 'PUT',
      credentials: 'include',
      headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ role: nextRole }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert(data?.message || 'Failed to update user role');
      return;
    }

    setCrmUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, role: nextRole, updatedAt: new Date().toISOString() } : user)),
    );
    pushActivity('USER_ROLE_UPDATE', `Updated role to ${nextRole} for ${data?.data?.email || userId}`, 'users');
  }

  async function deleteUser(userId: string, email: string) {
    if (!isAdmin) return;
    if (!window.confirm(`Delete user ${email}?`)) return;

    const res = await fetch(apiUrl(`/api/auth/users/${userId}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: withCsrfHeader(),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert(data?.message || 'Failed to delete user');
      return;
    }

    setCrmUsers((current) => current.filter((user) => user.id !== userId));
    pushActivity('USER_DELETE', `Deleted user ${email}`, 'users');
  }

  function handleCrmCellValueChanged(event: CellValueChangedEvent<any>) {
    const field = event.colDef.field;
    if (!field || event.newValue === event.oldValue) return;
    updateLeadField(event.data.id, field, event.newValue);
  }

  function handlePropertyCellValueChanged(event: CellValueChangedEvent<any>) {
    if (event.colDef.field !== 'status' || event.newValue === event.oldValue) return;
    setPropertyStatus(event.data.id, event.newValue);
  }

  const crmDataSet =
    activeTab === 'contacts' ? contacts : activeTab === 'listing_requests' ? listingRequests : leads;

  const filteredCrmRows = crmDataSet.filter((row) => {
    const haystack = [
      row.customerName,
      row.phone,
      row.requirementText,
      row.preferredLocation,
      row.notes,
      row.email,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
    const matchesSource = sourceFilter === 'All' || row.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const filteredProperties = properties.filter((property) => {
    const haystack = [property.title, property.locality, property.city, property.id]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const normalizedStatus = statusFilter === 'All' ? 'ALL' : statusFilter.toUpperCase();
    const matchesStatus = normalizedStatus === 'ALL' || property.status === normalizedStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = crmUsers.filter((user) => {
    const haystack = [user.email, user.role].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || user.role === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const reminderRows = [...leads, ...contacts, ...listingRequests]
    .filter((row) => row.nextFollowUpDate)
    .map((row) => ({
      ...row,
      followUpState: getFollowUpState(row.nextFollowUpDate),
      followUpDateLabel: formatDate(row.nextFollowUpDate),
    }))
    .filter((row) => row.followUpState === 'overdue' || row.followUpState === 'today')
    .sort(
      (a, b) =>
        new Date(a.nextFollowUpDate).getTime() - new Date(b.nextFollowUpDate).getTime(),
    );

  const reminderNotifications = reminderRows
    .filter((row) => {
      const snoozeUntil = snoozedReminders[getReminderKey(row)] || 0;
      return !snoozeUntil || snoozeUntil <= Date.now();
    })
    .slice(0, 8);

  const overdueFollowUps = reminderRows.filter((row) => row.followUpState === 'overdue');
  const todayFollowUps = reminderRows.filter((row) => row.followUpState === 'today');
  const leadReminders = reminderRows.filter((row) => row.source !== 'NAV_CONTACT' && row.source !== 'NAV_LISTING_REQUEST');
  const contactReminders = reminderRows.filter((row) => row.source === 'NAV_CONTACT');
  const listingReminders = reminderRows.filter((row) => row.source === 'NAV_LISTING_REQUEST');
  const propertyAttentionRows = properties
    .filter((property) => property.status === 'DRAFT' || property.status === 'HIDDEN')
    .sort((a, b) => getDateMs(b.updatedAt) - getDateMs(a.updatedAt));

  const defaultColDef: ColDef = {
    editable: false,
    filter: true,
    floatingFilter: true,
    minWidth: 120,
    resizable: true,
    sortable: true,
  };

  const crmColumnDefs: ColDef[] = [
    {
      headerName: '',
      checkboxSelection: canWrite,
      headerCheckboxSelection: canWrite,
      maxWidth: 56,
      minWidth: 56,
      pinned: 'left',
      sortable: false,
      filter: false,
      floatingFilter: false,
      editable: false,
    },
    {
      field: 'id',
      headerName: 'ID',
      maxWidth: 90,
      pinned: 'left',
      cellClass: numericCellClass,
      valueFormatter: ({ value }) => formatDisplayId(value),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      cellClass: dateCellClass,
      valueFormatter: ({ value }) => formatDateTime(value),
      minWidth: 190,
    },
    {
      field: 'updatedAt',
      headerName: 'Last Modified',
      cellClass: dateCellClass,
      valueFormatter: ({ value }) => formatDateTime(value),
      minWidth: 190,
    },
    { field: 'customerName', headerName: 'Customer', editable: canWrite, minWidth: 180, pinned: 'left' },
    { field: 'phone', headerName: 'Phone', editable: canWrite, minWidth: 150, cellClass: numericCellClass },
    { field: 'email', headerName: 'Email', editable: canWrite, minWidth: 220 },
    {
      field: 'source',
      headerName: 'Source',
      editable: canWrite,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: crmSourceOptions },
      minWidth: 160,
    },
    { field: 'propertyType', headerName: 'Type', editable: canWrite, minWidth: 140 },
    { field: 'preferredLocation', headerName: 'Preferred Location', editable: canWrite, minWidth: 180 },
    {
      field: 'budgetMin',
      headerName: 'Budget Min',
      cellClass: numericCellClass,
      editable: canWrite,
      valueParser: ({ newValue }) => Number(newValue),
      valueFormatter: ({ value }) => formatMoney(value),
      minWidth: 150,
    },
    {
      field: 'budgetMax',
      headerName: 'Budget Max',
      cellClass: numericCellClass,
      editable: canWrite,
      valueParser: ({ newValue }) => Number(newValue),
      valueFormatter: ({ value }) => formatMoney(value),
      minWidth: 150,
    },
    {
      field: 'status',
      headerName: 'Status',
      editable: canWrite,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: crmStatusOptions },
      minWidth: 160,
    },
    {
      field: 'priority',
      headerName: 'Priority',
      editable: canWrite,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: crmPriorityOptions },
      minWidth: 140,
    },
    {
      field: 'nextFollowUpDate',
      headerName: 'Follow Up',
      editable: false,
      minWidth: 240,
      cellRenderer: (params: ICellRendererParams<any>) => (
        <FollowUpCell data={params.data} canWrite={canWrite} onUpdate={updateLeadField} />
      ),
    },
    {
      field: 'requirementText',
      headerName: 'Requirement',
      editable: canWrite,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true,
      flex: 1,
      minWidth: 280,
      wrapText: true,
      autoHeight: true,
    },
    {
      field: 'notes',
      headerName: 'Notes',
      editable: canWrite,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true,
      flex: 1,
      minWidth: 260,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: 'Actions',
      pinned: 'right',
      editable: false,
      filter: false,
      floatingFilter: false,
      sortable: false,
      minWidth: 170,
      cellRenderer: (params: ICellRendererParams<any>) => (
        <CrmActionCell
          data={params.data}
          activeTab={activeTab}
          canWrite={canWrite}
          onDelete={deleteLead}
          onConvert={convertLead}
        />
      ),
    },
  ];

  const propertyColumnDefs: ColDef[] = [
    {
      headerName: '',
      checkboxSelection: canWrite,
      headerCheckboxSelection: canWrite,
      maxWidth: 56,
      minWidth: 56,
      pinned: 'left',
      sortable: false,
      filter: false,
      floatingFilter: false,
      editable: false,
    },
    {
      field: 'id',
      headerName: 'ID',
      minWidth: 120,
      pinned: 'left',
      cellClass: numericCellClass,
      valueFormatter: ({ value }) => formatDisplayId(value),
    },
    { field: 'title', headerName: 'Property', minWidth: 260, pinned: 'left' },
    {
      field: 'createdAt',
      headerName: 'Created',
      cellClass: dateCellClass,
      valueFormatter: ({ value }) => formatDateTime(value),
      minWidth: 190,
    },
    {
      field: 'updatedAt',
      headerName: 'Last Modified',
      cellClass: dateCellClass,
      valueFormatter: ({ value }) => formatDateTime(value),
      minWidth: 190,
    },
    { field: 'city', headerName: 'City', minWidth: 130 },
    { field: 'locality', headerName: 'Locality', minWidth: 150 },
    { field: 'type', headerName: 'Market Type', minWidth: 170 },
    { field: 'category', headerName: 'Category', minWidth: 140 },
    { field: 'bedrooms', headerName: 'Beds', minWidth: 110, cellClass: numericCellClass },
    { field: 'bathrooms', headerName: 'Baths', minWidth: 110, cellClass: numericCellClass },
    { field: 'areaSqft', headerName: 'Area', minWidth: 120, cellClass: numericCellClass, valueFormatter: ({ value }) => `${value || 0} sqft` },
    { field: 'price', headerName: 'Price', minWidth: 150, cellClass: numericCellClass, valueFormatter: ({ value }) => formatMoney(value) },
    {
      field: 'status',
      headerName: 'Status',
      editable: canWrite,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: propertyStatusOptions },
      minWidth: 140,
    },
    {
      headerName: 'Actions',
      pinned: 'right',
      editable: false,
      filter: false,
      floatingFilter: false,
      sortable: false,
      minWidth: 260,
      cellRenderer: (params: ICellRendererParams<any>) => (
        <PropertyActionCell
          data={params.data}
          canWrite={canWrite}
          onDelete={deleteProperty}
          onEdit={openEditModal}
          onStatus={setPropertyStatus}
        />
      ),
    },
  ];

  const title =
    activeTab === 'action_queue'
      ? 'Action Queue'
      : activeTab === 'users'
      ? 'User Management'
      : activeTab === 'leads'
      ? 'General Enquiries'
      : activeTab === 'contacts'
        ? 'Contact Enquiries'
        : activeTab === 'listing_requests'
          ? 'Property Listing Requests'
          : 'Property Inventory';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-primary" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Loading CRM Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <style jsx global>{`
        .ag-cell.ag-normal-number-font,
        .ag-cell.ag-normal-number-font .ag-cell-value,
        .ag-cell.ag-normal-number-font .ag-group-value {
          font-family: Arial, Helvetica, sans-serif;
          font-variant-numeric: tabular-nums;
          font-style: normal;
        }

        .ag-cell.ag-normal-date-font,
        .ag-cell.ag-normal-date-font .ag-cell-value,
        .ag-cell.ag-normal-date-font .ag-group-value {
          font-family: Arial, Helvetica, sans-serif;
          font-variant-numeric: tabular-nums;
          font-style: normal;
        }
      `}</style>
      <div className="sticky top-0 z-40 border-b border-surface-container bg-surface/95 backdrop-blur-md">
        <div className="flex w-full items-center justify-between px-8 py-4">
          <div className="flex items-center gap-6">
            <h2 className="whitespace-nowrap text-xl font-extrabold font-headline uppercase tracking-tighter text-primary">
              NearbyAcres <span className="text-secondary">CRM</span>
            </h2>
            <div className="h-6 w-px bg-surface-container" />
            <div className="flex flex-wrap items-center gap-4">
              {[
                ['action_queue', 'Action Queue'],
                ['leads', 'Leads'],
                ['contacts', 'Contacts'],
                ['listing_requests', 'Listing Requests'],
                ['properties', 'Properties'],
                ...(isAdmin ? ([['users', 'Users']] as Array<[string, string]>) : []),
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as ActiveTab)}
                  className={`relative rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
                    activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-outline hover:text-primary'
                  }`}
                >
                  {label}
                  {newByTab[tab as ActiveTab] > 0 && (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-surface">
                      <span className="sr-only">{newByTab[tab as ActiveTab]} new records</span>
                    </span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => router.push('/crm/chat')}
                className="relative rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-outline transition hover:text-primary"
              >
                Chat
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/crm/security')}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition ${isAdmin ? 'text-outline hover:text-primary' : 'cursor-not-allowed text-outline/50'}`}
            disabled={!isAdmin}
          >
            <span className="material-symbols-outlined text-sm">security</span>
            Security
          </button>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
            {currentUserRole}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-outline transition hover:text-red-500"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Logout
          </button>
        </div>
      </div>

      <main className="space-y-8 px-8 py-8">
        {activeTab === 'action_queue' ? (
          <>
            <div className="rounded-[2rem] border border-surface-container bg-surface p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-outline">Reminder Notifications</p>
                  <h3 className="mt-1 text-2xl font-extrabold font-headline text-primary">In-App Alerts</h3>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  {reminderNotifications.length} Active
                </span>
              </div>
              {reminderNotifications.length ? (
                <div className="space-y-3">
                  {reminderNotifications.map((row: any) => (
                    <div key={`notify-${row.source}-${row.id}`} className="rounded-xl border border-surface-container bg-background/60 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-bold text-primary">
                          #{formatDisplayId(row.id)} {row.customerName || 'Unknown Contact'}
                        </p>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            row.followUpState === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {row.followUpState}
                        </span>
                      </div>
                      <p className="mb-2 text-xs text-outline">
                        {row.followUpDateLabel} {row.phone ? `• ${row.phone}` : ''} {row.email ? `• ${row.email}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openWhatsAppReminder(row)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700"
                        >
                          WhatsApp
                        </button>
                        <button
                          onClick={() => openEmailReminder(row)}
                          className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-700"
                        >
                          Email
                        </button>
                        <button
                          onClick={() => snoozeReminder(row, 60)}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700"
                        >
                          Snooze 1h
                        </button>
                        <button
                          onClick={() => snoozeReminder(row, 24 * 60)}
                          className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-700"
                        >
                          Snooze 1d
                        </button>
                        {snoozedReminders[getReminderKey(row)] && (
                          <button
                            onClick={() => unsnoozeReminder(row)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700"
                          >
                            Clear Snooze
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-outline">No active follow-up alerts right now.</p>
              )}
            </div>
            <div className="rounded-[2rem] border border-surface-container bg-surface p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-outline">Follow Up Reminders</p>
                  <h3 className="mt-1 text-2xl font-extrabold font-headline text-primary">Action Queue</h3>
                </div>
                <div className="flex gap-3 text-xs font-bold uppercase tracking-widest">
                  <span className="rounded-full bg-rose-100 px-3 py-2 text-rose-700">{overdueFollowUps.length} Overdue</span>
                  <span className="rounded-full bg-amber-100 px-3 py-2 text-amber-700">{todayFollowUps.length} Today</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {[
                  ['Leads', leadReminders, 'leads'],
                  ['Contacts', contactReminders, 'contacts'],
                  ['Listing Requests', listingReminders, 'listing_requests'],
                  ['Properties', propertyAttentionRows, 'properties'],
                ].map(([label, rows, tabKey]) => (
                  <div
                    key={String(tabKey)}
                    className="rounded-2xl border border-surface-container bg-background/60 p-4 text-left"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">{label}</p>
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                        {(rows as any[]).length}
                      </span>
                    </div>
                    {(rows as any[]).length ? (
                      <div className="space-y-2">
                        {(rows as any[]).slice(0, 6).map((row: any) => (
                          <div key={`${tabKey}-${row.id}`} className="rounded-xl border border-surface-container bg-surface px-3 py-2">
                            <p className="truncate text-sm font-bold text-primary">{row.customerName || row.title}</p>
                            <p className="text-[11px] text-outline">
                              {row.followUpDateLabel ? `Follow-up: ${row.followUpDateLabel}` : `Status: ${row.status || 'Pending'}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-outline">No pending items in this queue.</p>
                    )}
                    <button
                      onClick={() => setActiveTab(tabKey as ActiveTab)}
                      className="mt-3 rounded-lg border border-surface-container px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-primary transition hover:bg-white"
                    >
                      Open {label}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.45fr_1fr]">
              <div className="rounded-[2rem] border border-surface-container bg-surface p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-outline">Recent Activity</p>
                    <h3 className="mt-1 text-lg font-extrabold font-headline text-primary">Timeline</h3>
                  </div>
                  <button
                    onClick={() => {
                      setActivityFeed([]);
                      localStorage.removeItem('crmActivityFeed');
                    }}
                    className="rounded-lg border border-surface-container px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-outline hover:text-primary"
                  >
                    Clear
                  </button>
                </div>
                {activityFeed.length ? (
                  <div className="space-y-2">
                    {activityFeed.slice(0, 12).map((item) => (
                      <div key={item.id} className="rounded-xl border border-surface-container bg-background/30 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-primary">{item.action}</p>
                          <p className="text-[10px] text-outline/80">{formatDateTime(item.at)}</p>
                        </div>
                        <p className="mt-1 text-xs text-outline">{item.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-outline">No activity yet.</p>
                )}
              </div>

              <div className="rounded-[2rem] border border-surface-container bg-surface p-6 shadow-sm">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-outline">New Data Monitor</p>
                <h3 className="mt-1 text-2xl font-extrabold font-headline text-primary">Live Indicators</h3>
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    ['Action Queue', newByTab.action_queue],
                    ['Leads', newByTab.leads],
                    ['Contacts', newByTab.contacts],
                    ['Listing Requests', newByTab.listing_requests],
                    ['Properties', newByTab.properties],
                    ...(isAdmin ? ([['Users', newByTab.users]] as Array<[string, number]>) : []),
                  ].map(([label, count]) => (
                    <div key={String(label)} className="inline-flex items-center gap-2 rounded-full border border-surface-container px-3 py-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-primary">{label}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                          Number(count) > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {Number(count) > 0 ? `${count} New` : 'Up To Date'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'users' ? (
          <>
            <div className="rounded-[2rem] border border-surface-container bg-surface p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-outline">Admin Access Only</p>
                  <h3 className="mt-1 text-2xl font-extrabold font-headline text-primary">User Management</h3>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  {filteredUsers.length} Users
                </span>
              </div>

              {!isAdmin ? (
                <p className="text-sm text-outline">Only admin can manage users.</p>
              ) : (
                <>
                  <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(event) => setNewUserEmail(event.target.value)}
                      placeholder="user@nearbyacres.com"
                      className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                    <input
                      type="text"
                      value={newUserPassword}
                      onChange={(event) => setNewUserPassword(event.target.value)}
                      placeholder="Temporary password"
                      className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                    <select
                      value={newUserRole}
                      onChange={(event) => setNewUserRole(event.target.value as UserRole)}
                      className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="SALES">SALES</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                    <button
                      onClick={createUser}
                      className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
                    >
                      Add User
                    </button>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-3">
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search users..."
                      className="min-w-72 rounded-xl border border-surface-container bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="All">All Roles</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SALES">SALES</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                    <button
                      onClick={fetchData}
                      className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm font-bold text-primary transition hover:bg-surface-container/30"
                    >
                      Refresh Users
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-surface-container">
                    <div className="overflow-x-auto bg-white">
                      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                        <thead className="bg-surface/80">
                          <tr className="border-b border-surface-container text-outline">
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Created</th>
                            <th className="px-4 py-3">Updated</th>
                            <th className="px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-b border-surface-container/60">
                              <td className="px-4 py-3 font-semibold text-primary">{user.email}</td>
                              <td className="px-4 py-3">
                                <select
                                  value={user.role}
                                  onChange={(event) => updateUserRole(user.id, event.target.value as UserRole)}
                                  className="rounded-lg border border-surface-container bg-white px-3 py-1.5 text-xs font-bold outline-none"
                                >
                                  <option value="ADMIN">ADMIN</option>
                                  <option value="SALES">SALES</option>
                                  <option value="VIEWER">VIEWER</option>
                                </select>
                              </td>
                              <td className="px-4 py-3">{formatDateTime(user.createdAt)}</td>
                              <td className="px-4 py-3">{formatDateTime(user.updatedAt)}</td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => deleteUser(user.id, user.email)}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-700"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { label: 'Total Leads', value: stats.totalLeads, icon: 'groups' },
                { label: 'Active Properties', value: stats.totalProperties, icon: 'home_work' },
                { label: 'Closed Deals', value: stats.closed, icon: 'verified' },
              ].map((item) => (
                <div key={item.label} className="rounded-[2rem] border border-surface-container bg-surface p-6 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </div>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-outline">{item.label}</p>
                  <h3 className="text-3xl font-extrabold font-headline text-primary">{item.value}</h3>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-surface-container bg-surface shadow-lg">
              <div className="flex flex-col gap-4 border-b border-surface-container bg-surface/40 p-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h3 className="text-2xl font-extrabold font-headline text-primary">{title}</h3>
                  <p className="mt-1 text-sm text-outline">
                    AG Grid local implementation with inline editing, sorting, filtering, and CRM actions.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={`Search ${activeTab === 'properties' ? 'properties' : 'CRM records'}...`}
                    className="min-w-72 rounded-xl border border-surface-container bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-primary"
                  />

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-xl border border-surface-container bg-white/70 px-4 py-3 text-sm font-bold outline-none"
                  >
                    <option value="All">All Status</option>
                    {(activeTab === 'properties' ? propertyStatusOptions : crmStatusOptions).map((value) => (
                      <option key={value} value={activeTab === 'properties' ? value.charAt(0) + value.slice(1).toLowerCase() : value}>
                        {value}
                      </option>
                    ))}
                  </select>

                  {activeTab !== 'properties' && (
                    <select
                      value={sourceFilter}
                      onChange={(event) => setSourceFilter(event.target.value)}
                      className="rounded-xl border border-surface-container bg-white/70 px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="All">All Sources</option>
                      {crmSourceOptions.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                  )}

                  {activeTab !== 'properties' ? (
                    <>
                      <button
                        onClick={exportLeads}
                        className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm font-bold text-primary transition hover:bg-surface-container/30"
                      >
                        Export CSV
                      </button>
                      {['leads', 'contacts', 'listing_requests'].includes(activeTab) && (
                        <button
                          onClick={openQuickAdd}
                          disabled={!canWrite}
                          className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Add {activeTab === 'leads' ? 'Lead' : activeTab === 'contacts' ? 'Contact' : 'Request'}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={exportProperties}
                        className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm font-bold text-primary transition hover:bg-surface-container/30"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProperty(null);
                          setIsModalOpen(true);
                        }}
                        disabled={!canWrite}
                        className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Add Property
                      </button>
                    </>
                  )}

                  <button
                    onClick={saveCurrentView}
                    className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm font-bold text-primary transition hover:bg-surface-container/30"
                  >
                    Save View
                  </button>
                  <button
                    onClick={loadCurrentView}
                    className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm font-bold text-primary transition hover:bg-surface-container/30"
                  >
                    Load View
                  </button>
                  <button
                    onClick={resetCurrentView}
                    className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm font-bold text-primary transition hover:bg-surface-container/30"
                  >
                    Reset View
                  </button>
                </div>
              </div>

              <div className="border-b border-surface-container bg-background/40 px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                    {selectedRowIds.length} Selected
                  </span>
                  <button
                    onClick={runBulkDelete}
                    disabled={!selectedRowIds.length || !canWrite}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-700 disabled:opacity-40"
                  >
                    Bulk Delete
                  </button>
                  {(activeTab === 'contacts' || activeTab === 'listing_requests') && (
                    <button
                      onClick={runBulkConvert}
                      disabled={!selectedRowIds.length || !canWrite}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700 disabled:opacity-40"
                    >
                      Bulk Convert
                    </button>
                  )}
                  <select
                    value={bulkStatusValue}
                    onChange={(event) => setBulkStatusValue(event.target.value)}
                    disabled={!canWrite}
                    className="rounded-lg border border-surface-container bg-white px-3 py-2 text-[11px] font-bold"
                  >
                    {(activeTab === 'properties' ? propertyStatusOptions : crmStatusOptions).map((value) => (
                      <option key={value} value={activeTab === 'properties' ? value.charAt(0) + value.slice(1).toLowerCase() : value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={runBulkStatusUpdate}
                    disabled={!selectedRowIds.length || !canWrite}
                    className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-sky-700 disabled:opacity-40"
                  >
                    Apply Status
                  </button>
                  {activeTab !== 'properties' && (
                    <>
                      <select
                        value={bulkSourceValue}
                        onChange={(event) => setBulkSourceValue(event.target.value)}
                        disabled={!canWrite}
                        className="rounded-lg border border-surface-container bg-white px-3 py-2 text-[11px] font-bold"
                      >
                        {crmSourceOptions.map((source) => (
                          <option key={source} value={source}>
                            {source}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={runBulkSourceUpdate}
                        disabled={!selectedRowIds.length || !canWrite}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 disabled:opacity-40"
                      >
                        Apply Source
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="overflow-hidden rounded-[1.75rem] border border-surface-container">
                  <div style={{ height: 680, width: '100%' }}>
                    {activeTab === 'properties' ? (
                      <AgGridReact
                        columnDefs={propertyColumnDefs}
                        defaultColDef={defaultColDef}
                        getRowId={(params) => String(params.data.id)}
                        onCellValueChanged={handlePropertyCellValueChanged}
                        pagination
                        paginationPageSize={12}
                        quickFilterText={searchTerm}
                        rowData={filteredProperties}
                        rowSelection="multiple"
                        rowHeight={56}
                        onGridReady={(params) => setPropertyGridApi(params.api)}
                        onSelectionChanged={(event) =>
                          setSelectedRowIds(
                            ((event.api.getSelectedRows?.() || []) as any[]).map((row) => row.id),
                          )
                        }
                        theme={quartzTheme}
                      />
                    ) : (
                      <AgGridReact
                        columnDefs={crmColumnDefs}
                        defaultColDef={defaultColDef}
                        getRowId={(params) => String(params.data.id)}
                        onCellValueChanged={handleCrmCellValueChanged}
                        pagination
                        paginationPageSize={12}
                        quickFilterText={searchTerm}
                        rowData={filteredCrmRows}
                        rowSelection="multiple"
                        rowHeight={64}
                        singleClickEdit
                        onGridReady={(params) => setCrmGridApi(params.api)}
                        onSelectionChanged={(event) =>
                          setSelectedRowIds(
                            ((event.api.getSelectedRows?.() || []) as any[]).map((row) => row.id),
                          )
                        }
                        theme={quartzTheme}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {pendingDeletes.length > 0 && (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[70] w-[min(92vw,360px)] space-y-2">
          {pendingDeletes.slice(0, 3).map((item) => (
            <div key={item.key} className="pointer-events-auto rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">Delete Pending</p>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">
                  {Math.max(0, Math.ceil((item.expiresAt - nowMs) / 1000))}s
                </span>
              </div>
              <p className="mb-3 text-xs text-amber-900">#{formatDisplayId(item.id)} will be deleted.</p>
              <button
                onClick={() => undoDelete(item.key)}
                className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700"
              >
                Undo
              </button>
            </div>
          ))}
        </div>
      )}

      <AddPropertyModal
        initialData={selectedProperty}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProperty(null);
        }}
        onRefresh={fetchData}
      />

      {isQuickAddOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-surface-container bg-surface p-6 shadow-2xl">
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-outline">Quick Add</p>
              <h3 className="mt-1 text-2xl font-extrabold font-headline text-primary">
                Add {activeTab === 'leads' ? 'Lead' : activeTab === 'contacts' ? 'Contact' : 'Listing Request'}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={quickAddForm.customerName}
                onChange={(event) => setQuickAddForm((prev) => ({ ...prev, customerName: event.target.value }))}
                placeholder="Customer name"
                className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
              <input
                value={quickAddForm.phone}
                onChange={(event) => setQuickAddForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Phone"
                className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
              <input
                value={quickAddForm.email}
                onChange={(event) => setQuickAddForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Email (optional)"
                className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm outline-none transition focus:border-primary md:col-span-2"
              />
              <textarea
                value={quickAddForm.requirementText}
                onChange={(event) => setQuickAddForm((prev) => ({ ...prev, requirementText: event.target.value }))}
                placeholder="Requirement"
                rows={4}
                className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm outline-none transition focus:border-primary md:col-span-2"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="rounded-xl border border-surface-container bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-outline"
              >
                Cancel
              </button>
              <button
                onClick={createCrmRecord}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
