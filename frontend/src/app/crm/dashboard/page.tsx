'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AddPropertyModal from '@/components/AddPropertyModal';

export default function CRMDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'properties'>('leads');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stats, setStats] = useState({ totalLeads: 0, totalProperties: 0, closed: 0 });
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [leadsRes, propsRes] = await Promise.all([
        fetch('http://localhost:8081/api/leads', { credentials: 'include', cache: 'no-store' }),
        fetch('http://localhost:8081/api/properties', { cache: 'no-store' })
      ]);

      if (leadsRes.status === 401) {
        router.push('/crm/login');
        return;
      }

      const leadsData = await leadsRes.json();
      const propsData = await propsRes.json();

      setLeads(leadsData.data || []);
      setProperties(propsData.data || []);
      setStats({
        totalLeads: (leadsData.data || []).length,
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
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      const res = await fetch(`http://localhost:8081/api/leads/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setLeads(leads.filter(l => l.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const updateLeadField = async (id: string | number, field: string, value: any) => {
    try {
      await fetch(`http://localhost:8081/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
        credentials: 'include'
      });
      setLeads(leads.map(l => l.id === id ? { ...l, [field]: value } : l));
    } catch (err) {
      console.error(`Update ${field} failed:`, err);
    }
  };

  const exportLeads = () => {
    const headers = ['ID', 'Customer', 'Phone', 'Requirement', 'Status', 'Priority', 'CreatedAt', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map((l: any) => [
        `"#${l.id}"`,
        `"${l.customerName || ''}"`,
        `"${l.phone || ''}"`,
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

  const filteredLeads = leads.filter(l => {
    const matchesSearch = (l.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.phone || '').includes(searchTerm) ||
      (l.requirementText || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
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
              {activeTab === 'leads' ? 'Recent Enquiries' : 'Property Inventory'}
            </h3>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 text-sm">search</span>
                <input
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-surface border border-surface-container rounded-xl py-3 pl-10 pr-4 text-xs w-full focus:outline-none focus:border-primary transition-all shadow-inner bg-white/50"
                />
              </div>
              {activeTab === 'leads' && (
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
                  <button
                    onClick={exportLeads}
                    className="bg-surface border border-surface-container text-primary px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-surface-container/50 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export
                  </button>
                </>
              )}
              {activeTab === 'properties' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-opacity-95 transition-all shadow-lg active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Add Property
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed border-collapse border border-surface-container">
              <thead>
                <tr className="bg-surface/50 text-[10px] font-black uppercase tracking-wider text-outline">
                  {activeTab === 'leads' ? (
                    <>
                      <th className="px-1 py-4 w-[3%] text-center border border-surface-container">ID</th>
                      <th className="px-1 py-4 w-[6%] text-center border border-surface-container">Date</th>
                      <th className="px-1 py-4 w-[8%] text-center border border-surface-container">Name</th>
                      <th className="px-1 py-4 w-[8%] text-center border border-surface-container">Phone</th>
                      <th className="px-2 py-4 w-[16%] text-center border border-surface-container">Requirement</th>
                      <th className="px-1 py-4 w-[8%] text-center border border-surface-container">Budget</th>
                      <th className="px-1 py-4 w-[9%] text-[#D4AF37] font-black text-center border border-surface-container">Priority</th>
                      <th className="px-1 py-4 w-[9%] text-center border border-surface-container">Follow-up</th>
                      <th className="px-1 py-4 w-[12%] text-center border border-surface-container">Status</th>
                      <th className="px-2 py-4 w-[19%] text-center border border-surface-container">Notes</th>
                      <th className="px-1 py-4 w-[2%] text-center border border-surface-container"></th>
                    </>
                  ) : (
                    <>
                      <th className="px-8 py-5 w-[40%] text-center border border-surface-container">Property</th>
                      <th className="px-8 py-5 w-[30%] text-center border border-surface-container">Location</th>
                      <th className="px-8 py-5 w-[20%] text-center border border-surface-container">Price</th>
                      <th className="px-8 py-5 text-center w-[10%] border border-surface-container">Action</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {activeTab === 'leads' ? (
                  filteredLeads.map((l: any) => {
                    const minDetails = getBudgetDisplay(l.budgetMin);
                    const maxDetails = getBudgetDisplay(l.budgetMax);
                    return (
                      <tr key={l.id} className="hover:bg-surface/50 transition-colors group align-top">
                        <td className="px-1 py-3 text-[10px] font-black text-primary/40 font-mono text-center border border-surface-container">
                          {l.id}
                        </td>
                        <td className="px-1 py-3 text-center border border-surface-container">
                          <span className="text-[10px] font-bold text-outline">
                            {new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-1 py-3 border border-surface-container">
                          <span className="font-bold text-[11px] text-primary block truncate">{l.customerName}</span>
                        </td>
                        <td className="px-1 py-3 font-bold text-[11px] text-primary border border-surface-container text-center">
                          {l.phone}
                        </td>
                        <td className="px-2 py-3 border border-surface-container">
                          <p className="text-[10px] text-outline font-medium leading-relaxed break-words line-clamp-2">{l.requirementText || `Interested in ${l.propertyType || 'Any'}`}</p>
                        </td>
                        <td className="px-1 py-3 border border-surface-container">
                          <div className="flex flex-col gap-1 items-center">
                            <div className="flex items-center gap-0.5 bg-surface-container/10 rounded px-1 py-0.5 border border-surface-container/20">
                              <input
                                type="number" step="0.01"
                                className="w-8 bg-transparent text-[8px] font-black border-none p-0 text-right focus:ring-0 appearance-none text-primary"
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
                                className="bg-transparent border-none text-[8px] font-black p-0 focus:ring-0 text-primary/30 cursor-pointer"
                              >
                                <option value="L">L</option><option value="Cr">Cr</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-0.5 bg-surface-container/10 rounded px-1 py-0.5 border border-surface-container/20">
                              <input
                                type="number" step="0.01"
                                className="w-8 bg-transparent text-[8px] font-black border-none p-0 text-right focus:ring-0 appearance-none text-primary"
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
                                className="bg-transparent border-none text-[8px] font-black p-0 focus:ring-0 text-primary/30 cursor-pointer"
                              >
                                <option value="L">L</option><option value="Cr">Cr</option>
                              </select>
                            </div>
                          </div>
                        </td>
                        <td className="px-1 py-3 text-center border border-surface-container">
                          <select
                            value={l.priority}
                            onChange={(e) => updateLeadField(l.id, 'priority', e.target.value)}
                            className={`text-[8px] font-black px-1 py-0.5 rounded-md uppercase border-none focus:ring-0 cursor-pointer ${l.priority === 'HIGH' ? 'bg-red-50 text-red-500' : l.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-500'}`}
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Med</option>
                            <option value="HIGH">High</option>
                          </select>
                        </td>
                        <td className="px-1 py-3 text-center border border-surface-container">
                          <input
                            type="date"
                            value={l.nextFollowUpDate ? l.nextFollowUpDate.split('T')[0] : ''}
                            onChange={(e) => updateLeadField(l.id, 'nextFollowUpDate', e.target.value)}
                            className={`bg-transparent border rounded-lg px-1 py-0.5 text-[9px] font-bold focus:ring-0 w-[85px] mx-auto block transition-all ${l.status === 'NEED_TO_RECALL'
                              ? 'border-primary text-primary bg-primary/5'
                              : 'border-transparent text-outline opacity-40 hover:opacity-100 font-medium'
                              }`}
                          />
                        </td>
                        <td className="px-1 py-3 text-center border border-surface-container">
                          <select
                            value={l.status}
                            onChange={(e) => updateLeadField(l.id, 'status', e.target.value)}
                            className={`text-[8px] font-black w-full px-1 py-1 rounded-lg uppercase tracking-tighter bg-surface-container/20 border-none focus:ring-0 cursor-pointer ${l.status === 'NEW' ? 'text-primary' :
                              l.status === 'CLOSED' ? 'text-green-600' :
                                l.status === 'IN_PROGRESS' ? 'text-blue-500' :
                                  l.status === 'NEED_TO_RECALL' ? 'text-primary ring-1 ring-primary/20' :
                                    'text-outline'
                              }`}
                          >
                            <option value="NEW">New</option>
                            <option value="CONTACTED">Cont</option>
                            <option value="IN_PROGRESS">Prog</option>
                            <option value="NEED_TO_RECALL">Call</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        </td>
                        <td className="px-2 py-3 border border-surface-container">
                          <textarea
                            value={l.notes || ''}
                            onChange={(e) => updateLeadField(l.id, 'notes', e.target.value)}
                            placeholder="Notes..."
                            className="w-full bg-surface-container/5 hover:bg-surface-container/10 border border-transparent focus:border-primary/20 rounded-xl p-1.5 text-[11px] text-outline resize-none focus:outline-none transition-all h-14 break-words"
                          />
                        </td>
                        <td className="px-1 py-3 text-center border border-surface-container">
                          <button onClick={() => deleteLead(l.id)} className="text-outline hover:text-red-500 transition-colors p-0.5 hover:bg-red-50 rounded-lg">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  properties.map((p: any) => (
                    <tr key={p.id} className="hover:bg-surface transition-colors">
                      <td className="px-8 py-5 border border-surface-container">
                        <div className="flex items-center gap-4">
                          <img src={p.image || p.imageUrl || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000"} className="w-14 h-14 rounded-xl object-cover border border-surface-container" alt="" />
                          <span className="font-bold text-sm text-primary">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-outline uppercase tracking-wider border border-surface-container text-center">
                        {p.locality || p.location}, {p.city || 'Tamil Nadu'}
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-primary border border-surface-container text-center">
                        {p.price >= 10000000 ? `₹${(p.price / 10000000).toFixed(2)} Cr` :
                          p.price >= 100000 ? `₹${(p.price / 100000).toFixed(2)} L` :
                            `₹${p.price?.toLocaleString()}`}
                      </td>
                      <td className="px-8 py-5 text-center border border-surface-container">
                        <button className="p-2 rounded-lg hover:bg-surface-container/20 text-outline hover:text-primary">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AddPropertyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchData}
      />
    </div>
  );
}
