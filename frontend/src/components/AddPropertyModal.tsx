'use client';

import React, { useState } from 'react';

export default function AddPropertyModal({ isOpen, onClose, onRefresh }: any) {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Convert numbers
    const payload = {
        ...data,
        price: Number(data.price),
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
        areaSqft: Number(data.areaSqft), // Match Drizzle schema property name
        type: data.type || 'RESIDENTIAL_BUY',
        category: data.category || 'APARTMENT',
        city: data.city || 'Chennai',
        tags: (data.tags as string).split(',').map(t => t.trim())
    };

    try {
        const res = await fetch('http://localhost:8081/api/properties', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        
        if (res.ok) {
            onRefresh();
            onClose();
        }
    } catch (err) {
        console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background w-full max-w-2xl rounded-3xl overflow-hidden border border-surface-container shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-surface-container flex justify-between items-center bg-surface">
          <h2 className="text-2xl font-extrabold font-headline text-primary">Add <span className="text-secondary">New Property</span></h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Basic Info</label>
            <input required name="title" placeholder="Property Title (e.g. Modern Villa in ECR)" className="w-full bg-surface border border-surface-container rounded-xl py-3 px-4 focus:border-primary outline-none transition shadow-inner" />
            <textarea name="description" placeholder="Narrative Description (Crafting the story of this estate...)" className="w-full bg-surface border border-surface-container rounded-xl py-3 px-4 focus:border-primary outline-none transition shadow-inner min-h-[100px]" />
            <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">payments</span>
                <input required name="price" type="number" placeholder="Price (in INR)" className="w-full bg-surface border border-surface-container rounded-xl py-3 pl-10 pr-4 focus:border-primary outline-none transition shadow-inner" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">location_on</span>
                    <input required name="city" placeholder="City (e.g. Chennai)" className="w-full bg-surface border border-surface-container rounded-xl py-3 pl-10 pr-4 focus:border-primary outline-none transition shadow-inner" />
                </div>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">explore</span>
                    <input required name="locality" placeholder="Locality (e.g. OMR)" className="w-full bg-surface border border-surface-container rounded-xl py-3 pl-10 pr-4 focus:border-primary outline-none transition shadow-inner" />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select required name="type" className="bg-surface border border-surface-container rounded-xl py-3 px-4 outline-none focus:border-primary shadow-inner text-sm font-bold">
                <option value="RESIDENTIAL_BUY">For Sale</option>
                <option value="RESIDENTIAL_RENT">For Rent</option>
                <option value="COMMERCIAL">Commercial</option>
            </select>
            <select required name="category" className="bg-surface border border-surface-container rounded-xl py-3 px-4 outline-none focus:border-primary shadow-inner text-sm font-bold">
                <option value="APARTMENT">Apartment</option>
                <option value="VILLA">Villa / House</option>
                <option value="PLOT">Land / Plot</option>
                <option value="OFFICE">Office Space</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <input required name="bedrooms" type="number" placeholder="BHK" className="bg-surface border border-surface-container rounded-xl py-3 px-4 outline-none focus:border-primary shadow-inner" />
            <input required name="bathrooms" type="number" placeholder="Bath" className="bg-surface border border-surface-container rounded-xl py-3 px-4 outline-none focus:border-primary shadow-inner" />
            <input required name="areaSqft" type="number" placeholder="Sqft" className="bg-surface border border-surface-container rounded-xl py-3 px-4 outline-none focus:border-primary shadow-inner" />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Assets & Metadata</label>
            <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">image</span>
                <input required name="image" placeholder="Image URL (Unsplash or Cloudinary)" className="w-full bg-surface border border-surface-container rounded-xl py-3 pl-10 pr-4 focus:border-primary outline-none transition shadow-inner" />
            </div>
            <input name="tags" placeholder="Tags (e.g. Near Metro, Penthouse, Premium)" className="w-full bg-surface border border-surface-container rounded-xl py-3 px-4 focus:border-primary outline-none transition shadow-inner" />
          </div>

          <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold mt-4 hover:bg-opacity-95 transition shadow-lg flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">send</span>
            Publish Listing
          </button>
        </form>
      </div>
    </div>
  );
}
