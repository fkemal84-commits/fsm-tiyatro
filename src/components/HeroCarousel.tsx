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

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Arka plan görseli */}
      <div className="absolute inset-0 z-0 transition-all duration-700">
        {slide.imageUrl ? (
          <Image
            src={slide.imageUrl}
            alt={slide.title}
            fill
            className="object-cover object-top transition-opacity duration-700"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-dark)] via-[#111] to-[#0a0a0a]" />
        )}
        {/* Karanlık overlay — metin okunabilirliği */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-dark)] via-[var(--bg-dark)]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark)] via-transparent to-transparent" />
      </div>

      {/* İçerik */}
      <div className="relative z-10 pt-28 pb-14 sm:pt-36 sm:pb-24 px-[5%] max-w-[1380px] mx-auto min-h-[80vh] sm:min-h-[88vh] flex flex-col justify-center">
        <div className="max-w-3xl animate-fadeIn" key={slide.id}>
          
          {/* Etiket */}
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-[var(--primary-gold-border)] bg-[var(--primary-gold-dim)] text-[var(--primary-gold)] text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-gold)] animate-pulse" />
            {slide.tag}
          </div>

          {/* Başlık */}
          <h1 className="serif-font text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-[var(--text-main)] leading-[1.1] mb-4 break-words">
            {slide.title}
          </h1>

          {/* Alt başlık */}
          {slide.subtitle && (
            <p className="text-sm sm:text-base md:text-lg text-[var(--text-muted)] max-w-xl font-light leading-relaxed mb-6 sm:mb-8">
              {slide.subtitle}
            </p>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Link
              href={slide.href}
              className="btn btn-primary px-6 py-3 text-xs sm:text-sm font-bold tracking-wider text-center"
            >
              {slide.type === 'post' ? 'Yazıyı Oku' : slide.type === 'play' ? 'Oyun Detayları' : 'Daha Fazla'}
            </Link>
            {showTicketQuery ? (
              <Link href="/biletimi-bul" className="btn btn-outline px-6 py-3 text-xs sm:text-sm tracking-wider text-center">
                Biletimi Sorgula
              </Link>
            ) : (
              <Link href="/oyunlar" className="btn btn-outline px-6 py-3 text-xs sm:text-sm tracking-wider text-center">
                Oyunları İncele
              </Link>
            )}
          </div>
        </div>

        {/* Alt bar: meta bilgileri */}
        <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4 sm:gap-6 text-left text-xs">
            <div>
              <span className="block text-[9px] sm:text-[10px] text-[var(--text-dim)] uppercase font-bold tracking-widest">TOPLULUK</span>
              <span className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">FSM Tiyatro Kulübü</span>
            </div>
            <div>
              <span className="block text-[9px] sm:text-[10px] text-[var(--text-dim)] uppercase font-bold tracking-widest">YERLEŞKE</span>
              <span className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">Haliç Yerleşkesi</span>
            </div>
            {slide.date && (
              <div>
                <span className="block text-[9px] sm:text-[10px] text-[var(--text-dim)] uppercase font-bold tracking-widest">TARİH</span>
                <span className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">{slide.date}</span>
              </div>
            )}
          </div>

          {/* Slayt navigasyonu */}
          {slides.length > 1 && (
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                onClick={prev}
                className="w-8 h-8 rounded-full border border-[var(--border-medium)] flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary-gold)] hover:text-[var(--primary-gold)] transition-all cursor-pointer"
                aria-label="Önceki slayt"
              >
                <ion-icon name="chevron-back-outline" style={{ fontSize: '0.9rem' }} />
              </button>

              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${
                      i === current
                        ? 'w-5 h-1.5 bg-[var(--primary-gold)]'
                        : 'w-1.5 h-1.5 bg-[var(--border-medium)] hover:bg-[var(--text-dim)]'
                    }`}
                    aria-label={`Slayt ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="w-8 h-8 rounded-full border border-[var(--border-medium)] flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary-gold)] hover:text-[var(--primary-gold)] transition-all cursor-pointer"
                aria-label="Sonraki slayt"
              >
                <ion-icon name="chevron-forward-outline" style={{ fontSize: '0.9rem' }} />
              </button>

              <span className="text-[10px] text-[var(--text-dim)] font-mono ml-1">
                {current + 1}/{slides.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
