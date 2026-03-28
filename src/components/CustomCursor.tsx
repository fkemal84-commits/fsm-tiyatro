'use client';

import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setHidden(false);

      const target = e.target as HTMLElement;
      setIsPointer(
        window.getComputedStyle(target).cursor === 'pointer' || 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON'
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
    <>
      <div 
        className="fixed pointer-events-none z-[9999] transition-transform duration-100 ease-out"
        style={{ 
          left: position.x, 
          top: position.y, 
          transform: `translate(-50%, -50%) scale(${isPointer ? 2.5 : 1})`,
          opacity: hidden ? 0 : 1
        }}
      >
        <div className="w-6 h-6 rounded-full border border-[var(--primary-gold)] opacity-30"></div>
      </div>
      <div 
        className="fixed pointer-events-none z-[9999] transition-transform duration-200 ease-out"
        style={{ 
          left: position.x, 
          top: position.y, 
          transform: `translate(-50%, -50%)`,
          opacity: hidden ? 0 : 1
        }}
      >
        <div className="w-1 h-1 rounded-full bg-[var(--primary-gold)] shadow-[0_0_10px_var(--primary-gold)]"></div>
      </div>
    </>
  );
}
