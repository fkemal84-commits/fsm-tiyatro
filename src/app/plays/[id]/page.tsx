import { adminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';

export default async function PlayDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('plays').doc(resolvedParams.id).get();
  
  if (!docSnap.exists) notFound();
  const play = docSnap.data() as any;

  // Virgülle ayrılmış çok sayıdaki imajı diziye (Array) dökme
  const gallery = play.galleryUrls ? (play.galleryUrls as string).split(',').filter((u: string) => u.trim() !== '') : [];

  // YouTube ID Ayıklayıcı
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = play.videoUrl ? getYoutubeId(play.videoUrl) : null;

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
        
        {/* VİDEO PLAYER (EĞER VARSA) */}
        {videoId && (
          <div style={{ marginBottom: '3rem', borderRadius: '12px', overflow: 'hidden', border: 'var(--glass-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                src={`https://www.youtube.com/embed/${videoId}`}
                title={`${play.title} Video`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

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
