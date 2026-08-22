'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#050505', color: '#fff', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>Sistemde Kritik Bir Hata Oluştu!</h2>
          <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Beklenmeyen bir hata nedeniyle sunucu tarafında sorun yaşandı.</p>
          <button 
            onClick={() => reset()}
            style={{ padding: '0.8rem 2rem', backgroundColor: '#D4AF37', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Yeniden Dene
          </button>
        </div>
      </body>
    </html>
  );
}
