'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export type HeroSlide = {
  id: string;
  type: 'play' | 'post' | 'pinned';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
  tag: string;
  date?: string;
};

interface HeroCarouselProps {
  slides: HeroSlide[];
  showTicketQuery?: boolean;
}

export default function HeroCarousel({ slides, showTicketQuery = true }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [paused, next, slides.length]);

  if (!slides || slides.length === 0) return null;

  const slide = slides[current];
  const hasPoster = !!slide.imageUrl;

  return (
    <div
      className="relative w-full overflow-hidden min-h-[85vh] sm:min-h-[90vh] flex flex-col justify-between bg-[var(--bg-dark)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* 1. SİNEMATİK ARKA PLAN ATMOSFERİ */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {slide.imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={slide.imageUrl}
              alt={slide.title}
              fill
              className="object-cover scale-125 blur-3xl opacity-20 transition-all duration-1000"
              priority
              sizes="100vw"
            />
            {/* Karartma katmanları */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark)] via-[var(--bg-dark)]/85 to-[var(--bg-dark)]/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-dark)] via-[var(--bg-dark)]/70 to-[var(--bg-dark)]/90" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-dark)] via-[#121216] to-[#070709]" />
        )}
      </div>

      {/* 2. ÖN PLAN İÇERİK — 2 KOLONLU DİKEY AFİŞ & METİN DÜZENİ */}
      <div className="relative z-10 pt-28 pb-8 sm:pt-36 sm:pb-12 px-[5%] max-w-[1380px] mx-auto w-full my-auto">
        <div 
          key={slide.id} 
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center animate-fadeIn"
        >
          
          {/* SOL ALAN: METİNLER & BUTONLAR */}
          <div className={`${hasPoster ? 'lg:col-span-7' : 'lg:col-span-12 max-w-3xl'} flex flex-col justify-center`}>
            
            {/* Sezon & Tür Etiketi */}
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-[var(--primary-gold-border)] bg-[var(--primary-gold-dim)] text-[var(--primary-gold)] text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-gold)] animate-pulse" />
              {slide.tag}
            </div>

            {/* Oyun / Yazı Başlığı */}
            <h1 className="serif-font text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-[var(--text-main)] leading-[1.08] mb-4 break-words">
              {slide.title}
            </h1>

            {/* Alt Başlık / Özet */}
            {slide.subtitle && (
              <p className="text-xs sm:text-sm md:text-base text-[var(--text-muted)] max-w-xl font-light leading-relaxed mb-6 sm:mb-8">
                {slide.subtitle}
              </p>
            )}

            {/* Butonlar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
              <Link
                href={slide.href}
                className="btn btn-primary px-7 py-3 text-xs sm:text-sm font-bold tracking-wider text-center"
              >
                {slide.type === 'post' ? 'Yazıyı Oku →' : slide.type === 'play' ? 'Oyun Detayları →' : 'İncele →'}
              </Link>
              {showTicketQuery ? (
                <Link href="/biletimi-bul" className="btn btn-outline px-6 py-3 text-xs sm:text-sm tracking-wider text-center">
                  🎟️ Biletimi Bul
                </Link>
              ) : (
                <Link href="/oyunlar" className="btn btn-outline px-6 py-3 text-xs sm:text-sm tracking-wider text-center">
                  Tüm Oyunlar
                </Link>
              )}
            </div>

            {/* Meta Detayları */}
            <div className="flex flex-wrap gap-4 sm:gap-6 text-left text-xs pt-4 border-t border-[var(--border-subtle)]">
              <div>
                <span className="block text-[9px] sm:text-[10px] text-[var(--text-dim)] uppercase font-bold tracking-widest">TOPLULUK</span>
                <span className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">FSM Tiyatro</span>
              </div>
              <div>
                <span className="block text-[9px] sm:text-[10px] text-[var(--text-dim)] uppercase font-bold tracking-widest">YERLEŞKE</span>
                <span className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">Haliç Yerleşkesi</span>
              </div>
              {slide.date && (
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-[var(--text-dim)] uppercase font-bold tracking-widest">DÖNEM / TARİH</span>
                  <span className="text-xs sm:text-sm font-semibold text-[var(--primary-gold)]">{slide.date}</span>
                </div>
              )}
            </div>

          </div>

          {/* SAĞ ALAN: DİKEY TİYATRO AFİŞİ KARTI (KESİLMEDEN TAM DİKEY ORAN) */}
          {hasPoster && (
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <Link 
                href={slide.href}
                className="group relative block w-full max-w-[260px] sm:max-w-[310px] md:max-w-[340px] aspect-[2/3] rounded-2xl overflow-hidden border border-[var(--primary-gold-border)] shadow-2xl shadow-black/90 transition-transform duration-500 hover:scale-[1.02] bg-[var(--bg-surface-elevated)]"
              >
                <Image
                  src={slide.imageUrl!}
                  alt={slide.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                  sizes="(max-width: 768px) 80vw, 360px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-white/90">
                  <span className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10">
                    {slide.tag}
                  </span>
                  <span className="text-[var(--primary-gold)] flex items-center gap-1">
                    İncele <ion-icon name="arrow-forward-outline" />
                  </span>
                </div>
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* 3. SLAYT NAVİGASYON ÇUBUĞU (ALT ÇUBUK) */}
      {slides.length > 1 && (
        <div className="relative z-10 pb-6 px-[5%] max-w-[1380px] mx-auto w-full flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
          <div className="flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id || i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 cursor-pointer ${
                  i === current
                    ? 'w-7 h-2 rounded-full bg-[var(--primary-gold)]'
                    : 'w-2 h-2 rounded-full bg-[var(--border-medium)] hover:bg-[var(--text-dim)]'
                }`}
                aria-label={`Slayt ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              className="w-8 h-8 rounded-full border border-[var(--border-medium)] flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary-gold)] hover:text-[var(--primary-gold)] transition-all cursor-pointer"
              aria-label="Önceki slayt"
            >
              <ion-icon name="chevron-back-outline" style={{ fontSize: '0.9rem' }} />
            </button>
            <span className="text-[11px] text-[var(--text-dim)] font-mono">
              {current + 1} / {slides.length}
            </span>
            <button
              onClick={next}
              className="w-8 h-8 rounded-full border border-[var(--border-medium)] flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary-gold)] hover:text-[var(--primary-gold)] transition-all cursor-pointer"
              aria-label="Sonraki slayt"
            >
              <ion-icon name="chevron-forward-outline" style={{ fontSize: '0.9rem' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
