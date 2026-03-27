import ScrollReveal from "@/components/ScrollReveal";
import { adminDb } from "@/lib/firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addPost, deletePost } from "@/app/actions";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = 'force-dynamic';

export default async function Blog() {
  const session = await getServerSession(authOptions);
  let userRole = (session?.user as any)?.role;

  // Güvenlik ve Güncellik Katmanı: Eğer session var ama rol gelmediyse veya 
  // kullanıcı yeni yetkilendirildiyse DB'den en güncel hali çekiyoruz.
  if (session?.user?.email) {
      const uSnap = await adminDb.collection('users').where('email', '==', session.user.email).limit(1).get();
      if (!uSnap.empty) {
          userRole = uSnap.docs[0].data().role;
      }
  }

  const canPost = userRole === 'SUPERADMIN' || userRole === 'ADMIN' || userRole === 'EDITOR';

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
        
        {/* EDİTÖR HIZLI YAZI PANELİ */}
        {canPost && (
          <div className="glass-card" style={{ maxWidth: '800px', margin: '3rem auto 0', textAlign: 'left', padding: '2rem' }}>
            <h2 style={{ color: 'var(--primary-gold)', fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <ion-icon name="create-outline"></ion-icon> Yeni Blog Yazısı Paylaş
            </h2>
            <form action={addPost} encType="multipart/form-data" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <input 
                type="text" 
                name="title"
                placeholder="Yazı Başlığı" 
                style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '1.1rem' }}
                required
              />
              <textarea 
                name="content"
                placeholder="Yazının içeriğini buraya dökün..." 
                rows={6}
                style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '1rem', lineHeight: '1.6' }}
                required
              ></textarea>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kapak Fotoğrafı (Maksimum 2MB - JPG, PNG, WEBP):</label>
                  <input 
                    type="file" 
                    name="image" 
                    accept="image/jpeg,image/png,image/webp" 
                    style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} 
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2.5rem' }}>Hemen Yayınla</button>
              </div>
            </form>
          </div>
        )}
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--primary-gold)', fontWeight: 600, letterSpacing: '1px' }}>
                            <span>{post.category}</span><span>&bull;</span><span>{post.createdAt.toLocaleDateString('tr-TR')}</span>
                            {post.author && (
                              <>
                                <span>&bull;</span>
                                <span style={{ color: '#fff', opacity: 0.9 }}>🖋️ {post.author} yazdı</span>
                              </>
                            )}
                        </div>
                        <h2 className="serif-font" style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '1rem', lineHeight: 1.3 }}>{post.title}</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{post.content.substring(0, 150)}...</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                          <a href={`/blog/${post.id}`} style={{ color: 'var(--primary-gold)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>Devamını Oku</a>
                          {(userRole === 'SUPERADMIN' || userRole === 'ADMIN' || (userRole === 'EDITOR' && post.authorEmail === session?.user?.email)) && (
                            <DeleteButton 
                              action={deletePost} 
                              id={post.id} 
                              name={post.title} 
                              idFieldName="postId" 
                              confirmMessage="Bu yazıyı silmek istediğine emin misin?"
                            />
                          )}
                        </div>
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
