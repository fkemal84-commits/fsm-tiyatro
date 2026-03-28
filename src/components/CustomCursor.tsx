'use client';

import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorGlowRef = useRef<HTMLDivElement>(null);
  const [isPointer, setIsPointer] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setHidden(false);
      const { clientX: x, clientY: y } = e;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      if (cursorGlowRef.current) {
        // Işık hafif gecikmeyle (akıcı) takip edebilir ama dot anlık olmalı
        cursorGlowRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      const target = e.target as HTMLElement;
      setIsPointer(
        window.getComputedStyle(target).cursor === 'pointer' || 
        ['A', 'BUTTON', 'INPUT', 'LABEL', 'SELECT'].includes(target.tagName)
      );
    };

    const handleMouseLeave = () => setHidden(true);
    const handleMouseEnter = () => setHidden(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-[99999] overflow-hidden ${hidden ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
      {/* ANA NOKTA (ZERO LAG) */}
      <div 
        ref={cursorDotRef}
        className="absolute top-0 left-0 w-2 h-2 -ml-1 -mt-1 rounded-full bg-[var(--primary-gold)] shadow-[0_0_10px_var(--primary-gold)] will-change-transform"
      ></div>
      
      {/* IŞIK HALESİ (BAŞROL GİBİ TAKİP EDER) */}
      <div 
        ref={cursorGlowRef}
        className={`absolute top-0 left-0 w-10 h-10 -ml-5 -mt-5 rounded-full border border-[var(--primary-gold)] opacity-20 will-change-transform transition-transform duration-300 ease-out ${isPointer ? 'scale-[2.5]' : 'scale-100'}`}
      ></div>
    </div>
  );
}
