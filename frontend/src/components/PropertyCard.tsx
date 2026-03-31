'use client';

import React from 'react';

interface PropertyCardProps {
  id: string;
  title: string;
  price: string | number;
  location?: string;
  city?: string;
  locality?: string;
  type: string;
  images?: string[];
  videos?: string[];
  bedrooms?: number;
  areaSqft?: number;
  featured?: boolean;
  verified?: boolean;
}

export default function PropertyCard({ 
  title, 
  price, 
  location, 
  city,
  locality,
  images,
  videos, 
  type, 
  bedrooms,
  areaSqft 
}: PropertyCardProps) {
  // Helpers
  const formatPrice = (p: string | number) => {
    if (typeof p === 'string') return p;
    const num = typeof p === 'number' ? p : parseFloat(p);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakhs`;
    return `₹${num.toLocaleString()}`;
  };

  const displayImage = (images && images.length > 0) ? images[0] : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop";
  const displayLocation = location || (city && locality ? `${locality}, ${city}` : city || "Tamil Nadu");
  const displayBeds = bedrooms || '-';
  const displaySqft = areaSqft || '-';
  const displayPrice = formatPrice(price);

  return (
    <div className="bg-surface rounded-2xl overflow-hidden border border-surface-container hover:shadow-2xl transition-all group golden-edge h-full flex flex-col">
      <div className="relative h-64">
        <img 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          src={displayImage}
        />
        <div className="absolute top-4 left-4 bg-primary/90 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
          {type === 'flat' ? 'Premium Heritage' : type === 'plot' ? 'Modern Coastal' : 'Sustainable'}
        </div>
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary">
          {displayPrice}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-primary mb-1">{title}</h3>
        <p className="text-sm text-outline mb-4 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">location_on</span> {displayLocation}
        </p>
        <div className="mt-auto flex items-center gap-4 border-t border-surface-container/50 pt-4">
          <div className="flex items-center gap-1 text-xs font-semibold text-on-surface">
            <span className="material-symbols-outlined text-sm text-secondary">bed</span> {displayBeds} BHK
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-on-surface">
            <span className="material-symbols-outlined text-sm text-secondary">square_foot</span> {displaySqft.toLocaleString()} sqft
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-on-surface">
            <span className="material-symbols-outlined text-sm text-secondary">grass</span> 0.5 Acre
          </div>
        </div>
      </div>
    </div>
  );
}
