'use client';

import React from 'react';
import { useLang } from '@/i18n/LangContext';

export default function LangToggle() {
  const { lang, setLang } = useLang();
  const isTamil = lang === 'ta';

  return (
    <button
      onClick={() => setLang(isTamil ? 'en' : 'ta')}
      className="group relative flex items-center gap-2 rounded-2xl border border-white/20 bg-gradient-to-r from-primary/95 to-primary px-3.5 py-2 text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:scale-95"
      title={isTamil ? 'Switch to English' : 'Switch to Tamil'}
    >
      <div className="relative h-5 w-10 rounded-full border border-white/25 bg-white/20">
        <div
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-md shadow-white/40 transition-all duration-300 ${
            isTamil ? 'left-[1.35rem]' : 'left-0.5'
          }`}
        />
      </div>

      <span className="min-w-[4.25rem] text-left text-[11px] font-extrabold tracking-wide text-white transition-all">
        {isTamil ? 'English' : <span className="font-['Noto_Serif_Tamil'] text-secondary">தமிழ்</span>}
      </span>

      <span className="rounded-lg border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white/90">
        {isTamil ? 'TA' : 'EN'}
      </span>
    </button>
  );
}
