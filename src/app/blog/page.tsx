import ScrollReveal from "@/components/ScrollReveal";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export default async function Blog() {
  const snapshot = await adminDb.collection('posts').orderBy('createdAt', 'desc').get();
  const posts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
      } as any;
  });

  return (
    <main>
      <header style={{ padding: '12rem 5% 4rem', textAlign: 'center', background: 'radial-gradient(circle at center top, rgba(212, 175, 55, 0.15) 0%, var(--bg-dark) 80%)', borderBottom: 'var(--glass-border)' }}>
        <h1 className="serif-font" style={{ fontSize: '4rem', color: '#fff', marginBottom: '1rem' }}>Kulis Arkası</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>Kulübümüzle ilgili en güncel haberler, duyurular, prova notları ve sponsorluk gelişmeleri.</p>
      </header>

      <section className="section">
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {posts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Henüz bir blog yazısı eklenmemiş.</p>
          ) : (
            posts.map(post => (
              <ScrollReveal key={post.id}>
                <article style={{ display: 'flex', background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
                    <img src={post.imageUrl || ''} alt={post.title} style={{ width: '350px', height: '100%', objectFit: 'cover', borderRight: '1px solid rgba(255,255,255,0.05)' }} />
                    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--primary-gold)', fontWeight: 600, letterSpacing: '1px' }}>
                            <span>{post.category}</span><span>&bull;</span><span>{post.createdAt.toLocaleDateString('tr-TR')}</span>
                        </div>
                        <h2 className="serif-font" style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '1rem', lineHeight: 1.3 }}>{post.title}</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{post.content.substring(0, 150)}...</p>
                        <div><a href={`/blog/${post.id}`} style={{ color: 'var(--primary-gold)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>Devamını Oku</a></div>
                    </div>
                </article>
              </ScrollReveal>
            ))
          )}

        </div>
      </section>
    </main>
  );
}
