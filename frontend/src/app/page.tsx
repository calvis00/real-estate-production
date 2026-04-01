'use client';

import React, { useState, useEffect } from 'react';
import PropertyCard from '@/components/PropertyCard';
import LeadForm from '@/components/LeadForm';
import BudgetSlider from '@/components/BudgetSlider';
import Link from 'next/link';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  city?: string;
  locality?: string;
  type: string;
  category: string;
  images: string[];
  videos: string[];
  bedrooms?: number;
  areaSqft?: number;
  featured?: boolean;
  verified?: boolean;
}

const categoryItems = [
  { icon: 'castle', label: 'Villas', id: 'VILLA' },
  { icon: 'apartment', label: 'Apartments', id: 'APARTMENT' },
  { icon: 'landscape', label: 'Plots', id: 'PLOT' },
  { icon: 'corporate_fare', label: 'Commercial', id: 'COMMERCIAL' },
  { icon: 'park', label: 'Farmhouses', id: 'FARMHOUSE' },
];

export default function LandingPage() {
  const [activeSearchTab, setActiveSearchTab] = useState('buy');
  const [searchBudget, setSearchBudget] = useState('10L - 5Cr');
  const [minBudget, setMinBudget] = useState(10);
  const [maxBudget, setMaxBudget] = useState(500);
  const [activeCategory, setActiveCategory] = useState('all');
  const [properties, setProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);

  // Fetch properties from live API
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch('http://localhost:8081/api/properties');
        const data = await res.json();
        setProperties(data.data || []);
        setFilteredProperties(data.data || []);
      } catch (err) {
        console.error('Failed to fetch properties:', err);
      }
    };
    fetchProperties();
  }, []);

  // Update filtering when category changes
  useEffect(() => {
    const activeProperties = properties.filter(p => !p.status || p.status === 'ACTIVE');

    if (activeCategory === 'all') {
      setFilteredProperties(activeProperties);
    } else {
      setFilteredProperties(activeProperties.filter(p =>
        p.category?.toUpperCase() === activeCategory.toUpperCase() ||
        p.type?.toUpperCase() === activeCategory.toUpperCase()
      ));
    }
  }, [activeCategory, properties]);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <header className="hero-section flex items-center justify-center px-4 relative">
        <div className="hero-overlay"></div>
        <div className="relative z-10 w-full max-w-4xl text-center flex flex-col items-center">
          <h1 className="text-white text-4xl md:text-6xl font-extrabold font-headline mb-4 text-shadow tracking-tight">
            Find Your Haven in Nature
          </h1>
          <p className="text-white text-lg md:text-xl mb-12 font-semibold text-shadow">
            Experience the harmony of modern living and lush greenery
          </p>

          {/* Search Bar with Tabs */}
          <div className="bg-black/50 p-2 rounded-2xl backdrop-blur-lg golden-edge mx-auto w-full max-w-3xl">
            <div className="bg-background rounded-xl overflow-hidden">
              <div className="flex border-b border-slate-300">
                {['Buy', 'Rent', 'Shoot/Events'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSearchTab(tab.toLowerCase())}
                    className={`flex-1 py-4 text-sm font-bold transition-all ${activeSearchTab === tab.toLowerCase() ? 'search-tab-active' : 'text-gray-500 hover:text-primary'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-8 md:p-12 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 items-start">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/50 ml-1">Location</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">location_on</span>
                      <select id="city-select" className="w-full pl-12 pr-4 py-4 bg-surface/50 border border-surface-container rounded-2xl focus:border-secondary focus:bg-surface outline-none transition-all text-sm font-bold appearance-none shadow-sm">
                        <option value="">Select District</option>
                        {[
                          'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
                          'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur',
                          'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
                          'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
                          'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
                          'Tirupattur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'
                        ].sort().map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/50 ml-1">Property Type</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">home_work</span>
                      <select id="property-type" className="w-full pl-12 pr-4 py-4 bg-surface/50 border border-surface-container rounded-2xl focus:border-secondary focus:bg-surface outline-none transition-all text-sm font-bold appearance-none shadow-sm">
                        <option value="">Any Type</option>
                        <option value="Apartment">Modern Apartment</option>
                        <option value="Villa">Villa / House</option>
                        <option value="Farmhouse">Farmhouse</option>
                        <option value="Plot">Commercial Plot</option>
                      </select>
                    </div>
                  </div>

                  {activeSearchTab === 'buy' && (
                    <>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/50 ml-1">Full Name</label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">person</span>
                          <input
                            id="name-input"
                            type="text"
                            placeholder="Name"
                            className="w-full pl-12 pr-4 py-4 bg-surface border border-slate-300 rounded-2xl focus:border-secondary focus:bg-surface outline-none transition-all text-sm font-bold shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/50 ml-1">Mobile Number</label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">call</span>
                          <input
                            id="mobile-input"
                            type="tel"
                            placeholder="Phone Number"
                            className="w-full pl-12 pr-4 py-4 bg-surface border border-slate-300 rounded-2xl focus:border-secondary focus:bg-surface outline-none transition-all text-sm font-bold shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-8 md:col-span-2 flex flex-col items-center justify-center py-6 border-t border-surface-container mt-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 text-center mb-2">Investment Range</label>
                        <div className="w-full max-w-xl">
                          <BudgetSlider
                            onChange={(min: number, max: number) => {
                              setMinBudget(min);
                              setMaxBudget(max);
                              const budgetText = min < 100 ? `${min}L` : `${(min / 100).toFixed(1)}Cr`;
                              const maxText = max < 100 ? `${max}L` : `${(max / 100).toFixed(1)}Cr`;
                              setSearchBudget(`${budgetText} - ${maxText}`);
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-6">
                  <button
                    onClick={async () => {
                      const citySelect = document.getElementById('city-select') as HTMLSelectElement;
                      const nameInput = document.getElementById('name-input') as HTMLInputElement;
                      const mobileInput = document.getElementById('mobile-input') as HTMLInputElement;
                      const typeSelect = document.getElementById('property-type') as HTMLSelectElement;

                      const selectedCity = citySelect?.value;
                      const fullName = nameInput?.value || 'Interested User';
                      const mobile = mobileInput?.value;

                      if (mobile) {
                        try {
                          await fetch('http://localhost:8081/api/leads', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              customerName: fullName,
                              phone: mobile,
                              requirementText: `Interested in ${typeSelect?.value || 'Any'} property in ${selectedCity || 'Tamil Nadu'}`,
                              propertyType: typeSelect?.value || 'Any',
                              budgetMin: minBudget * 100000,
                              priceMax: maxBudget * 100000,
                              source: 'HERO_SEARCH'
                            })
                          });
                        } catch (err) { console.error('Lead generation failed', err); }
                      }

                      if (selectedCity) {
                        window.location.href = `/cities/${selectedCity.toLowerCase()}`;
                      } else {
                        window.location.href = '/properties';
                      }
                    }}
                    className="w-full py-5 bg-primary text-white font-extrabold rounded-2xl flex items-center justify-center gap-4 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.98] group relative overflow-hidden shadow-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="material-symbols-outlined text-secondary">search</span>
                    <span className="uppercase tracking-[0.2em] text-xs">
                      {activeSearchTab === 'buy' ? 'Get Exclusive Listings' : 'Search Estates'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-gradient-to-b from-background to-surface py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Section */}
          <section className="mb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-extrabold font-headline text-primary mb-2">One Stop Destination for Nature Properties</h2>
                <p className="text-outline">Curated spaces where heritage meets coastal modernity.</p>
              </div>
              <a className="text-secondary font-bold flex items-center gap-1 hover:underline mt-4 md:mt-0" href="#">
                See All Categories <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {categoryItems.map((item, index) => {
                const count = properties.filter(p => p.category === item.id).length;
                return (
                  <div
                    key={index}
                    onClick={() => setActiveCategory(activeCategory === item.id ? 'all' : item.id)}
                    className={`bg-surface p-10 rounded-[2.5rem] border transition-all group text-center flex flex-col items-center cursor-pointer ${activeCategory === item.id ? 'border-secondary ring-2 ring-secondary/20' : 'border-surface-container hover:border-secondary'}`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all ${activeCategory === item.id ? 'bg-primary text-white' : 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white'}`}>
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <h3 className="font-bold text-primary">{item.label}</h3>
                    <p className="text-[10px] text-outline mt-2 font-bold uppercase tracking-widest">{count > 0 ? `${count} ${count === 1 ? 'Asset' : 'Assets'}` : 'Explore'}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Featured Listings Section */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-extrabold font-headline text-primary">Fresh Recommendations</h2>
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
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))}
          </div>
        </section>

        <div className="bg-primary/5 py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Lead Advisory/Footer CTA */}
            <section id="expert-advisory">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div>
                  <h3 className="text-4xl font-extrabold font-headline text-primary mb-6">Expert Architectural Advisory</h3>
                  <p className="text-outline text-lg mb-8">
                    Connect with our principals to navigate the luxury landscape with precision and heritage.
                  </p>
                  <div className="flex gap-4">
                    <div className="bg-surface/50 p-4 rounded-xl backdrop-blur-sm border border-surface-container">
                      <div className="text-2xl font-bold text-primary">99%</div>
                      <div className="text-xs text-outline font-bold uppercase">Customer Trust</div>
                    </div>
                    <div className="bg-surface/50 p-4 rounded-xl backdrop-blur-sm border border-surface-container">
                      <div className="text-2xl font-bold text-primary">500+</div>
                      <div className="text-xs text-outline font-bold uppercase">Premium Listings</div>
                    </div>
                  </div>
                </div>
                <div className="bg-background p-8 rounded-3xl border border-surface-container shadow-xl">
                  <LeadForm />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Actual Footer */}
      <footer className="bg-primary text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 border-b border-slate-700 pb-12">
            <div className="col-span-1">
              <a className="text-3xl font-extrabold font-headline tracking-tighter mb-6 block" href="#">ABC<span className="text-secondary">.</span></a>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                Connecting people with the finest nature-integrated properties for living, working, and creative pursuits.
              </p>
              <div className="flex gap-4">
                <a className="w-10 h-10 rounded-full border border-slate-500/30 flex items-center justify-center hover:bg-secondary hover:text-primary transition-all" href="#">
                  <span className="material-symbols-outlined text-sm">share</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-secondary">Quick Links</h4>
              <ul className="space-y-4 text-sm text-white/70">
                <li><a className="hover:text-white transition-colors" href="#">Residential Sales</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Luxury Rentals</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Commercial Space</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-secondary">Support</h4>
              <ul className="space-y-4 text-sm text-white/70">
                <li><a className="hover:text-white transition-colors" href="#">FAQ</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-secondary">Newsletter</h4>
              <p className="text-sm text-white/70 mb-4">Stay updated with our latest nature-first properties.</p>
              <div className="flex">
                <input className="bg-surface/10 border-none rounded-l-lg px-4 py-2 text-sm w-full focus:ring-0" placeholder="Email" type="email" />
                <button className="bg-secondary text-primary px-4 py-2 rounded-r-lg font-bold text-sm">Join</button>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-white/40">
            © 2024 ABC Premium Real Estate. Built for Harmony with Nature.
          </div>
        </div>
      </footer>
    </main>
  );
}
