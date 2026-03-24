'use client';

import React from 'react';

export default function LeadForm() {
  return (
    <form className="space-y-6 w-full text-left">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Full Name</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">person</span>
          <input 
            type="text" 
            placeholder="John Doe" 
            className="w-full bg-surface border border-surface-container rounded-xl px-12 py-3 text-on-surface placeholder-outline/50 outline-none focus:border-primary transition-all font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Email Address</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">mail</span>
            <input 
              type="email" 
              placeholder="john@example.com" 
              className="w-full bg-surface border border-surface-container rounded-xl px-12 py-3 text-on-surface placeholder-outline/50 outline-none focus:border-primary transition-all font-medium"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Phone Number</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">call</span>
            <input 
              type="tel" 
              placeholder="+91 98765 43210" 
              className="w-full bg-surface border border-surface-container rounded-xl px-12 py-3 text-on-surface placeholder-outline/50 outline-none focus:border-primary transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Your Message</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-4 text-primary/40">chat_bubble</span>
          <textarea 
            placeholder="I am interested in..." 
            rows={4}
            className="w-full bg-surface border border-surface-container rounded-xl px-12 py-3 text-on-surface placeholder-outline/50 outline-none focus:border-primary transition-all font-medium resize-none"
          />
        </div>
      </div>

      <button className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg active:scale-95">
        Request Expert Consultation
      </button>
    </form>
  );
}
