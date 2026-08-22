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
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
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
      <div className="relative z-10 pt-40 pb-28 px-[5%] max-w-[1380px] mx-auto min-h-[92vh] flex flex-col justify-center">
        <div className="max-w-3xl animate-fadeIn" key={slide.id}>
          
          {/* Etiket */}
          <div className="inline-flex items-center gap-2.5 mb-5 px-3.5 py-1.5 rounded-full border border-[var(--primary-gold-border)] bg-[var(--primary-gold-dim)] text-[var(--primary-gold)] text-[11px] font-bold tracking-[0.18em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-gold)] animate-pulse" />
            {slide.tag}
          </div>

          {/* Başlık */}
          <h1 className="serif-font text-5xl sm:text-6xl md:text-7xl text-[var(--text-main)] leading-[1.05] mb-5">
            {slide.title}
          </h1>

          {/* Alt başlık */}
          {slide.subtitle && (
            <p className="text-lg text-[var(--text-muted)] max-w-xl font-light leading-relaxed mb-8">
              {slide.subtitle}
            </p>
          )}

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={slide.href}
              className="btn btn-primary px-7 py-3.5 text-sm font-bold tracking-wider"
            >
              {slide.type === 'post' ? 'Yazıyı Oku' : slide.type === 'play' ? 'Oyun Detayları' : 'Daha Fazla'}
            </Link>
            <Link href="/biletimi-bul" className="btn btn-outline px-7 py-3.5 text-sm tracking-wider">
              Biletimi Sorgula
            </Link>
          </div>
        </div>

        {/* Alt bar: meta bilgileri */}
        <div className="mt-16 pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-6 text-left">
            <div>
              <span className="block text-[10px] text-[var(--text-dim)] uppercase font-bold tracking-widest">TOPLULUK</span>
              <span className="text-sm font-semibold text-[var(--text-main)]">FSM Sinema ve Tiyatro</span>
            </div>
            <div>
              <span className="block text-[10px] text-[var(--text-dim)] uppercase font-bold tracking-widest">YERLEŞKE</span>
              <span className="text-sm font-semibold text-[var(--text-main)]">Haliç Yerleşkesi & Sahne</span>
            </div>
            {slide.date && (
              <div>
                <span className="block text-[10px] text-[var(--text-dim)] uppercase font-bold tracking-widest">TARİH</span>
                <span className="text-sm font-semibold text-[var(--text-main)]">{slide.date}</span>
              </div>
            )}
          </div>

          {/* Slayt navigasyonu */}
          {slides.length > 1 && (
            <div className="flex items-center gap-3">
              <button
                onClick={prev}
                className="w-9 h-9 rounded-full border border-[var(--border-medium)] flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary-gold)] hover:text-[var(--primary-gold)] transition-all"
                aria-label="Önceki slayt"
              >
                <ion-icon name="chevron-back-outline" style={{ fontSize: '1rem' }} />
              </button>

              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === current
                        ? 'w-6 h-2 bg-[var(--primary-gold)]'
                        : 'w-2 h-2 bg-[var(--border-medium)] hover:bg-[var(--text-dim)]'
                    }`}
                    aria-label={`Slayt ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="w-9 h-9 rounded-full border border-[var(--border-medium)] flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary-gold)] hover:text-[var(--primary-gold)] transition-all"
                aria-label="Sonraki slayt"
              >
                <ion-icon name="chevron-forward-outline" style={{ fontSize: '1rem' }} />
              </button>

              <span className="text-[11px] text-[var(--text-dim)] font-mono ml-1">
                {current + 1}/{slides.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
