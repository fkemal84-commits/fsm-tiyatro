'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[NEXT_APP_ERROR]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center bg-[var(--bg-dark)]">
      <div className="text-5xl mb-4">🎭</div>
      <h1 className="serif-font text-3xl sm:text-4xl text-[var(--primary-gold)] mb-3">
        Sayfa Yüklenirken Bir Sorun Oluştu
      </h1>
      <p className="text-[var(--text-muted)] text-sm max-w-md mb-6 leading-relaxed">
        İçerik yüklenirken geçici bir bağlantı hatası meydana geldi. Sayfayı yenileyerek veya aşağıdaki butonu kullanarak tekrar deneyebilirsiniz.
      </p>

      {error?.message && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-mono max-w-md break-words">
          {error.message}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="btn btn-primary text-xs px-6 py-2.5 font-bold"
        >
          Yeniden Dene
        </button>
        <Link href="/" className="btn btn-outline text-xs px-6 py-2.5">
          Ana Sayfayı Aç
        </Link>
      </div>
    </div>
  );
}
