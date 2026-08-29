import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Kulis & Tiyatro Yazıları | FSM Tiyatro',
  description: 'FSM Tiyatro kulis günlükleri, prova notları, oyun incelemeleri ve tiyatro yazıları.',
};

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function KulisPage() {
  let posts: any[] = [];

  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const canWritePost = ['EDITOR', 'ADMIN', 'SUPERADMIN', 'DIRECTOR'].includes(userRole);

  try {
    const snap = await adminDb.collection('posts').orderBy('createdAt', 'desc').get();
    posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[KULIS] Veri çekme hatası:", error);
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-24 pb-16 sm:pt-32 sm:pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Kulis', url: `${baseUrl}/kulis` }
        ]} 
      />

      {/* Başlık ve Editör Aksiyonu */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-8 sm:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="editorial-tag text-[var(--primary-gold)] block mb-2 text-[10px]">SAHNE ARKASI & METİNLER</span>
          <h1 className="serif-font text-3xl sm:text-5xl md:text-6xl text-[var(--text-main)] mb-3 break-words">Kulis</h1>
          <p className="text-xs sm:text-sm md:text-base text-[var(--text-muted)] font-light max-w-xl">
            Prova günlükleri, oyuncu ve yönetmen notları, akademik makaleler ve tiyatro incelemeleri.
          </p>
        </div>

        {canWritePost && (
          <div>
            <Link 
              href="/kulis/yeni"
              className="btn btn-primary py-3 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg hover:scale-105 transition-all flex-shrink-0"
            >
              <ion-icon name="create-outline" style={{ fontSize: '1.2rem' }}></ion-icon>
              <span>+ Yeni Yazı Ekle</span>
            </Link>
          </div>
        )}
      </div>

      <div className="max-w-[1380px] mx-auto px-[5%]">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {posts.map((post) => (
              <article key={post.id} className="editorial-card p-5 sm:p-6 bg-[var(--bg-surface)] flex flex-col justify-between group">
                <div>
                  {post.imageUrl && (
                    <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-4 border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
                      <Image
                        src={post.imageUrl}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-[var(--primary-gold)] font-bold uppercase tracking-wider text-[10px]">
                      {post.category || 'Kulis'}
                    </span>
                    <span className="text-[var(--text-dim)]">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString('tr-TR') : ''}
                    </span>
                  </div>

                  <h2 className="serif-font text-xl text-[var(--text-main)] mb-2 leading-snug group-hover:text-[var(--primary-gold)] transition-colors">
                    <Link href={`/kulis/${post.id}`}>{post.title}</Link>
                  </h2>

                  <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed mb-6 font-light">
                    {post.excerpt || post.content}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  <span className="text-[var(--text-dim)]">
                    🖋️ {post.author || 'FSM Tiyatro'}
                  </span>
                  <Link
                    href={`/kulis/${post.id}`}
                    className="font-bold text-[var(--primary-gold)] hover:underline"
                  >
                    Yazıyı Oku →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 editorial-card bg-[var(--bg-surface)] max-w-xl mx-auto">
            <span className="text-3xl mb-2 block">📝</span>
            <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2">Henüz Yazı Eklenmemiş</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-6">
              Prova notları ve kulis yazıları yakında paylaşılacaktır.
            </p>
            <Link href="/oyunlar" className="btn btn-outline text-xs">Oyunlarımıza Göz Atın</Link>
          </div>
        )}
      </div>
    </div>
  );
}
