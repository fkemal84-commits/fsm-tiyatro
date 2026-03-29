'use client';

import { useState } from 'react';

export default function ArchiveWrapper({ children, count }: { children: React.ReactNode, count: number }) {
  const [isOpen, setIsOpen] = useState(false);

  if (count === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex flex-col items-center gap-6">
        {!isOpen && (
          <div className="w-full flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
            <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] font-medium">Toplam {count} Arşiv Kaydı</p>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
          </div>
        )}
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center gap-3 py-4 px-10 rounded-full border transition-all duration-500 ${
            isOpen 
            ? 'bg-white/5 border-white/10 text-white/40 hover:text-white' 
            : 'bg-[var(--primary-gold)]/5 border-[var(--primary-gold)]/20 text-[var(--primary-gold)] hover:bg-[var(--primary-gold)] hover:text-black shadow-glow-sm'
          }`}
        >
          <ion-icon name={isOpen ? "archive-outline" : "folder-open-outline"} style={{ fontSize: '1.2rem' }}></ion-icon>
          <span className="text-xs font-bold uppercase tracking-widest">
            {isOpen ? 'ARŞİVİ KAPAT' : 'GEÇMİŞ YOKLAMA ARŞİVİNİ GÖR'}
          </span>
          <ion-icon name={isOpen ? "chevron-up-outline" : "chevron-down-outline"}></ion-icon>
        </button>
      </div>

      {isOpen && (
        <div className="mt-12 space-y-8 animate-fadeIn">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-white/40 text-2xl font-bold serif-font">Geçmiş Arşiv</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>
          <div className="opacity-80 hover:opacity-100 transition-opacity space-y-8">
            {children}
          </div>
        </div>
      )}
    </section>
  );
}
