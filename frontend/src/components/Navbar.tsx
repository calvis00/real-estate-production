'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useModal } from '@/context/ModalContext';
import { useLang } from '@/i18n/LangContext';
import LangToggle from '@/i18n/LangToggle';

export default function Navbar() {
  const pathname = usePathname();
  const { openModal } = useModal();
  const { t } = useLang();
  const advisorySectionId = 'planning-home';

  if (pathname.startsWith('/crm')) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-surface-container bg-surface/95 py-3 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="text-2xl font-extrabold font-headline text-primary tracking-tighter">
            ABC<span className="text-secondary">.</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors">{t('nav_home')}</Link>
            <Link href="/properties" className="text-sm font-semibold hover:text-primary transition-colors">{t('nav_properties')}</Link>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
          <LangToggle />
          <button
            onClick={() => openModal('LISTING')}
            className="rounded-full border border-secondary/30 bg-primary px-3 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-opacity-90 active:scale-95 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <span className="whitespace-nowrap">List Property</span>{' '}
            <span className="hidden rounded bg-secondary px-1.5 py-0.5 text-[10px] text-primary sm:inline-block">FREE</span>
          </button>
          <button
            onClick={() => {
              if (window.location.pathname !== '/') {
                 window.location.href = `/#${advisorySectionId}`;
              } else {
                 document.getElementById(advisorySectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-surface-container text-primary transition-all hover:bg-surface-container/40 lg:hidden"
            aria-label={t('nav_contact')}
            title={t('nav_contact')}
          >
            <span className="material-symbols-outlined text-[18px]">contact_phone</span>
          </button>
          <button 
            onClick={() => {
              if (window.location.pathname !== '/') {
                 window.location.href = `/#${advisorySectionId}`;
              } else {
                 document.getElementById(advisorySectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="text-sm font-semibold hover:text-primary hidden lg:block transition-all"
          >
            {t('nav_contact')}
          </button>
        </div>

      </div>
    </nav>
  );
}
