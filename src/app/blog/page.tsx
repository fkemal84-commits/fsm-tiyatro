import ScrollReveal from "@/components/ScrollReveal";
import { adminDb } from "@/lib/firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addPost, deletePost } from "@/app/actions";
import DeleteButton from "@/components/DeleteButton";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Blog",
  description: "FSM Tiyatro kulisinden haberler, makaleler ve en güncel duyurular.",
};

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

  const categories = ['Kulis', 'Makale', 'Blog', 'Haber'];

  const snapshot = await adminDb.collection('posts').orderBy('createdAt', 'desc').get();
  const allPosts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
          id: doc.id,
          ...data,
          category: data.category || 'Blog',
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
      } as any;
  });

  return (
    <main>
      <header style={{ padding: '12rem 5% 4rem', textAlign: 'center', background: 'radial-gradient(circle at center top, rgba(212, 175, 55, 0.15) 0%, var(--bg-dark) 80%)', borderBottom: 'var(--glass-border)' }}>
        <h1 className="serif-font" style={{ fontSize: '4rem', color: '#fff', marginBottom: '1rem' }}>Sahnemizin Güncesi</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>FSM Tiyatro'dan haberler, makaleler ve kulis notları.</p>
        
        {/* EDİTÖR HIZLI YAZI PANELİ */}
        {canPost && (
          <div className="glass-card" style={{ maxWidth: '800px', margin: '3rem auto 0', textAlign: 'left', padding: '2rem' }}>
            <h2 style={{ color: 'var(--primary-gold)', fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <ion-icon name="create-outline"></ion-icon> Yeni Yazı Paylaş
            </h2>
            <form action={addPost} encType="multipart/form-data" className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  type="text" 
                  name="title"
                  placeholder="Yazı Başlığı" 
                  className="flex-1 p-4 rounded-lg border border-white/10 bg-black/40 text-white text-lg"
                  required
                />
                <select 
                  name="category"
                  className="p-4 rounded-lg border border-white/10 bg-black/40 text-white text-lg appearance-none cursor-pointer hover:border-[#D4AF3744] transition-all"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat.toUpperCase()} style={{ background: '#0a0a0c' }}>{cat}</option>
                  ))}
                </select>
              </div>
              <textarea 
                name="content"
                placeholder="Yazının içeriğini buraya dökün..." 
                rows={6}
                className="p-4 rounded-lg border border-white/10 bg-black/40 text-white text-base leading-relaxed"
                required
              ></textarea>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#a0a0b0] font-semibold">Kapak Fotoğrafı (Maks 2MB):</label>
                  <input 
                    type="file" 
                    name="image" 
                    accept="image/jpeg,image/png,image/webp" 
                    className="text-xs text-[#a0a0b0]" 
                  />
                </div>
                <button type="submit" className="btn btn-primary px-10 py-3">Hemen Yayınla</button>
              </div>
            </form>
          </div>
        )}
      </header>

      <section className="section">
        <div className="max-w-[1000px] mx-auto flex flex-col gap-16">
          
          {categories.map(category => {
            const categoryPosts = allPosts.filter(p => p.category?.toUpperCase() === category.toUpperCase());
            if (categoryPosts.length === 0) return null;

            return (
              <div key={category} className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                  <h2 className="serif-font text-3xl text-[#D4AF37]">{category}</h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-[#D4AF3744] to-transparent"></div>
                </div>

                <div className="flex flex-col gap-8">
                  {categoryPosts.map(post => (
                    <ScrollReveal key={post.id}>
                      <article className="flex flex-col md:flex-row bg-[rgba(20,20,24,0.6)] backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#D4AF3744] h-full">
                          {post.imageUrl && (
                            <div className="relative w-full md:w-[420px] md:min-w-[420px] h-[300px] md:h-auto overflow-hidden">
                              <Image 
                                src={post.imageUrl} 
                                alt={post.title} 
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 420px"
                              />
                            </div>
                          )}
                          <div className="p-6 md:p-10 flex flex-col justify-center flex-1">
                              <div className="flex flex-wrap gap-4 mb-4 text-[0.85rem] text-[#D4AF37] font-semibold tracking-wider uppercase">
                                  <span>{post.category}</span><span>&bull;</span><span>{post.createdAt.toLocaleDateString('tr-TR')}</span>
                                  {post.author && (
                                    <>
                                      <span>&bull;</span>
                                      <span className="text-white/90 normal-case font-normal">🖋️ {post.author} yazdı</span>
                                    </>
                                  )}
                              </div>
                              <h2 className="serif-font text-[1.8rem] text-white mb-4 leading-tight">{post.title}</h2>
                              
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
                  ))}
                </div>
              </div>
            );
          })}

          {allPosts.length === 0 && (
            <p className="text-center text-[#a0a0b0] py-10 italic">Henüz bir blog yazısı eklenmemiş.</p>
          )}

        </div>
      </section>
    </main>
  );
}
