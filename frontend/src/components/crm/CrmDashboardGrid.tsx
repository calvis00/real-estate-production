'use client';

import React, { useEffect, useState } from 'react';
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
import { apiUrl } from '@/utils/api';

ModuleRegistry.registerModules([AllCommunityModule]);

type ActiveTab = 'leads' | 'properties' | 'contacts' | 'listing_requests';

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

function CrmActionCell({
  data,
  activeTab,
  onDelete,
  onConvert,
}: {
  data: any;
  activeTab: ActiveTab;
  onDelete: (id: string | number) => void;
  onConvert: (id: string | number) => void;
}) {
  return (
    <div className="flex h-full items-center gap-2 py-2">
      {activeTab !== 'leads' && (
        <button
          onClick={() => onConvert(data.id)}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 transition hover:bg-emerald-100"
        >
          Convert
        </button>
      )}
      <button
        onClick={() => onDelete(data.id)}
        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 transition hover:bg-rose-100"
      >
        Delete
      </button>
    </div>
  );
}

function PropertyActionCell({
  data,
  onEdit,
  onStatus,
  onDelete,
}: {
  data: any;
  onEdit: (property: any) => void;
  onStatus: (id: string | number, status: string) => void;
  onDelete: (id: string | number) => void;
}) {
  return (
    <div className="flex h-full flex-wrap items-center gap-2 py-2">
      <button
        onClick={() => onEdit(data)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 transition hover:border-primary hover:text-primary"
      >
        Edit
      </button>
      <button
        onClick={() => onStatus(data.id, data.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE')}
        className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 transition hover:bg-amber-100"
      >
        {data.status === 'ACTIVE' ? 'Hide' : 'Activate'}
      </button>
      <button
        onClick={() => onStatus(data.id, 'SOLD')}
        className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 transition hover:bg-sky-100"
      >
        Sold
      </button>
      <button
        onClick={() => onDelete(data.id)}
        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 transition hover:bg-rose-100"
      >
        Delete
      </button>
    </div>
  );
}

function FollowUpCell({
  data,
  onUpdate,
}: {
  data: any;
  onUpdate: (id: string | number, field: string, value: any) => void;
}) {
  const followUpState = getFollowUpState(data.nextFollowUpDate);

  return (
    <div className="flex h-full items-center gap-2 py-2">
      <input
        type="date"
        value={formatDateInput(data.nextFollowUpDate)}
        onChange={(event) => {
          const nextValue = event.target.value
            ? new Date(`${event.target.value}T09:00:00`).toISOString()
            : null;
          onUpdate(data.id, 'nextFollowUpDate', nextValue);
        }}
        className="w-full min-w-[136px] rounded-lg border border-surface-container bg-white px-2 py-1 text-xs text-on-surface outline-none transition focus:border-primary"
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

export default function CrmDashboardGrid() {
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [listingRequests, setListingRequests] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('leads');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [stats, setStats] = useState({ totalLeads: 0, totalProperties: 0, closed: 0 });
  const router = useRouter();

  useEffect(() => {
    const savedTab = localStorage.getItem('crmActiveTab') as ActiveTab | null;
    if (savedTab && ['leads', 'properties', 'contacts', 'listing_requests'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('crmActiveTab', activeTab);
    setStatusFilter('All');
    setSourceFilter('All');
    setSearchTerm('');
  }, [activeTab]);

  async function fetchData() {
    try {
      const [leadsRes, contactsRes, listingRes, propsRes] = await Promise.all([
        fetch(apiUrl('/api/leads'), { credentials: 'include', cache: 'no-store' }),
        fetch(apiUrl('/api/contacts'), { credentials: 'include', cache: 'no-store' }),
        fetch(apiUrl('/api/listing-requests'), { credentials: 'include', cache: 'no-store' }),
        fetch(apiUrl('/api/properties'), { credentials: 'include', cache: 'no-store' }),
      ]);

      if (leadsRes.status === 401) {
        router.push('/crm/login');
        return;
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

  async function handleLogout() {
    await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    router.push('/crm/login');
  }

  async function deleteLead(id: string | number) {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;

    const endpoint =
      activeTab === 'contacts' ? 'contacts' : activeTab === 'listing_requests' ? 'listing-requests' : 'leads';

    const res = await fetch(apiUrl(`/api/${endpoint}/${id}`), {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) return;

    if (activeTab === 'leads') setLeads((current) => current.filter((lead) => lead.id !== id));
    if (activeTab === 'contacts') setContacts((current) => current.filter((contact) => contact.id !== id));
    if (activeTab === 'listing_requests') {
      setListingRequests((current) => current.filter((request) => request.id !== id));
    }
  }

  async function updateLeadField(id: string | number, field: string, value: any) {
    const endpoint =
      activeTab === 'contacts' ? 'contacts' : activeTab === 'listing_requests' ? 'listing-requests' : 'leads';

    await fetch(apiUrl(`/api/${endpoint}/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
  }

  async function convertLead(id: string | number) {
    if (!window.confirm('Move this into the primary Leads pipeline? It will be removed from this tab.')) return;

    const endpoint = activeTab === 'contacts' ? 'contacts' : 'listing-requests';
    const res = await fetch(apiUrl(`/api/${endpoint}/${id}/convert`), {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json();
      window.alert(data.message || 'Conversion failed');
      return;
    }

    await fetchData();
    setActiveTab('leads');
  }

  async function deleteProperty(id: string | number) {
    if (!window.confirm('Delete this property permanently? This action cannot be undone.')) return;
    const res = await fetch(apiUrl(`/api/properties/${id}`), {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) setProperties((current) => current.filter((property) => property.id !== id));
  }

  async function setPropertyStatus(id: string | number, status: string) {
    const res = await fetch(apiUrl(`/api/properties/${id}/status`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      credentials: 'include',
    });
    if (res.ok) {
      setProperties((current) => current.map((property) => (property.id === id ? { ...property, status } : property)));
    }
  }

  function openEditModal(property: any) {
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
          `"${row.id}"`,
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

  const overdueFollowUps = reminderRows.filter((row) => row.followUpState === 'overdue');
  const todayFollowUps = reminderRows.filter((row) => row.followUpState === 'today');

  const defaultColDef: ColDef = {
    editable: false,
    filter: true,
    floatingFilter: true,
    minWidth: 120,
    resizable: true,
    sortable: true,
  };

  const crmColumnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', maxWidth: 90, pinned: 'left', cellClass: numericCellClass },
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
    { field: 'customerName', headerName: 'Customer', editable: true, minWidth: 180, pinned: 'left' },
    { field: 'phone', headerName: 'Phone', editable: true, minWidth: 150, cellClass: numericCellClass },
    { field: 'email', headerName: 'Email', editable: true, minWidth: 220 },
    {
      field: 'source',
      headerName: 'Source',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: crmSourceOptions },
      minWidth: 160,
    },
    { field: 'propertyType', headerName: 'Type', editable: true, minWidth: 140 },
    { field: 'preferredLocation', headerName: 'Preferred Location', editable: true, minWidth: 180 },
    {
      field: 'budgetMin',
      headerName: 'Budget Min',
      cellClass: numericCellClass,
      editable: true,
      valueParser: ({ newValue }) => Number(newValue),
      valueFormatter: ({ value }) => formatMoney(value),
      minWidth: 150,
    },
    {
      field: 'budgetMax',
      headerName: 'Budget Max',
      cellClass: numericCellClass,
      editable: true,
      valueParser: ({ newValue }) => Number(newValue),
      valueFormatter: ({ value }) => formatMoney(value),
      minWidth: 150,
    },
    {
      field: 'status',
      headerName: 'Status',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: crmStatusOptions },
      minWidth: 160,
    },
    {
      field: 'priority',
      headerName: 'Priority',
      editable: true,
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
        <FollowUpCell data={params.data} onUpdate={updateLeadField} />
      ),
    },
    {
      field: 'requirementText',
      headerName: 'Requirement',
      editable: true,
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
      editable: true,
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
          onDelete={deleteLead}
          onConvert={convertLead}
        />
      ),
    },
  ];

  const propertyColumnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', minWidth: 120, pinned: 'left', cellClass: numericCellClass },
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
      editable: true,
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
          onDelete={deleteProperty}
          onEdit={openEditModal}
          onStatus={setPropertyStatus}
        />
      ),
    },
  ];

  const title =
    activeTab === 'leads'
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
              CRM <span className="text-secondary">Portal</span>
            </h2>
            <div className="h-6 w-px bg-surface-container" />
            <div className="flex flex-wrap items-center gap-4">
              {[
                ['leads', 'Leads'],
                ['contacts', 'Contacts'],
                ['listing_requests', 'Listing Requests'],
                ['properties', 'Properties'],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as ActiveTab)}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
                    activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-outline hover:text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-[2rem] border border-surface-container bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-outline">Follow Up Reminders</p>
                <h3 className="mt-1 text-2xl font-extrabold font-headline text-primary">Action Queue</h3>
              </div>
              <div className="flex gap-3 text-xs font-bold uppercase tracking-widest">
                <span className="rounded-full bg-rose-100 px-3 py-2 text-rose-700">{overdueFollowUps.length} Overdue</span>
                <span className="rounded-full bg-amber-100 px-3 py-2 text-amber-700">{todayFollowUps.length} Today</span>
              </div>
            </div>

            {reminderRows.length ? (
              <div className="space-y-3">
                {reminderRows.slice(0, 6).map((row) => (
                  <div
                    key={`${row.source}-${row.id}`}
                    className="flex flex-col gap-2 rounded-2xl border border-surface-container bg-background/60 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-primary">{row.customerName}</p>
                      <p className="text-xs text-outline">
                        {row.phone} {row.preferredLocation ? `• ${row.preferredLocation}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-outline">{row.followUpDateLabel}</span>
                      <span
                        className={`rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
                          row.followUpState === 'overdue'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {row.followUpState}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-surface-container p-6 text-sm text-outline">
                No overdue or due-today follow ups yet. Set a follow-up date in the grid and it will appear here.
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-surface-container bg-surface p-6 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-outline">Reminder Notes</p>
            <h3 className="mt-1 text-2xl font-extrabold font-headline text-primary">How It Works</h3>
            <p className="mt-4 text-sm leading-6 text-outline">
              The follow-up column is now a real date field. When a date becomes due today or slips past due,
              it appears in the reminder queue so the sales team can act on it quickly.
            </p>
          </div>
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
                <button
                  onClick={exportLeads}
                  className="rounded-xl border border-surface-container bg-white px-4 py-3 text-sm font-bold text-primary transition hover:bg-surface-container/30"
                >
                  Export CSV
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedProperty(null);
                    setIsModalOpen(true);
                  }}
                  className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
                >
                  Add Property
                </button>
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
                    onCellValueChanged={handlePropertyCellValueChanged}
                    pagination
                    paginationPageSize={12}
                    quickFilterText={searchTerm}
                    rowData={filteredProperties}
                    rowHeight={56}
                    theme={quartzTheme}
                  />
                ) : (
                  <AgGridReact
                    columnDefs={crmColumnDefs}
                    defaultColDef={defaultColDef}
                    onCellValueChanged={handleCrmCellValueChanged}
                    pagination
                    paginationPageSize={12}
                    quickFilterText={searchTerm}
                    rowData={filteredCrmRows}
                    rowHeight={64}
                    singleClickEdit
                    theme={quartzTheme}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <AddPropertyModal
        initialData={selectedProperty}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProperty(null);
        }}
        onRefresh={fetchData}
      />
    </div>
  );
}
