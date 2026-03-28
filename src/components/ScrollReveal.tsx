'use client';

import { useEffect, useRef } from 'react';

export default function ScrollReveal({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (revealRef.current) {
      observer.observe(revealRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={revealRef} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
