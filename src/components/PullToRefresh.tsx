'use client';

import { useState, useEffect, useCallback } from 'react';

const PULL_THRESHOLD = 80; // Yenileme için gereken çekme mesafesi (px)

export default function PullToRefresh() {
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Sayfanın en üstünde miyiz? (Küçük bir tolerans payı bırakıyoruz)
    const isAtTop = window.scrollY <= 5;
    
    if (isAtTop && !isRefreshing) {
      setStartPos({ x: e.touches[0].pageX, y: e.touches[0].pageY });
      setCanPull(true);
      setIsHorizontalSwipe(false);
    } else {
      setCanPull(false);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!canPull || isRefreshing || isHorizontalSwipe) return;

    const currentX = e.touches[0].pageX;
    const currentY = e.touches[0].pageY;
    
    const deltaX = Math.abs(currentX - startPos.x);
    const deltaY = currentY - startPos.y;

    // SADECE dikey hareket varsa ve aşağı doğru çekiliyorsa devam et
    // Eğer yatay hareket baskınsa (Geri gitme hareketi gibi), sisteme yolu aç
    if (deltaX > Math.abs(deltaY) && deltaX > 10) {
      setIsHorizontalSwipe(true);
      setPullDistance(0);
      return;
    }

    if (deltaY > 0) {
      // Logaritmik direnç efekti (daha kaliteli bir çekme hissi sağlar)
      const resistance = 0.4;
      const easedDistance = Math.min(deltaY * resistance, PULL_THRESHOLD + 40);
      setPullDistance(easedDistance);
      
      // Native browser refresh'i ve bounce'u engellemek için
      if (easedDistance > 5 && e.cancelable) {
        e.preventDefault();
      }
    }
  }, [canPull, isRefreshing, isHorizontalSwipe, startPos]);

  const handleTouchEnd = useCallback(() => {
    if (!canPull || isRefreshing || isHorizontalSwipe) {
      setPullDistance(0);
      return;
    }

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      
      // Android/iOS haptic feedback
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(20);
        } catch (e) {}
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } else {
      setPullDistance(0);
    }
    setCanPull(false);
  }, [canPull, isRefreshing, isHorizontalSwipe, pullDistance]);

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
