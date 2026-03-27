import { adminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';

export default async function BlogDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('posts').doc(resolvedParams.id).get();
  
  if (!docSnap.exists) notFound();
  const post = docSnap.data() as any;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* PARALLAX HERO SECTION */}
      <div 
        className="parallax-hero"
        style={{ 
          height: '50vh', 
          width: '100%', 
          backgroundImage: `linear-gradient(to top, var(--bg-dark), rgba(0,0,0,0.5)), url('${post.imageUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '3rem'
        }}
      >
        <h1 className="serif-font" style={{ fontSize: '3.5rem', color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,0.8)', textAlign: 'center', padding: '0 1rem', maxWidth: '800px' }}>
          {post.title}
        </h1>
      </div>

      <div style={{ maxWidth: '800px', margin: '-3rem auto 4rem', position: 'relative', zIndex: 10, background: 'var(--bg-card)', padding: '3rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <span style={{ color: 'var(--primary-gold)', fontWeight: 'bold' }}>{post.category}</span>
          <span>{post.author ? `🖋️ ${post.author} yazdı` : 'Kulüp Yazısı'} • {new Date(post.createdAt).toLocaleDateString('tr-TR')}</span>
        </div>
        
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </p>
      </div>
    </div>
  );
}
