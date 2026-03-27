import { adminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';

export default async function PlayDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('plays').doc(resolvedParams.id).get();
  
  if (!docSnap.exists) notFound();
  const play = docSnap.data() as any;

  // Virgülle ayrılmış çok sayıdaki imajı diziye (Array) dökme
  const gallery = play.galleryUrls ? (play.galleryUrls as string).split(',').filter((u: string) => u.trim() !== '') : [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* PARALLAX HERO SECTION */}
      <div 
        className="parallax-hero"
        style={{ 
          height: '60vh', 
          width: '100%', 
          backgroundImage: `linear-gradient(to top, var(--bg-dark), rgba(0,0,0,0.3)), url('${play.imageUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed', // Kaydırmada asılı kalma (Parallax) efekti
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '3rem'
        }}
      >
        <h1 className="serif-font" style={{ fontSize: '4rem', color: 'var(--primary-gold)', textShadow: '0 4px 20px rgba(0,0,0,0.8)', textAlign: 'center', padding: '0 1rem' }}>
          {play.title}
        </h1>
      </div>

      <div style={{ maxWidth: '800px', margin: '-3rem auto 4rem', position: 'relative', zIndex: 10, background: 'var(--bg-card)', padding: '3rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <span style={{ padding: '0.4rem 1rem', background: 'rgba(212,175,55,0.1)', color: 'var(--primary-gold)', borderRadius: '20px', fontWeight: 'bold' }}>{play.year.toUpperCase()}</span>
        </div>
        
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
          {play.description}
        </p>

        {/* KAYDIRMALI GALERİ (CAROUSEL SLIDER) */}
        {gallery.length > 0 && (
          <div style={{ marginTop: '4rem' }}>
             <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Sahne Arkası & Galeri</h3>
             <div style={{ display: 'flex', overflowX: 'auto', gap: '1rem', paddingBottom: '1rem', scrollSnapType: 'x mandatory' }} className="hide-scrollbar">
                {gallery.map((url: string, i: number) => (
                  <img key={i} src={url.trim()} alt={`${play.title} Galerisi - ${i}`} style={{ height: '350px', width: 'auto', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, scrollSnapAlign: 'start', border: '1px solid rgba(255,255,255,0.1)' }} />
                ))}
             </div>
             <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem' }}>Fotoğrafları kaydırmak için sağa sürükleyin</p>
          </div>
        )}
      </div>
    </div>
  );
}
