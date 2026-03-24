'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PropertyCard from '@/components/PropertyCard';
import Link from 'next/link';

export default function CityLandingPage() {
  const { city } = useParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cityName = typeof city === 'string' ? city.charAt(0).toUpperCase() + city.slice(1) : '';

  useEffect(() => {
    fetch('http://localhost:8081/api/properties')
      .then(res => res.json())
      .then(data => {
        // Filter by city (case-insensitive)
        const filtered = data.data.filter((p: any) => 
            p.city.toLowerCase() === (city as string).toLowerCase()
        );
        setProperties(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [city]);

  return (
    <div className="min-h-screen bg-background text-on-surface pt-32 pb-24 px-6 font-body">
      <div className="max-w-7xl mx-auto">
        {/* Dynamic SEO Hero */}
        <div className="relative bg-surface p-12 md:p-20 rounded-[3.5rem] overflow-hidden mb-20 border border-surface-container shadow-xl golden-edge">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -mr-48 -mt-48 transition-all" />
            <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-2 mb-6 animate-slow-fade">
                    <span className="material-symbols-outlined text-secondary">auto_awesome</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-outline">Premium Real Estate Hub</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold font-headline mb-8 leading-tight text-primary tracking-tighter">
                    Premium Properties in <span className="text-secondary capitalize">{cityName}</span>
                </h1>
                <p className="text-outline text-lg md:text-xl leading-relaxed mb-10 font-medium">
                    Discover the finest residential and commercial spaces in {cityName}. From luxury villas in premium pockets to high-growth investment plots, we bring you the best of the {cityName} real estate market.
                </p>
                <div className="flex flex-wrap gap-4">
                    <Link href="/properties" className="bg-primary text-white px-10 py-4 rounded-xl font-bold hover:bg-opacity-95 transition shadow-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">grid_view</span>
                        View All Listings
                    </Link>
                    <button className="bg-surface border border-surface-container text-primary px-10 py-4 rounded-xl font-bold hover:bg-surface-container/50 transition flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">support_agent</span>
                        Speak to {cityName} Expert
                    </button>
                </div>
            </div>
        </div>

        {/* Localized Listings */}
        <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-extrabold font-headline text-primary tracking-tight">Trending in <span className="text-secondary">{cityName}</span></h2>
              <p className="text-outline text-sm mt-1 uppercase tracking-widest font-bold text-[10px]">Handpicked Selection</p>
            </div>
            <Link href="/properties" className="text-xs font-bold text-outline hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2">
              See All <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <p className="text-outline text-[10px] font-bold uppercase tracking-widest">Scanning {cityName}...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map(p => (
              <PropertyCard key={p.id} {...p} />
            ))}
            
            {properties.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-surface-container rounded-[2.5rem] py-32 text-center bg-surface/20">
                    <span className="material-symbols-outlined text-outline/20 text-7xl mb-6">explore_off</span>
                    <h3 className="text-2xl font-extrabold font-headline text-primary mb-2">No active listings in {cityName}</h3>
                    <p className="text-outline mb-8 max-w-sm mx-auto font-medium">We are currently expanding our portfolio in this region. Stay tuned for new launches!</p>
                    <Link href="/properties" className="text-secondary font-bold hover:underline underline-offset-4 decoration-2">Browse other cities</Link>
                </div>
            )}
          </div>
        )}

        {/* Local SEO Text Section */}
        <div className="mt-32 border-t border-surface-container pt-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                <div className="bg-surface p-10 rounded-3xl border border-surface-container shadow-sm">
                    <h3 className="text-2xl font-extrabold font-headline text-primary mb-6 tracking-tight">Why Invest in {cityName}?</h3>
                    <p className="text-outline leading-relaxed font-medium">
                        {cityName} has emerged as a premier real estate destination in Tamil Nadu. With robust infrastructure development, proximity to major transport hubs, and a growing presence of international corporations, {cityName} offers unparalleled value for both end-users and investors.
                    </p>
                </div>
                <div className="bg-surface p-10 rounded-3xl border border-surface-container shadow-sm">
                    <h3 className="text-2xl font-extrabold font-headline text-primary mb-6 tracking-tight">Market Trends</h3>
                    <p className="text-outline leading-relaxed font-medium">
                        The real estate market in {cityName} is seeing a consistent appreciation of 8-12% annually. Premium gated communities and luxury high-rises are the most sought-after segments, driven by a young demographic and increasing high-net-worth migration to the city.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
