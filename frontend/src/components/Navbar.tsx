'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  if (pathname.startsWith('/crm')) return null;

  return (
    <nav className="sticky top-0 z-50 bg-surface/95 backdrop-blur-lg border-b border-surface-container py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-extrabold font-headline text-primary tracking-tighter">
            ABC<span className="text-secondary">.</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors">Home</Link>
            <Link href="/properties" className="text-sm font-semibold hover:text-primary transition-colors">Properties</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="#" className="text-sm font-semibold hover:text-primary hidden lg:block">Help</Link>
          <button className="px-5 py-2.5 bg-primary text-white rounded-full text-sm font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all border border-secondary/30">
            Post Property <span className="bg-secondary text-primary px-1.5 py-0.5 rounded text-[10px]">FREE</span>
          </button>
          <button className="p-2 rounded-full hover:bg-surface-container">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
