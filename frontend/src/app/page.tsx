'use client';

import React, { useState, useEffect } from 'react';
import PropertyCard from '@/components/PropertyCard';
import LeadForm from '@/components/LeadForm';
import BudgetSlider from '@/components/BudgetSlider';
import Link from 'next/link';
import { useLang } from '@/i18n/LangContext';
import { apiUrl } from '@/utils/api';

const categoryItems = [
  { icon: 'castle',         id: 'VILLA',       labelKey: 'cat_villa'      },
  { icon: 'apartment',      id: 'APARTMENT',   labelKey: 'cat_apartment'  },
  { icon: 'landscape',      id: 'PLOT',        labelKey: 'cat_plot'       },
  { icon: 'corporate_fare', id: 'COMMERCIAL',  labelKey: 'cat_commercial' },
  { icon: 'park',           id: 'FARMHOUSE',   labelKey: 'cat_farmhouse'  },
] as const;

const tamilDistricts = [
  'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri',
  'Dindigul','Erode','Kallakurichi','Kanchipuram','Kanyakumari','Karur',
  'Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris',
  'Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivaganga',
  'Tenkasi','Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli',
  'Tirupattur','Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur','Vellore',
  'Viluppuram','Virudhunagar',
].sort();

export default function LandingPage() {
  const { t, lang } = useLang();
  const isTamil = lang === 'ta';

  const [activeSearchTab, setActiveSearchTab] = useState<'buy'|'rent'|'shoot'>('buy');
  const [minBudget, setMinBudget] = useState(10);
  const [maxBudget, setMaxBudget] = useState(500);
  const [activeCategory, setActiveCategory] = useState('all');
  const [properties, setProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);

  useEffect(() => {
    fetch(apiUrl('/api/properties'))
      .then(r => r.json())
      .then(d => { setProperties(d.data || []); setFilteredProperties(d.data || []); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const active = properties.filter(p => !p.status || p.status === 'ACTIVE');
    setFilteredProperties(
      activeCategory === 'all'
        ? active
        : active.filter(p =>
            p.category?.toUpperCase() === activeCategory ||
            p.type?.toUpperCase() === activeCategory
          )
    );
  }, [activeCategory, properties]);

  const ta = (cls: string) => isTamil ? `font-['Noto_Serif_Tamil'] ${cls}` : cls;

  const tabs = [
    { id: 'buy'   as const, label: t('tab_buy')   },
    { id: 'rent'  as const, label: t('tab_rent')  },
    { id: 'shoot' as const, label: t('tab_shoot') },
  ];

  return (
    <main className="min-h-screen">

      {/* ── Hero ── */}
      <header className="hero-section flex items-center justify-center px-4 relative">
        <div className="hero-overlay" />
        <div className="relative z-10 w-full max-w-4xl text-center flex flex-col items-center">

          <p className={ta('text-white/70 text-[11px] font-bold uppercase tracking-[0.35em] mb-4')}>
            {t('hero_tag')}
          </p>

          <h1 className="text-white text-4xl md:text-6xl font-extrabold font-headline mb-4 text-shadow tracking-tight">
            {t('hero_h1_1')}{' '}
            <span className={ta('text-secondary')}>{t('hero_h1_accent')}</span>{' '}
            {t('hero_h1_2')}
          </h1>

          <p className={ta('text-white/80 text-base md:text-lg mb-10 font-medium')}>
            {t('hero_sub')}
          </p>

          {/* Search Card */}
          <div className="bg-black/50 p-2 rounded-2xl backdrop-blur-lg golden-edge mx-auto w-full max-w-3xl">
            <div className="bg-background rounded-xl overflow-hidden">

              {/* Tabs */}
              <div className="flex border-b border-slate-300">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSearchTab(tab.id)}
                    className={ta(`flex-1 py-4 text-sm font-bold transition-all ${
                      activeSearchTab === tab.id ? 'search-tab-active' : 'text-gray-500 hover:text-primary'
                    }`)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-8 md:p-12 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 items-start">

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/50 ml-1">{t('field_district')}</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">location_on</span>
                      <select id="city-select" className="w-full pl-12 pr-4 py-4 bg-surface/50 border border-surface-container rounded-2xl focus:border-secondary focus:bg-surface outline-none transition-all text-sm font-bold appearance-none shadow-sm">
                        <option value="">{t('field_district_placeholder')}</option>
                        {tamilDistricts.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/50 ml-1">{t('field_type')}</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">home_work</span>
                      <select id="property-type" className="w-full pl-12 pr-4 py-4 bg-surface/50 border border-surface-container rounded-2xl focus:border-secondary focus:bg-surface outline-none transition-all text-sm font-bold appearance-none shadow-sm">
                        <option value="">{t('field_type_placeholder')}</option>
                        <option value="Apartment">{t('field_type_apartment')}</option>
                        <option value="Villa">{t('field_type_villa')}</option>
                        <option value="Farmhouse">{t('field_type_farmhouse')}</option>
                        <option value="Plot">{t('field_type_plot')}</option>
                      </select>
                    </div>
                  </div>

                  {activeSearchTab === 'buy' && (<>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/50 ml-1">{t('field_name')}</label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">person</span>
                        <input id="name-input" type="text" placeholder={t('field_name_placeholder')}
                          className="w-full pl-12 pr-4 py-4 bg-surface border border-slate-300 rounded-2xl focus:border-secondary outline-none transition-all text-sm font-bold shadow-sm" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/50 ml-1">{t('field_mobile')}</label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">call</span>
                        <input id="mobile-input" type="tel" placeholder="+91 98XXX XXXXX"
                          className="w-full pl-12 pr-4 py-4 bg-surface border border-slate-300 rounded-2xl focus:border-secondary outline-none transition-all text-sm font-bold shadow-sm" />
                      </div>
                    </div>

                    <div className="space-y-6 md:col-span-2 mt-2 flex flex-col items-center">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/50 text-center">{t('field_budget')}</label>
                      <div className="w-full max-w-[640px]">
                        <BudgetSlider onChange={(min: number, max: number) => { setMinBudget(min); setMaxBudget(max); }} />
                      </div>
                    </div>
                  </>)}
                </div>

                <div className="pt-6">
                  <button
                    onClick={async () => {
                      const citySelect  = document.getElementById('city-select')   as HTMLSelectElement;
                      const nameInput   = document.getElementById('name-input')    as HTMLInputElement;
                      const mobileInput = document.getElementById('mobile-input')  as HTMLInputElement;
                      const typeSelect  = document.getElementById('property-type') as HTMLSelectElement;
                      if (mobileInput?.value) {
                        try {
                          await fetch(apiUrl('/api/leads'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              customerName: nameInput?.value || 'Interested User',
                              phone: mobileInput.value,
                              requirementText: `Interested in ${typeSelect?.value || 'Any'} in ${citySelect?.value || 'Tamil Nadu'}`,
                              propertyType: typeSelect?.value || 'Any',
                              budgetMin: minBudget * 100000,
                              budgetMax: maxBudget * 100000,
                              source: 'hero-form',
                            }),
                          });
                        } catch (e) { console.error(e); }
                      }
                      window.location.href = citySelect?.value
                        ? `/cities/${citySelect.value.toLowerCase()}`
                        : '/properties';
                    }}
                    className="w-full py-5 bg-primary text-white font-extrabold rounded-2xl flex items-center justify-center gap-4 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.98] group relative overflow-hidden shadow-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="material-symbols-outlined text-secondary">search</span>
                    <span className={ta('text-sm')}>
                      {activeSearchTab === 'buy' ? t('cta_buy') : t('cta_search')}
                    </span>
                  </button>
                  <p className={ta('text-center text-outline text-[10px] mt-3 font-bold')}>
                    {t('cta_assurance')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Trust Strip ── */}
      <div className="bg-primary text-white py-5">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8">
          {([
            { icon: 'verified',       key: 'trust_verified'  },
            { icon: 'support_agent',  key: 'trust_support'   },
            { icon: 'handshake',      key: 'trust_brokerage' },
            { icon: 'directions_car', key: 'trust_sitevisit' },
          ] as const).map(({ icon, key }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-xl">{icon}</span>
              <p className={ta('text-xs font-bold')}>{t(key)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Categories ── */}
      <div className="bg-gradient-to-b from-background to-surface py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="mb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
              <div>
                <h2 className={ta('text-3xl font-extrabold font-headline text-primary mb-2')}>{t('cat_heading')}</h2>
                <p className={ta('text-outline text-sm')}>{t('cat_sub')}</p>
              </div>
              <a className="text-secondary font-bold flex items-center gap-1 hover:underline mt-4 md:mt-0 text-sm" href="#">
                {t('cat_all_link')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {categoryItems.map(item => {
                const count = properties.filter(p => p.category === item.id).length;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveCategory(activeCategory === item.id ? 'all' : item.id)}
                    className={`bg-surface p-10 rounded-[2.5rem] border transition-all group text-center flex flex-col items-center cursor-pointer ${
                      activeCategory === item.id
                        ? 'border-secondary ring-2 ring-secondary/20'
                        : 'border-surface-container hover:border-secondary'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all ${
                      activeCategory === item.id ? 'bg-primary text-white' : 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white'
                    }`}>
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <h3 className={ta('font-bold text-primary text-sm')}>{t(item.labelKey)}</h3>
                    <p className="text-[10px] text-outline mt-2 font-bold uppercase tracking-widest">
                      {count > 0 ? `${count} ${count === 1 ? t('cat_unit_one') : t('cat_unit_many')}` : t('cat_explore')}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* ── Listings ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className={ta('text-2xl font-extrabold font-headline text-primary')}>
                {t('listings_h2_1')} <span className="text-secondary">{t('listings_h2_accent')}</span>
              </h2>
              <p className="text-outline text-[10px] uppercase tracking-widest font-bold mt-1">{t('listings_sub')}</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border border-surface-container rounded-full hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="p-2 border border-surface-container rounded-full hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map(p => <PropertyCard key={p.id} {...p} />)}
          </div>
        </section>

        {/* ── Advisory ── */}
        <div id="planning-home" className="bg-primary/5 py-32 rounded-[3rem]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <p className={ta('text-[10px] font-bold uppercase tracking-[0.3em] text-secondary mb-4')}>
                  {t('advisory_tag')}
                </p>
                <h3 className={ta('text-4xl font-extrabold font-headline text-primary mb-4 leading-tight')}>
                  {t('advisory_h3_1')} <span className="text-secondary">{t('advisory_h3_accent')}</span>
                </h3>
                <p className={ta('text-outline text-lg mb-2')}>{t('advisory_body')}</p>
                {t('advisory_body2') && <p className={ta('text-outline text-lg mb-8')}>{t('advisory_body2')}</p>}
                <div className="flex gap-4 flex-wrap mt-6">
                  {([
                    ['advisory_stat1_val','advisory_stat1_label'],
                    ['advisory_stat2_val','advisory_stat2_label'],
                    ['advisory_stat3_val','advisory_stat3_label'],
                  ] as const).map(([val, label]) => (
                    <div key={label} className="bg-surface/50 p-4 rounded-xl border border-surface-container">
                      <div className="text-2xl font-bold text-primary">{t(val)}</div>
                      <div className={ta('text-[10px] text-outline font-bold uppercase tracking-widest')}>{t(label)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-background p-8 rounded-3xl border border-surface-container shadow-xl">
                <LeadForm />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-primary text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 border-b border-slate-700 pb-12">
            <div>
              <a className="text-3xl font-extrabold font-headline tracking-tighter mb-3 block" href="#">ABC<span className="text-secondary">.</span></a>
              <p className={ta('text-white/70 text-sm leading-relaxed mb-6')}>{t('footer_tagline')}</p>
              <div className="flex gap-4">
                <a className="w-10 h-10 rounded-full border border-slate-500/30 flex items-center justify-center hover:bg-secondary hover:text-primary transition-all" href="#">
                  <span className="material-symbols-outlined text-sm">share</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className={ta('font-bold mb-6 text-secondary')}>{t('footer_links_title')}</h4>
              <ul className="space-y-4 text-sm text-white/70">
                {(['footer_link1','footer_link2','footer_link3'] as const).map(k => (
                  <li key={k}><a className={ta('hover:text-white transition-colors')} href="#">{t(k)}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className={ta('font-bold mb-6 text-secondary')}>{t('footer_support_title')}</h4>
              <ul className="space-y-4 text-sm text-white/70">
                {(['footer_faq','footer_privacy','footer_contact'] as const).map(k => (
                  <li key={k}><a className={ta('hover:text-white transition-colors')} href="#">{t(k)}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className={ta('font-bold mb-6 text-secondary')}>{t('footer_newsletter_title')}</h4>
              <p className={ta('text-sm text-white/70 mb-4')}>{t('footer_newsletter_sub')}</p>
              <div className="flex">
                <input className="bg-surface/10 border-none rounded-l-lg px-4 py-2 text-sm w-full focus:ring-0"
                  placeholder={t('footer_newsletter_placeholder')} type="email" />
                <button className="bg-secondary text-primary px-4 py-2 rounded-r-lg font-bold text-sm">{t('footer_newsletter_btn')}</button>
              </div>
            </div>
          </div>
          <div className={ta('text-center text-xs text-white/40')}>{t('footer_copy')}</div>
        </div>
      </footer>
    </main>
  );
}
