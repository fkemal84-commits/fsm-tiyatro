'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('CRITICAL APP ERROR:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center bg-[var(--bg-dark)]">
      <div className="text-6xl mb-6">🏜️</div>
      <h1 className="serif-font text-4xl text-[var(--primary-gold)] mb-4">Bir Perde Hatası Oluştu</h1>
      <p className="text-[var(--text-muted)] max-w-md mb-8">
        Üzgünüz, teknik bir aksaklık nedeniyle sahneye ara vermek zorunda kaldık. Bu durumu ekibimize raporladık.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="btn btn-primary"
        >
          Yeniden Dene
        </button>
        <a href="/" className="btn btn-outline border-white/10 text-white">
          Ana Sayfaya Dön
        </a>
      </div>
      <div className="mt-12 p-4 bg-white/5 rounded text-xs font-mono text-white/30 truncate max-w-lg">
        Error ID: {error.digest || 'Unknown System Fault'}
      </div>
    </div>
  );
}
