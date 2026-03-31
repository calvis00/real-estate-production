'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AddPropertyModal from '@/components/AddPropertyModal';

export default function CRMDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [listingRequests, setListingRequests] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'properties' | 'contacts' | 'listing_requests'>('leads');
  
  // Persistent Tab State
  useEffect(() => {
    const savedTab = localStorage.getItem('crmActiveTab') as any;
    const validTabs = ['leads', 'properties', 'contacts', 'listing_requests'];
    if (savedTab && validTabs.includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('crmActiveTab', activeTab);
    
    // Auto-set the source filter when switching to specialized tabs
    if (activeTab === 'contacts') {
      setSourceFilter('NAV_CONTACT');
    } else if (activeTab === 'listing_requests') {
      setSourceFilter('NAV_LISTING_REQUEST');
    } else if (activeTab === 'leads') {
      setSourceFilter('All');
    }
    
    setStatusFilter('All'); // Reset filter on tab change
  }, [activeTab]);

  // Handle Click Outside to close menu
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.property-action-menu') && !target.closest('.property-action-button')) {
        setOpenPropertyMenuId(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [openPropertyMenuId, setOpenPropertyMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [stats, setStats] = useState({ totalLeads: 0, totalProperties: 0, closed: 0 });
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [leadsRes, contactsRes, listingRes, propsRes] = await Promise.all([
        fetch('http://localhost:8081/api/leads', { credentials: 'include', cache: 'no-store' }),
        fetch('http://localhost:8081/api/contacts', { credentials: 'include', cache: 'no-store' }),
        fetch('http://localhost:8081/api/listing-requests', { credentials: 'include', cache: 'no-store' }),
        fetch('http://localhost:8081/api/properties', { cache: 'no-store' })
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
        totalLeads: (leadsData.data || []).length + (contactsData.data || []).length + (listingData.data || []).length,
        totalProperties: (propsData.data || []).length,
        closed: (leadsData.data || []).filter((l: any) => l.status === 'CLOSED').length
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      router.push('/crm/login');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch('http://localhost:8081/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/crm/login');
  };

  const deleteLead = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    const endpoint = activeTab === 'contacts' ? 'contacts' : 
                    activeTab === 'listing_requests' ? 'listing-requests' : 
                    'leads';
    try {
      const res = await fetch(`http://localhost:8081/api/${endpoint}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        if (activeTab === 'leads') setLeads(leads.filter(l => l.id !== id));
        if (activeTab === 'contacts') setContacts(contacts.filter(c => c.id !== id));
        if (activeTab === 'listing_requests') setListingRequests(listingRequests.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const updateLeadField = async (id: string | number, field: string, value: any) => {
    const endpoint = activeTab === 'contacts' ? 'contacts' : 
                    activeTab === 'listing_requests' ? 'listing-requests' : 
                    'leads';
    try {
      await fetch(`http://localhost:8081/api/${endpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
        credentials: 'include'
      });
      if (activeTab === 'leads') setLeads(leads.map(l => l.id === id ? { ...l, [field]: value } : l));
      if (activeTab === 'contacts') setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
      if (activeTab === 'listing_requests') setListingRequests(listingRequests.map(r => r.id === id ? { ...r, [field]: value } : r));
    } catch (err) {
      console.error(`Update ${field} failed:`, err);
    }
  };

  const deleteProperty = async (id: string | number) => {
    if (!window.confirm('Delete this property permanently? This action cannot be undone.')) return;
    try {
      const res = await fetch(`http://localhost:8081/api/properties/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setProperties(properties.filter(p => p.id !== id));
        setOpenPropertyMenuId(null);
      }
    } catch (err) {
      console.error('Delete property failed:', err);
    }
  };

  const setPropertyStatus = async (id: string | number, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:8081/api/properties/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });
      if (res.ok) {
        setProperties(properties.map(p => p.id === id ? { ...p, status: newStatus } : p));
        setOpenPropertyMenuId(null);
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const openEditModal = (property: any) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
    setOpenPropertyMenuId(null);
  };

  const exportLeads = () => {
    const headers = ['ID', 'Customer', 'Phone', 'Source', 'Requirement', 'Status', 'Priority', 'CreatedAt', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map((l: any) => [
        `"#${l.id}"`,
        `"${l.customerName || ''}"`,
        `"${l.phone || ''}"`,
        `"${l.source || ''}"`,
        `"${(l.requirementText || '').replace(/"/g, '""')}"`,
        `"${l.status || ''}"`,
        `"${l.priority || ''}"`,
        `"${new Date(l.createdAt).toLocaleDateString()}"`,
        `"${(l.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredLeads = (() => {
    const dataSet = activeTab === 'contacts' ? contacts : 
                    activeTab === 'listing_requests' ? listingRequests : 
                    leads;
    
    return dataSet.filter(l => {
      const matchesSearch = (l.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.phone || '').includes(searchTerm) ||
        (l.requirementText || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
      const matchesSource = sourceFilter === 'All' || l.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
  })();

  const filteredProperties = properties.filter(p => {
    const matchesSearch = (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.locality || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === (statusFilter === 'Draft' ? 'DRAFT' : statusFilter.toUpperCase());
    return matchesSearch && matchesStatus;
  });

  const getBudgetDisplay = (val: number) => {
    if (!val) return { num: 0, unit: 'L' };
    if (val >= 10000000) return { num: val / 10000000, unit: 'Cr' };
    return { num: val / 100000, unit: 'L' };
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      <p className="text-outline font-bold tracking-widest uppercase text-[10px]">Verifying Credentials...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      {/* Topbar */}
      <div className="bg-surface/95 backdrop-blur-md border-b border-surface-container sticky top-0 z-40">
        <div className="w-full px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-extrabold font-headline text-primary tracking-tighter uppercase whitespace-nowrap">CRM <span className="text-secondary">Portal</span></h2>
            <div className="h-6 w-px bg-surface-container" />
            <div className="flex items-center gap-8">
              <button
                onClick={() => setActiveTab('leads')}
                className={`text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'leads' ? 'text-primary scale-110' : 'text-outline hover:text-primary'}`}
              >
                Leads
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'contacts' ? 'text-primary scale-110' : 'text-outline hover:text-primary'}`}
              >
                Contacts
              </button>
              <button
                onClick={() => setActiveTab('listing_requests')}
                className={`text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'listing_requests' ? 'text-primary scale-110' : 'text-outline hover:text-primary'}`}
              >
                Listing Requests
              </button>
              <button
                onClick={() => setActiveTab('properties')}
                className={`text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'properties' ? 'text-primary scale-110' : 'text-outline hover:text-primary'}`}
              >
                Properties
              </button>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center text-outline hover:text-red-500 transition-all text-xs font-bold gap-2">
            <span className="material-symbols-outlined text-sm">logout</span>
            Logout
          </button>
        </div>
      </div>

      <main className="flex-1 w-full px-8 py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Total Leads', val: stats.totalLeads, icon: 'groups', color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Active Properties', val: stats.totalProperties, icon: 'home_work', color: 'text-primary', bg: 'bg-primary/5' },
            { label: 'Closed Deals', val: stats.closed, icon: 'verified', color: 'text-green-600', bg: 'bg-green-50' },
          ].map((s, i) => (
            <div key={i} className="bg-surface p-6 rounded-[2rem] border border-surface-container shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group/card">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} transition-transform group-hover/card:scale-110`}>
                  <span className="material-symbols-outlined text-xl">{s.icon}</span>
                </div>
              </div>
              <p className="text-outline text-[9px] font-bold mb-1 uppercase tracking-[0.2em]">{s.label}</p>
              <h3 className="text-3xl font-extrabold font-headline text-primary">{s.val}</h3>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-surface rounded-[2.5rem] overflow-hidden border border-surface-container shadow-lg">
          <div className="p-8 border-b border-surface-container flex flex-col md:flex-row justify-between items-center gap-6 bg-surface/30">
            <h3 className="text-2xl font-extrabold font-headline text-primary">
              {activeTab === 'leads' ? 'General Enquiries' : 
               activeTab === 'contacts' ? 'Contact Enquiries' :
               activeTab === 'listing_requests' ? 'Property Listing Requests' :
               'Property Inventory'}
            </h3>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 text-sm">search</span>
                <input
                  placeholder={`Search ${activeTab === 'properties' ? 'Properties' : 'Leads'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-surface border border-surface-container rounded-xl py-3 pl-10 pr-4 text-xs w-full focus:outline-none focus:border-primary transition-all shadow-inner bg-white/50"
                />
              </div>
              {activeTab !== 'properties' ? (
                <>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-surface border border-surface-container rounded-xl px-4 py-3 text-xs font-bold focus:outline-none"
                  >
                    <option value="All">All Status</option>
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="NEED_TO_RECALL">Call Again</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="bg-surface border border-surface-container rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition-all border-dashed border-primary/40 ring-1 ring-primary/5"
                  >
                    <option value="All">All Sources</option>
                    <option value="NAV_CONTACT">Web Contact</option>
                    <option value="NAV_LISTING_REQUEST">Web Listing</option>
                    <option value="WEBSITE">Direct (Legacy)</option>
                    <option value="PHONE">Phone Lead</option>
                  </select>
                  <button
                    onClick={exportLeads}
                    className="bg-surface border border-surface-container text-primary px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-surface-container/50 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export
                  </button>
                </>
              ) : (
                <>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-surface border border-surface-container rounded-xl px-4 py-3 text-xs font-bold focus:outline-none"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Sold">Sold</option>
                    <option value="Hidden">Hidden</option>
                    <option value="Draft">Draft</option>
                  </select>
                  <button
                    onClick={() => { setSelectedProperty(null); setIsModalOpen(true); }}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-opacity-95 transition-all shadow-lg active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Add Property
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {activeTab !== 'properties' ? (
              /*
               * LEADS TABLE
               * Total = 100%
               * ID:3  Date:5  Name:9  Phone:8  Source:7  Requirement:15  Budget:7  Priority:6  Follow-up:8  Status:8  Notes:17  Del:2
               * All columns use text-center; Requirement & Notes left-align for readability.
               */
              <table className="w-full text-left table-fixed border-collapse border border-surface-container">
                <thead>
                  <tr className="bg-surface/50 text-xs font-black uppercase tracking-wider text-outline">
                    <th className="px-2 py-4 w-[3%]  text-center border border-surface-container">ID</th>
                    <th className="px-2 py-4 w-[5%]  text-center border border-surface-container">Date</th>
                    <th className="px-2 py-4 w-[9%]  text-center border border-surface-container">Name</th>
                    <th className="px-2 py-4 w-[8%]  text-center border border-surface-container">Phone</th>
                    <th className="px-2 py-4 w-[7%]  text-center border border-surface-container">Source</th>
                    <th className="px-2 py-4 w-[13%] text-center border border-surface-container">Requirement</th>
                    <th className="px-2 py-4 w-[13%] text-center border border-surface-container">Budget</th>
                    <th className="px-2 py-4 w-[6%]  text-[#D4AF37] font-black text-center border border-surface-container">Priority</th>
                    <th className="px-2 py-4 w-[8%]  text-center border border-surface-container">Follow-up</th>
                    <th className="px-2 py-4 w-[8%]  text-center border border-surface-container">Status</th>
                    <th className="px-2 py-4 w-[17%] text-center border border-surface-container">Notes</th>
                    <th className="px-2 py-4 w-[2%]  text-center border border-surface-container"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {filteredLeads.map((l: any) => {
                    const minDetails = getBudgetDisplay(l.budgetMin);
                    const maxDetails = getBudgetDisplay(l.budgetMax);
                    return (
                      <tr key={l.id} className="hover:bg-surface/50 transition-colors group align-top">

                        {/* ID */}
                        <td className="px-2 py-3 text-xs font-black text-primary/40 font-mono text-center border border-surface-container">
                          {l.id}
                        </td>

                        {/* Date */}
                        <td className="px-2 py-3 text-center border border-surface-container">
                          <span className="text-xs font-bold text-outline">
                            {new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="px-2 py-3 border border-surface-container">
                          <span className="font-bold text-xs text-primary block truncate">{l.customerName}</span>
                        </td>

                        {/* Phone */}
                        <td className="px-2 py-3 font-bold text-xs text-primary border border-surface-container text-center">
                          {l.phone}
                        </td>

                        {/* Source — IMPROVED */}
                        <td className="px-2 py-3 border border-surface-container text-center">
                          <select
                            value={l.source || ''}
                            onChange={(e) => updateLeadField(l.id, 'source', e.target.value)}
                            className={`text-[10px] font-black w-full px-1 py-1 rounded-lg uppercase tracking-tight bg-surface-container/20 border-none focus:ring-0 cursor-pointer ${
                              l.source === 'NAV_CONTACT' ? 'text-indigo-600 bg-indigo-50' :
                              l.source === 'NAV_LISTING_REQUEST' ? 'text-emerald-500 bg-emerald-50' :
                              'text-outline'
                            }`}
                          >
                            <option value="">—</option>
                            <option value="NAV_CONTACT">Web Contact</option>
                            <option value="NAV_LISTING_REQUEST">Web Listing</option>
                            <option value="WALK_IN">Walk-in</option>
                            <option value="PHONE">Phone</option>
                            <option value="WEBSITE">Direct</option>
                            <option value="REFERRAL">Referral</option>
                          </select>
                        </td>

                        {/* Requirement */}
                        <td className="px-2 py-3 border border-surface-container">
                          <p className="text-xs text-outline font-medium leading-relaxed break-words line-clamp-2">
                            {l.requirementText || `Interested in ${l.propertyType || 'Any'}`}
                          </p>
                        </td>

                        {/* Budget */}
                        <td className="px-2 py-3 border border-surface-container">
                          <div className="flex items-center gap-1 justify-center flex-nowrap whitespace-nowrap">
                            {/* Min */}
                            <div className="flex items-center gap-0.5 bg-surface-container/10 rounded px-1 py-0.5 border border-surface-container/20">
                              <input
                                type="number" step="0.01"
                                className="w-8 bg-transparent text-xs font-black border-none p-0 text-right focus:ring-0 appearance-none text-primary"
                                value={minDetails.num}
                                onChange={(e) => {
                                  const mult = minDetails.unit === 'Cr' ? 10000000 : 100000;
                                  updateLeadField(l.id, 'budgetMin', Number(e.target.value) * mult);
                                }}
                              />
                              <select
                                value={minDetails.unit}
                                onChange={(e) => {
                                  const mult = e.target.value === 'Cr' ? 10000000 : 100000;
                                  updateLeadField(l.id, 'budgetMin', minDetails.num * mult);
                                }}
                                className="bg-transparent border-none text-xs font-black p-0 focus:ring-0 text-primary/40 cursor-pointer"
                              >
                                <option value="L">L</option><option value="Cr">Cr</option>
                              </select>
                            </div>
                            <span className="text-xs font-black text-outline/50">–</span>
                            {/* Max */}
                            <div className="flex items-center gap-0.5 bg-surface-container/10 rounded px-1 py-0.5 border border-surface-container/20">
                              <input
                                type="number" step="0.01"
                                className="w-8 bg-transparent text-xs font-black border-none p-0 text-right focus:ring-0 appearance-none text-primary"
                                value={maxDetails.num}
                                onChange={(e) => {
                                  const mult = maxDetails.unit === 'Cr' ? 10000000 : 100000;
                                  updateLeadField(l.id, 'budgetMax', Number(e.target.value) * mult);
                                }}
                              />
                              <select
                                value={maxDetails.unit}
                                onChange={(e) => {
                                  const mult = e.target.value === 'Cr' ? 10000000 : 100000;
                                  updateLeadField(l.id, 'budgetMax', maxDetails.num * mult);
                                }}
                                className="bg-transparent border-none text-xs font-black p-0 focus:ring-0 text-primary/40 cursor-pointer"
                              >
                                <option value="L">L</option><option value="Cr">Cr</option>
                              </select>
                            </div>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-2 py-3 text-center border border-surface-container">
                          <select
                            value={l.priority}
                            onChange={(e) => updateLeadField(l.id, 'priority', e.target.value)}
                            className={`text-xs font-black px-1 py-1 rounded-md uppercase border-none focus:ring-0 cursor-pointer w-full ${l.priority === 'HIGH' ? 'bg-red-50 text-red-500' : l.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-500'}`}
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Med</option>
                            <option value="HIGH">High</option>
                          </select>
                        </td>

                        {/* Follow-up */}
                        <td className="px-2 py-3 text-center border border-surface-container">
                          <input
                            type="date"
                            value={l.nextFollowUpDate ? l.nextFollowUpDate.split('T')[0] : ''}
                            onChange={(e) => updateLeadField(l.id, 'nextFollowUpDate', e.target.value)}
                            className={`bg-transparent border rounded-lg px-1 py-0.5 text-xs font-bold focus:ring-0 w-full transition-all ${l.status === 'NEED_TO_RECALL'
                              ? 'border-primary text-primary bg-primary/5'
                              : 'border-transparent text-outline opacity-40 hover:opacity-100 font-medium'
                              }`}
                          />
                        </td>

                        {/* Status */}
                        <td className="px-2 py-3 text-center border border-surface-container">
                          <select
                            value={l.status}
                            onChange={(e) => updateLeadField(l.id, 'status', e.target.value)}
                            className={`text-xs font-black w-full px-1 py-1 rounded-lg uppercase tracking-tighter bg-surface-container/20 border-none focus:ring-0 cursor-pointer ${l.status === 'NEW' ? 'text-primary' :
                              l.status === 'CLOSED' ? 'text-green-600' :
                                l.status === 'IN_PROGRESS' ? 'text-blue-500' :
                                  l.status === 'NEED_TO_RECALL' ? 'text-primary ring-1 ring-primary/20' :
                                    'text-outline'
                              }`}
                          >
                            <option value="NEW">New</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="NEED_TO_RECALL">Call Again</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        </td>

                        {/* Notes */}
                        <td className="px-2 py-3 border border-surface-container">
                          <textarea
                            value={l.notes || ''}
                            onChange={(e) => updateLeadField(l.id, 'notes', e.target.value)}
                            placeholder="Notes..."
                            className="w-full bg-surface-container/5 hover:bg-surface-container/10 border border-transparent focus:border-primary/20 rounded-xl p-1.5 text-xs text-outline resize-none focus:outline-none transition-all h-14 break-words"
                          />
                        </td>

                        {/* Delete */}
                        <td className="px-2 py-3 text-center border border-surface-container">
                          <button onClick={() => deleteLead(l.id)} className="text-outline hover:text-red-500 transition-colors p-0.5 hover:bg-red-50 rounded-lg">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* PROPERTIES TABLE — unchanged */
              <table className="w-full text-left table-fixed border-collapse border border-surface-container">
                <thead>
                  <tr className="bg-surface/50 text-[10px] font-black uppercase tracking-wider text-outline">
                    <th className="px-8 py-5 w-[28%] text-center border border-surface-container">Property</th>
                    <th className="px-8 py-5 w-[8%] text-center border border-surface-container">Date</th>
                    <th className="px-8 py-5 w-[17%] text-center border border-surface-container">Location</th>
                    <th className="px-8 py-5 w-[12%] text-center border border-surface-container">Status</th>
                    <th className="px-8 py-5 w-[15%] text-center border border-surface-container">Price</th>
                    <th className="px-8 py-5 w-[10%] text-center border border-surface-container">Rate/Sqft</th>
                    <th className="px-8 py-5 text-center w-[10%] border border-surface-container">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {filteredProperties.map((p: any) => (
                    <tr key={p.id} className="hover:bg-surface transition-colors">
                      <td className="px-8 py-5 border border-surface-container">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img 
                              src={(p.images && p.images.length > 0) ? p.images[0] : "/placeholder.png"} 
                              className="w-14 h-14 rounded-xl object-cover border border-surface-container shadow-sm" 
                              alt="" 
                              onError={(e: any) => { e.target.src = "/placeholder.png"; }}
                            />
                            {p.videos && p.videos.length > 0 && (
                              <div className="absolute -bottom-1 -right-1 bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface">
                                <span className="material-symbols-outlined text-[10px]">videocam</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-primary">{p.title}</span>
                            <span className="text-[9px] font-bold text-outline uppercase tracking-widest">
                              {p.images?.length || 0} Photos • {p.videos?.length || 0} Videos
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center border border-surface-container">
                        <span className="text-xs font-bold text-outline">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-outline uppercase tracking-wider border border-surface-container text-center">
                        {p.locality || p.location}, {p.city || 'Tamil Nadu'}
                      </td>
                      <td className="px-8 py-5 text-center border border-surface-container">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            p.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border border-green-200' : 
                            p.status === 'SOLD' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                            p.status === 'DRAFT' ? 'bg-slate-100 text-slate-500 border border-slate-300' :
                            'bg-red-50 text-red-500 border border-red-200'
                        }`}>
                          {p.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-primary border border-surface-container text-center">
                        {p.price >= 10000000 ? `₹${(p.price / 10000000).toFixed(2)} Cr` :
                          p.price >= 100000 ? `₹${(p.price / 100000).toFixed(2)} L` :
                            `₹${p.price?.toLocaleString()}`}
                      </td>
                      <td className="px-8 py-5 text-xs font-black text-outline/60 border border-surface-container text-center">
                        {p.price && p.areaSqft ? `₹${Math.round(p.price / p.areaSqft).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-8 py-5 text-center border border-surface-container relative">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenPropertyMenuId(openPropertyMenuId === p.id ? null : p.id);
                            }}
                            className="p-2 rounded-lg hover:bg-surface-container/20 text-outline hover:text-primary transition-all property-action-button"
                        >
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                        
                        {openPropertyMenuId === p.id && (
                            <div className="absolute right-12 top-10 w-48 bg-surface border border-surface-container rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 property-action-menu">
                                <button 
                                    onClick={() => openEditModal(p)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase text-outline hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                    Edit Details
                                </button>
                                <button 
                                    onClick={() => setPropertyStatus(p.id, p.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE')}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase text-outline hover:text-secondary hover:bg-secondary/5 rounded-xl transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">{p.status === 'ACTIVE' ? 'visibility_off' : 'visibility'}</span>
                                    {p.status === 'ACTIVE' ? 'Hide Listing' : 'Make Active'}
                                </button>
                                <button 
                                    onClick={() => setPropertyStatus(p.id, 'SOLD')}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase text-outline hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">sell</span>
                                    Mark as Sold
                                </button>
                                <div className="h-px bg-surface-container my-1 mx-2" />
                                <button 
                                    onClick={() => deleteProperty(p.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                    Delete Record
                                </button>
                            </div>
                        )}
                        
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <AddPropertyModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedProperty(null); }}
        onRefresh={fetchData}
        initialData={selectedProperty}
      />
    </div>
  );
}
