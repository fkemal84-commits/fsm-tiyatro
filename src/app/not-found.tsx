'use client';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'white' }}>
      <h1 style={{ fontSize: '4rem', color: '#D4AF37' }}>404</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Aradığınız sayfa sahnede bulunamadı.</p>
      <a href="/" style={{ padding: '0.8rem 2rem', backgroundColor: '#D4AF37', color: '#000', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
        Ana Sayfaya Dön
      </a>
    </div>
  );
}
