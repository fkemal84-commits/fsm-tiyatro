'use client';

import { useState, useEffect, useCallback } from 'react';

const PULL_THRESHOLD = 80; // Yenileme için gereken çekme mesafesi (px)

export default function PullToRefresh() {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Sadece sayfanın en üstündeyken çekme hareketine izin ver
    if (window.scrollY === 0) {
      setStartY(e.touches[0].pageY);
      setCanPull(true);
    } else {
      setCanPull(false);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!canPull || isRefreshing) return;

    const currentY = e.touches[0].pageY;
    const distance = currentY - startY;

    if (distance > 0) {
      // Direnç efekti (daha yavaş çekilme hissi)
      const easedDistance = Math.min(distance * 0.4, PULL_THRESHOLD + 20);
      setPullDistance(easedDistance);
      
      // Sayfa kaymasını engelle (sadece çekme sırasında)
      if (easedDistance > 10 && e.cancelable) {
        e.preventDefault();
      }
    }
  }, [canPull, isRefreshing, startY]);

  const handleTouchEnd = useCallback(() => {
    if (!canPull || isRefreshing) return;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      
      // Sayfayı yenile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      setPullDistance(0);
    }
    setCanPull(false);
  }, [canPull, isRefreshing, pullDistance]);

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (pullDistance <= 0 && !isRefreshing) return null;

  return (
    <div 
      className="fixed top-0 left-0 w-full flex justify-center z-[10001] pointer-events-none transition-transform duration-200"
      style={{ 
        transform: `translateY(${pullDistance}px)`,
        opacity: Math.min(pullDistance / PULL_THRESHOLD, 1)
      }}
    >
      <div className="bg-[var(--primary-gold)] text-black rounded-full p-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center animate-fadeIn">
        <ion-icon 
          name={isRefreshing ? "sync-outline" : "arrow-down-outline"} 
          className={`${isRefreshing ? 'animate-spin' : ''}`}
          style={{ fontSize: '24px' }}
        ></ion-icon>
      </div>
    </div>
  );
}
