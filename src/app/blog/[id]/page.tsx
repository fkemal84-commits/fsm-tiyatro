import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BlogInteractions from '@/components/BlogInteractions';

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('posts').doc(resolvedParams.id).get();
  if (!docSnap.exists) return { title: 'Yazı Bulunamadı' };
  const post = docSnap.data() as any;
  
  return {
    title: post.title,
    description: (post.content || '').substring(0, 160) + "...",
    openGraph: {
      title: post.title,
      description: (post.content || '').substring(0, 160) + "...",
      images: post.imageUrl ? [post.imageUrl] : [],
    }
  };
}

export default async function BlogDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('posts').doc(resolvedParams.id).get();
  
  if (!docSnap.exists) notFound();
  const post = docSnap.data() as any;

  // Yorumları çek
  const commentsSnap = await adminDb.collection('posts').doc(resolvedParams.id).collection('comments').orderBy('createdAt', 'desc').get();
  const comments = commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  // Oturum bilgisini çek
  const session = await getServerSession(authOptions);
  const currentUserEmail = session?.user?.email || undefined;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* HERO SECTION */}
      <div 
        className="relative h-[45vh] min-h-[320px] w-full flex items-end justify-center pb-8"
      >
        {post.imageUrl ? (
          <Image 
            src={post.imageUrl} 
            alt={post.title} 
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--bg-surface-elevated)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark)] via-[var(--bg-dark)]/60 to-transparent"></div>
        <h1 className="relative serif-font z-10 text-3xl sm:text-4xl md:text-5xl text-white text-center px-4 max-w-[900px] mb-8 leading-tight drop-shadow-md">
          {post.title}
        </h1>
      </div>

      <div style={{ maxWidth: '850px', margin: '-2rem auto 4rem', position: 'relative', zIndex: 10, background: 'var(--bg-surface)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-stage)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ color: 'var(--primary-gold)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{post.category}</span>
          <span style={{ color: 'var(--text-dim)' }}>{post.author ? `🖋️ ${post.author}` : 'Kulüp Yazısı'} • {post.createdAt ? new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
        </div>
        
        <div style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-main)', whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>
          {post.content}
        </div>

        <BlogInteractions 
          postId={resolvedParams.id} 
          initialLikes={post.likes || []} 
          initialComments={comments} 
          currentUserEmail={currentUserEmail}
        />
      </div>
    </div>
  );
}
