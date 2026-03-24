'use client';

import React, { useState, useEffect } from 'react';
import PropertyCard from '@/components/PropertyCard';

interface Property {
  id: string;
  title: string;
  price: string | number;
  location?: string;
  city?: string;
  locality?: string;
  type: string;
  category?: string;
  imageUrl?: string;
  image?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetch('http://localhost:8081/api/properties')
      .then(res => res.json())
      .then(data => {
        setProperties(data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching properties:', err);
        setLoading(false);
      });
  }, []);

  const filteredProperties = filter === 'All' 
    ? properties 
    : properties.filter(p => p.type.toLowerCase() === filter.toLowerCase() || (filter === 'Flats' && p.type === 'flat') || (filter === 'Plots' && p.type === 'plot') || (filter === 'Villas' && p.type === 'villa'));

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Header Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-10">
          <div className="max-w-2xl text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold font-headline text-primary mb-4 leading-tight">
              Curated <span className="text-secondary">Botanical</span> Collection
            </h1>
            <p className="text-outline text-lg">
              Explore the finest nature-integrated properties across Tamil Nadu.
            </p>
          </div>
          <div className="flex gap-3 mb-2 flex-wrap">
            {['All', 'Plots', 'Flats', 'Villas'].map((tag) => (
              <button 
                key={tag} 
                onClick={() => setFilter(tag)}
                className={`px-6 py-2 rounded-full border border-surface-container text-xs font-bold uppercase tracking-widest transition-all ${
                  filter === tag ? 'bg-primary text-white border-primary' : 'text-outline hover:border-primary'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          {!loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.length > 0 ? (
                filteredProperties.map((property) => (
                  <PropertyCard key={property.id} {...property} />
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-outline">
                  No properties found in this category.
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <div className="w-16 h-16 border-4 border-surface-container border-t-primary rounded-full animate-spin" />
              <p className="text-outline font-bold uppercase tracking-widest text-[10px]">Assembling Your Collection...</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
