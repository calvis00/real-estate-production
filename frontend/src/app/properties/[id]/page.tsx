'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LeadForm from '@/components/LeadForm';

interface Property {
  id: string;
  title: string;
  price: string | number;
  location?: string;
  city?: string;
  locality?: string;
  beds?: number;
  bedrooms?: number;
  baths?: number;
  bathrooms?: number;
  sqft?: number;
  area_sqft?: number;
  areaSqft?: number;
  image: string;
  imageUrl?: string;
  description: string;
  type: string;
  tags?: string[];
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:8081/api/properties/${id}`)
      .then(res => res.json())
      .then(data => {
        setProperty(data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, [id]);

// Helpers
  const formatPrice = (p: string | number) => {
    if (typeof p === 'string') return p;
    if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
    if (p >= 100000) return `₹${(p / 100000).toFixed(2)} Lakhs`;
    return `₹${p.toLocaleString()}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
      <p className="text-outline font-bold tracking-widest uppercase text-[10px]">Unfolding the Estate...</p>
    </div>
  );

  if (!property) return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center flex-col gap-8">
      <h1 className="text-5xl font-extrabold font-headline text-primary opacity-20 uppercase tracking-tighter">Estate Not Found</h1>
      <button 
        onClick={() => router.push('/properties')}
        className="px-10 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-opacity-95 transition-all text-sm uppercase tracking-widest"
      >
        Return to Inventory
      </button>
    </div>
  );

  const displayImage = property.imageUrl || property.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop";
  const displayLocation = (property as any).location || ((property as any).city && (property as any).locality ? `${(property as any).locality}, ${(property as any).city}` : (property as any).city || "Tamil Nadu");
  const displayBeds = (property as any).beds || (property as any).bedrooms || 3;
  const displayBaths = (property as any).baths || (property as any).bathrooms || 2;
  const displaySqft = (property as any).sqft || (property as any).area_sqft || (property as any).areaSqft || 2400;
  const displayPrice = formatPrice(property.price);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body overflow-x-hidden">
      {/* Cinematic Hero */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        <img 
          src={displayImage} 
          alt={property.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Title Overlay */}
        <div className="absolute bottom-12 left-0 w-full px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-10">
                <div className="max-w-4xl text-left animate-slow-fade">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/90 backdrop-blur-md border border-surface-container mb-6 font-bold text-[10px] uppercase tracking-widest text-primary shadow-sm">
                        <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                        {displayLocation}
                    </div>
                    <h1 className="text-5xl md:text-8xl font-extrabold font-headline leading-[0.9] text-primary mb-2 tracking-tighter">
                        {property.title}
                    </h1>
                </div>
                <div className="bg-surface/95 backdrop-blur-md p-10 rounded-[3rem] border border-surface-container shadow-2xl flex flex-col items-center min-w-[320px] golden-edge">
                    <span className="text-outline text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Investment Value</span>
                    <div className="text-5xl font-extrabold font-headline text-primary tracking-tighter">{displayPrice}</div>
                </div>
            </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20">
          
          {/* Property Context */}
          <div className="lg:col-span-8 text-left">
            <div className="grid grid-cols-3 gap-8 mb-20 p-10 bg-surface border border-surface-container rounded-[3rem] shadow-sm">
                <DetailItem icon="bed" val={displayBeds} label="Luxury Suites" />
                <DetailItem icon="bathtub" val={displayBaths} label="Spa Baths" isMiddle />
                <DetailItem icon="square_foot" val={displaySqft} label="Total Area (sqft)" />
            </div>

            <div className="space-y-12 mb-20">
                <div className="inline-flex items-center gap-4 text-outline font-bold uppercase tracking-[0.2em] text-[10px]">
                    <div className="w-10 h-[1px] bg-primary/20" />
                    The Narrative
                </div>
                <p className="text-on-surface text-2xl leading-relaxed font-headline font-medium opacity-90 tracking-tight">
                    {property.description || "A masterfully crafted estate that harmonizes contemporary architectural precision with the organic tranquility of its natural surroundings."}
                </p>
                <div className="p-8 border-l-2 border-secondary bg-primary/5 italic text-primary/70 text-lg font-headline">
                    "Every element in this collection tells a story of craftsmanship and heritage, curated exclusively for the discerning few."
                </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-4">
                {(property.tags && property.tags.length > 0 ? property.tags : ['Verified Asset', 'Forest Views', 'Heritage Build', 'Gold Standard']).map((tag, i) => (
                    <div key={i} className="px-6 py-4 bg-surface border border-surface-container rounded-2xl text-[10px] font-bold uppercase tracking-widest text-primary hover:border-secondary/50 transition-all cursor-default flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                        {tag}
                    </div>
                ))}
            </div>
          </div>

          {/* Acquisition Concierge */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-40">
                <div className="bg-surface rounded-[3.5rem] p-10 border border-surface-container shadow-2xl relative overflow-hidden golden-edge">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-20" />
                    <div className="text-left mb-10">
                        <h3 className="text-2xl font-extrabold font-headline text-primary mb-1 tracking-tight">Acquisition</h3>
                        <p className="text-outline text-[10px] font-bold uppercase tracking-widest">Direct VIP Concierge Line</p>
                    </div>
                    <LeadForm />
                    <div className="mt-10 pt-10 border-t border-surface-container space-y-4">
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-outline">
                            <span className="material-symbols-outlined text-sm text-secondary">verified_user</span> 
                            Verified Developer
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-outline">
                            <span className="material-symbols-outlined text-sm text-secondary">event_available</span> 
                            Request Private Tour
                        </div>
                    </div>
                </div>
            </div>
          </div>

        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="py-20 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="text-3xl font-extrabold font-headline tracking-tighter mb-2">ABC<span className="text-secondary">.</span> Portfolio</div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest italic">Curated Nature-First Estates © 2026</p>
        </div>
      </footer>
    </div>
  );
}

function DetailItem({ icon, val, label, isMiddle }: { icon: string, val: number | string, label: string, isMiddle?: boolean }) {
    return (
        <div className={`flex flex-col items-center gap-3 ${isMiddle ? 'border-x border-surface-container' : ''}`}>
            <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center group overflow-hidden relative">
                <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="material-symbols-outlined relative z-10 group-hover:text-white transition-colors">{icon}</span>
            </div>
            <span className="text-3xl font-extrabold font-headline text-primary tracking-tighter">{val}</span>
            <span className="text-[9px] font-bold text-outline uppercase tracking-[0.2em]">{label}</span>
        </div>
    )
}
