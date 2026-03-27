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
                <article className="flex flex-col md:flex-row bg-[rgba(20,20,24,0.6)] backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#D4AF3744] h-full">
                    {post.imageUrl && (
                      <div className="w-full md:w-[420px] md:min-w-[420px] max-h-[50vh] md:max-h-none overflow-hidden">
                        <img 
                          src={post.imageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 md:p-10 flex flex-col justify-center flex-1">
                        <div className="flex flex-wrap gap-4 mb-4 text-[0.85rem] text-[#D4AF37] font-semibold tracking-wider">
                            <span>{post.category}</span><span>&bull;</span><span>{post.createdAt.toLocaleDateString('tr-TR')}</span>
                            {post.author && (
                              <>
                                <span>&bull;</span>
                                <span className="text-white/90">🖋️ {post.author}</span>
                              </>
                            )}
                        </div>
                        <h2 className="serif-font text-[1.8rem] text-white mb-4 leading-tight">{post.title}</h2>
                        
                        {/* Karakter sınırını 1200'e çekip, desktop'ta 12 satıra kadar izin verdik (dikey fotoyu doldurur) */}
                        <p className="text-[#a0a0b0] mb-8 text-[1.05rem] leading-relaxed line-clamp-5 md:line-clamp-[12]">
                          {post.content.length > 1200 ? `${post.content.substring(0, 1200)}...` : post.content}
                        </p>
                        
                        <div className="flex justify-between items-center mt-auto">
                          <a href={`/blog/${post.id}`} className="text-[#D4AF37] font-semibold inline-flex items-center gap-2 no-underline hover:brightness-125 transition-all text-[1.1rem]">Devamını Oku</a>
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
