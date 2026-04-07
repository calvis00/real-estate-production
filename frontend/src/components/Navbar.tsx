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
            Nearby<span className="text-secondary">Acres</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors">{t('nav_home')}</Link>
            <Link href="/properties" className="text-sm font-semibold hover:text-primary transition-colors">{t('nav_properties')}</Link>
            <details className="relative">
              <summary className="list-none cursor-pointer text-sm font-semibold text-on-surface transition-colors hover:text-primary">
                <span className="inline-flex items-center gap-1">
                  {t('nav_categories')}
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </span>
              </summary>
              <div className="absolute left-0 top-full z-30 mt-2 w-56 rounded-xl border border-surface-container bg-white p-2 shadow-xl">
                <Link href="/properties?category=apartment" className="block rounded-lg px-3 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface hover:text-primary">
                  {t('field_type_apartment')}
                </Link>
                <Link href="/properties?category=villa" className="block rounded-lg px-3 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface hover:text-primary">
                  {t('field_type_villa')}
                </Link>
                <Link href="/properties?category=house" className="block rounded-lg px-3 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface hover:text-primary">
                  {t('field_type_individual_house')}
                </Link>
                <Link href="/properties?category=farmhouse" className="block rounded-lg px-3 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface hover:text-primary">
                  {t('field_type_farmhouse')}
                </Link>
                <Link href="/properties?category=plot" className="block rounded-lg px-3 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface hover:text-primary">
                  {t('field_type_plot')}
                </Link>
                <Link href="/properties?category=commercial" className="block rounded-lg px-3 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface hover:text-primary">
                  {t('cat_commercial')}
                </Link>
              </div>
            </details>
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
