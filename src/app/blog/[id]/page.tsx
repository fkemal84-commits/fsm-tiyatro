import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('posts').doc(resolvedParams.id).get();
  if (!docSnap.exists) return { title: 'Yazı Bulunamadı' };
  const post = docSnap.data() as any;
  
  return {
    title: post.title,
    description: post.content.substring(0, 160) + "...",
    openGraph: {
      title: post.title,
      description: post.content.substring(0, 160) + "...",
      images: [post.imageUrl],
    }
  };
}

export default async function BlogDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('posts').doc(resolvedParams.id).get();
  
  if (!docSnap.exists) notFound();
  const post = docSnap.data() as any;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* PARALLAX HERO SECTION */}
      <div 
        className="relative h-[50vh] w-full flex items-end justify-center padding-bottom-3"
      >
        <Image 
          src={post.imageUrl} 
          alt={post.title} 
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark)] to-transparent opacity-60"></div>
        <h1 className="relative serif-font z-10 text-[3.5rem] color-white text-center px-4 max-w-[800px] mb-12" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
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
