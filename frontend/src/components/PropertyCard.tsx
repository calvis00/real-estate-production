import React from 'react';
import Link from 'next/link';

interface PropertyCardProps {
  id: string;
  title: string;
  price: string | number;
  location?: string;
  city?: string;
  locality?: string;
  type: string;
  category?: string;
  images?: string[];
  videos?: string[];
  bedrooms?: number;
  areaSqft?: number;
  featured?: boolean;
  verified?: boolean;
}

export default function PropertyCard({ 
  id,
  title, 
  price, 
  location, 
  city,
  locality,
  images,
  videos, 
  type, 
  category,
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

  const displayImage = (images && images.length > 0) ? images[0] : "/placeholder.png";
  const displayLocation = location || (city && locality ? `${locality}, ${city}` : city || "Tamil Nadu");
  const displayBeds = bedrooms || '-';
  const displaySqft = areaSqft || '-';
  const displayPrice = formatPrice(price);

  return (
    <Link href={`/properties/${id}`} className="block h-full group">
      <div className="bg-surface rounded-2xl overflow-hidden border border-surface-container hover:shadow-2xl transition-all h-full flex flex-col golden-edge group-hover:-translate-y-1 duration-300">
        <div className="relative h-64 overflow-hidden">
          <img 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            src={displayImage}
            onError={(e: any) => { e.target.src = "/placeholder.png"; }}
          />
          <div className="absolute top-4 left-4 bg-primary/90 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-sm border border-white/10">
            {type === 'flat' ? 'Premium Heritage' : type === 'plot' ? 'Modern Coastal' : category === 'VILLA' ? 'Exclusive Estate' : 'Sustainable'}
          </div>
          {videos && videos.length > 0 && (
            <div className="absolute top-4 right-4 bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <span className="material-symbols-outlined text-sm">videocam</span>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-md px-4 py-2 rounded-2xl text-sm font-black text-primary shadow-xl border border-white/5">
            {displayPrice}
          </div>
        </div>
        <div className="p-8 flex-1 flex flex-col">
          <h3 className="text-xl font-black text-primary mb-2 font-headline uppercase tracking-tight group-hover:text-secondary transition-colors">{title}</h3>
          <p className="text-sm text-outline mb-6 flex items-center gap-2 font-medium opacity-70">
            <span className="material-symbols-outlined text-sm text-secondary">location_on</span> {displayLocation}
          </p>
          <div className="mt-auto flex items-center gap-6 border-t border-surface-container/50 pt-6">
            <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm text-secondary">bed</span> {displayBeds} BHK
            </div>
            <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm text-secondary">square_foot</span> {displaySqft?.toLocaleString()} sqft
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
