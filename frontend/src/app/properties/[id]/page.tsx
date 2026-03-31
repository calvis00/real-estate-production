'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LeadForm from '@/components/LeadForm';

interface Property {
  id: string;
  title: string;
  price: number;
  city: string;
  locality: string;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  description: string;
  type: string;
  category: string;
  images: string[];
  videos: string[];
  tags: string[];
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

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

  const formatPrice = (p: number) => {
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

  const displayLocation = `${property.locality}, ${property.city}`;
  const displayPrice = formatPrice(property.price);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body overflow-x-hidden">
      
      {/* Cinematic Hero & Gallery Section */}
      <section className="relative min-h-[90vh] w-full flex flex-col lg:flex-row bg-black">
        
        {/* Main Media Player */}
        <div className="flex-1 relative flex items-center justify-center group">
          {property.images && property.images.length > 0 ? (
            <img 
              src={property.images[activeImage]} 
              alt={property.title} 
              className="max-w-full max-h-screen object-contain animate-in fade-in zoom-in-95 duration-700"
            />
          ) : (
            <div className="text-white/20 font-black text-9xl">NO MEDIA</div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
          
          {/* Navigation Controls */}
          {property.images && property.images.length > 1 && (
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
              <button 
                onClick={() => setActiveImage(prev => (prev === 0 ? property.images.length - 1 : prev - 1))}
                className="pointer-events-auto p-4 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all shadow-2xl active:scale-90"
              >
                <span className="material-symbols-outlined text-4xl">chevron_left</span>
              </button>
              <button 
                onClick={() => setActiveImage(prev => (prev === property.images.length - 1 ? 0 : prev + 1))}
                className="pointer-events-auto p-4 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all shadow-2xl active:scale-90"
              >
                <span className="material-symbols-outlined text-4xl">chevron_right</span>
              </button>
            </div>
          )}
        </div>

        {/* Vertical Thumbnail Strip */}
        {property.images && property.images.length > 1 && (
            <div className="lg:w-40 bg-black/40 backdrop-blur-3xl p-6 flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto no-scrollbar border-l border-white/5 order-last lg:order-none">
                {property.images.map((img, i) => (
                    <button 
                        key={i} 
                        onClick={() => setActiveImage(i)}
                        className={`relative w-24 lg:w-full aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === i ? 'border-secondary scale-105 shadow-xl shadow-secondary/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
                    >
                        <img src={img} className="w-full h-full object-cover" alt="" />
                    </button>
                ))}
                {property.videos && property.videos.map((vid, i) => (
                    <button key={i} className="relative w-24 lg:w-full aspect-[4/3] rounded-xl overflow-hidden border-2 border-transparent opacity-40 hover:opacity-100 bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-3xl">play_circle</span>
                    </button>
                ))}
            </div>
        )}

        {/* Overlay Metadata */}
        <div className="absolute top-12 left-12 z-20 pointer-events-none">
            <button 
                onClick={() => router.back()}
                className="pointer-events-auto p-3 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all mb-8 flex items-center gap-2 pr-6 border border-white/10"
            >
                <span className="material-symbols-outlined">arrow_back</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Search</span>
            </button>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary text-primary font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-secondary/40">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                {property.category === 'VILLA' ? 'Exclusive Estate' : property.category}
            </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-24 px-6 bg-background relative -mt-20 rounded-t-[4rem] z-30 shadow-[0_-40px_80px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-24">
          
          <div className="lg:col-span-8 space-y-20 text-left">
            {/* Header Info */}
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-secondary font-black uppercase tracking-[0.3em] text-[10px]">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {displayLocation}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black font-headline text-primary tracking-tighter leading-[1.1] uppercase">{property.title}</h1>
                </div>
                <div className="inline-block px-6 py-3 bg-secondary/10 border border-secondary/20 rounded-2xl text-3xl font-black font-headline text-secondary tracking-tighter">
                    {displayPrice}
                </div>
            </div>

            {/* Quick Specs */}
            <div className="flex items-center justify-between p-8 bg-surface border border-surface-container rounded-[3rem] shadow-sm overflow-hidden golden-edge">
                <DetailItem icon="bed" val={property.bedrooms} label="Luxury Suites" />
                <div className="h-12 w-px bg-surface-container" />
                <DetailItem icon="bathtub" val={property.bathrooms} label="Spa Baths" />
                <div className="h-12 w-px bg-surface-container" />
                <DetailItem icon="square_foot" val={property.areaSqft} label="Area (sqft)" />
            </div>

            {/* Narrative Content (Medium Inspired) */}
            <div className="space-y-12">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-px bg-primary/10" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-outline opacity-40">The Narrative</span>
                </div>
                <div 
                    className="prose prose-xl font-serif text-primary/80 leading-relaxed max-w-none prose-p:my-6 prose-strong:text-primary prose-ul:list-none prose-ul:p-0 prose-li:my-4"
                    dangerouslySetInnerHTML={{ __html: property.description }}
                />
            </div>

            {/* Tags / Features */}
            <div className="flex flex-wrap gap-4 pt-12">
                {property.tags && property.tags.map((tag, i) => (
                    <span key={i} className="px-8 py-5 bg-surface border border-surface-container rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:border-secondary cursor-default transition-all flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary text-base">verified</span>
                        {tag}
                    </span>
                ))}
            </div>
          </div>

          {/* Contact / Lead Sidebar */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-40">
                <div className="bg-surface p-10 rounded-[3rem] border border-surface-container shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.01] transition-opacity duration-700" />
                    <div className="mb-8">
                        <h3 className="text-2xl font-black font-headline text-primary tracking-tighter mb-1 uppercase">Acquisition</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-outline">Exclusive Site Visit Access</p>
                    </div>
                    
                    <LeadForm />

                    <div className="mt-12 pt-12 border-t border-surface-container space-y-6">
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-outline">
                            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                            </div>
                            Response in 15 Minutes
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-outline">
                            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined text-sm">contact_phone</span>
                            </div>
                            Direct Principal Liaison
                        </div>
                    </div>
                </div>
                
                {/* Visual Accent */}
                <div className="mt-8 p-12 bg-secondary rounded-[4rem] text-primary flex items-center justify-between shadow-2xl shadow-secondary/20">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">Status</p>
                        <p className="text-2xl font-black font-headline uppercase leading-none">Available</p>
                    </div>
                    <span className="material-symbols-outlined text-5xl">verified</span>
                </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 bg-primary text-white text-center">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-5xl font-black font-headline tracking-[ -0.05em] mb-4 uppercase">ABC<span className="text-secondary">.</span> Global Portofolio</div>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.5em]">Curated Nature-First Assets © 2026</p>
        </div>
      </footer>
    </div>
  );
}

function DetailItem({ icon, val, label }: { icon: string, val: number | string, label: string }) {
    return (
        <div className="flex flex-col items-center gap-4 flex-1">
            <div className="w-16 h-16 bg-primary/5 text-primary rounded-[1.5rem] flex items-center justify-center group relative overflow-hidden transition-all hover:scale-110">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-secondary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div className="text-center">
                <span className="block text-3xl font-black font-headline text-primary tracking-tighter">{val}</span>
                <span className="block text-[8px] font-black text-outline uppercase tracking-[0.3em] mt-1">{label}</span>
            </div>
        </div>
    )
}
