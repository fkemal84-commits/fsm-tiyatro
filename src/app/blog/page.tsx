import ScrollReveal from "@/components/ScrollReveal";
import { adminDb } from "@/lib/firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deletePost } from "@/app/actions";
import DeleteButton from "@/components/DeleteButton";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog & Kulis Güncesi",
  description: "FSM Tiyatro kulisinden haberler, makaleler ve en güncel duyurular.",
};

export const dynamic = 'force-dynamic';

export default async function Blog() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const isAdminMode = (session?.user as any)?.isAdminMode === true;

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
    <main className="min-h-screen bg-[var(--bg-dark)] pt-36 pb-24">
      {/* Header */}
      <header className="max-w-[1380px] mx-auto px-[5%] text-center mb-16">
        <span className="editorial-tag text-[var(--primary-gold)] block mb-3">KULİS VE SANAT YAZILARI</span>
        <h1 className="serif-font text-5xl sm:text-6xl md:text-7xl text-[var(--text-main)] mb-4">
          Sahnemizin Güncesi
        </h1>
        <p className="text-[var(--text-muted)] max-w-xl mx-auto text-base sm:text-lg font-light leading-relaxed">
          FSM Tiyatro kulisinden haberler, sahne arkası notları, oyun incelemeleri ve sanat yazıları.
        </p>
      </header>

      {/* Blog İçerik Listesi */}
      <section className="max-w-[1200px] mx-auto px-[5%]">
        <ScrollReveal>
          <div className="flex flex-col gap-20">
            {categories.map(category => {
              const categoryPosts = allPosts.filter(p => p.category?.toUpperCase() === category.toUpperCase());
              if (categoryPosts.length === 0) return null;

              return (
                <div key={category} className="flex flex-col gap-8">
                  <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-subtle)]">
                    <span className="editorial-tag text-[var(--primary-gold)] text-xs">{category}</span>
                    <h2 className="serif-font text-2xl sm:text-3xl text-[var(--text-main)]">{category} Yazıları</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--border-medium)] to-transparent"></div>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    {categoryPosts.map(post => (
                      <ScrollReveal key={post.id}>
                        <article className="editorial-card group p-0 overflow-hidden flex flex-col md:flex-row transition-all duration-300 hover:border-[var(--primary-gold-border)]">
                          {post.imageUrl && (
                            <div className="relative w-full md:w-[380px] md:min-w-[380px] aspect-video md:aspect-auto overflow-hidden bg-[var(--bg-surface-elevated)] border-b md:border-b-0 md:border-r border-[var(--border-subtle)]">
                              <Image 
                                src={post.imageUrl} 
                                alt={post.title} 
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 380px"
                              />
                            </div>
                          )}
                          <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
                            <div>
                              <div className="flex flex-wrap items-center gap-3 mb-3 text-xs font-semibold text-[var(--primary-gold)] uppercase tracking-wider">
                                <span>{post.category}</span>
                                <span>&bull;</span>
                                <span className="text-[var(--text-dim)] font-mono">{post.createdAt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                {post.author && (
                                  <>
                                    <span>&bull;</span>
                                    <span className="text-[var(--text-muted)] normal-case font-normal">🖋️ {post.author}</span>
                                  </>
                                )}
                              </div>
                              <h3 className="serif-font text-2xl md:text-3xl text-[var(--text-main)] mb-4 leading-snug group-hover:text-[var(--primary-gold)] transition-colors">
                                <Link href={`/blog/${post.id}`}>
                                  {post.title}
                                </Link>
                              </h3>
                              
                              <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed line-clamp-3 md:line-clamp-4 font-light mb-6">
                                {post.content}
                              </p>
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 border-t border-[var(--border-subtle)] mt-auto">
                              <Link 
                                href={`/blog/${post.id}`} 
                                className="text-xs font-bold text-[var(--primary-gold)] uppercase tracking-wider hover:underline flex items-center gap-1.5"
                              >
                                Devamını Oku →
                              </Link>
                              {isAdminMode && (userRole === 'SUPERADMIN' || userRole === 'ADMIN' || (userRole === 'EDITOR' && post.authorEmail === session?.user?.email)) && (
                                <DeleteButton 
                                  action={deletePost} 
                                  id={post.id} 
                                  name={post.title} 
                                  idFieldName="postId" 
                                  confirmMessage="Bu yazıyı silmek istediğinize emin misiniz?"
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
              <div className="editorial-card text-center py-16">
                <p className="text-[var(--text-muted)] text-sm">Henüz yayınlanmış bir blog yazısı bulunmuyor.</p>
              </div>
            )}

          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
