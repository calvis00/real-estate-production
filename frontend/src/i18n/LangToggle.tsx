'use client';

import React from 'react';
import { useLang } from '@/i18n/LangContext';

export default function LangToggle() {
  const { lang, setLang } = useLang();
  const isTamil = lang === 'ta';

  return (
    <button
      onClick={() => setLang(isTamil ? 'en' : 'ta')}
      className="group relative flex items-center gap-1.5 rounded-xl border border-white/20 bg-gradient-to-r from-primary/95 to-primary px-2.5 py-1.5 text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:scale-95 sm:gap-2 sm:rounded-2xl sm:px-3.5 sm:py-2"
      title={isTamil ? 'Switch to English' : 'Switch to Tamil'}
    >
      <div className="relative h-4 w-8 rounded-full border border-white/25 bg-white/20 sm:h-5 sm:w-10">
        <div
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-md shadow-white/40 transition-all duration-300 sm:h-3.5 sm:w-3.5 ${
            isTamil ? 'left-[1.05rem] sm:left-[1.35rem]' : 'left-0.5'
          }`}
        />
      </div>

      <span className="min-w-[3rem] text-left text-[10px] font-extrabold tracking-wide text-white transition-all sm:min-w-[4.25rem] sm:text-[11px]">
        {isTamil ? 'English' : <span className="font-['Noto_Serif_Tamil'] text-secondary">தமிழ்</span>}
      </span>

      <span className="hidden rounded-lg border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white/90 sm:inline-block">
        {isTamil ? 'TA' : 'EN'}
      </span>
    </button>
  );
}
