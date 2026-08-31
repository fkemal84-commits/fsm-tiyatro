import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';
import { formatAuthorSignature } from '@/lib/utils';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isEditor, isActiveMember } from "@/lib/auth-helpers";
import { approvePost, rejectPost } from "@/app/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Kulis & Tiyatro Yazıları | FSM Tiyatro',
  description: 'FSM Tiyatro kulis günlükleri, prova notları, oyun incelemeleri ve tiyatro yazıları.',
};

export default async function KulisPage() {
  let posts: any[] = [];

  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const userIsEditor = isEditor(user);
  const canWritePost = isActiveMember(user);

  try {
    const snap = await adminDb.collection('posts').orderBy('createdAt', 'desc').get();
    posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[KULIS] Veri çekme hatası:", error);
  }

  const publishedPosts = posts.filter(p => p.status === 'PUBLISHED' || !p.status);
  const pendingPosts = userIsEditor ? posts.filter(p => p.status === 'PENDING_REVIEW') : [];

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
          <div className="flex flex-col items-end gap-1">
            <Link 
              href="/kulis/yeni"
              className="btn btn-primary py-3 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg hover:scale-105 transition-all flex-shrink-0"
            >
              <ion-icon name="create-outline" style={{ fontSize: '1.2rem' }}></ion-icon>
              <span>+ Yeni Yazı Ekle</span>
            </Link>
            {!userIsEditor && (
              <span className="text-[10px] text-[var(--text-dim)]">
                ✍️ Gönderdiğiniz yazılar editör onayından sonra yayına alınır.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Editör İnceleme Masası (Yalnızca Editör ve Yöneticilere Açık) */}
      {userIsEditor && pendingPosts.length > 0 && (
        <div className="max-w-[1380px] mx-auto px-[5%] mb-12">
          <div className="p-6 rounded-xl bg-amber-950/20 border border-amber-500/40 shadow-xl">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="serif-font text-lg sm:text-xl text-amber-400 flex items-center gap-2 font-bold">
                <ion-icon name="clipboard-outline"></ion-icon>
                Editör Masası: Onay Bekleyen Kulüp Yazıları ({pendingPosts.length})
              </h2>
              <span className="text-xs text-amber-300/70 font-medium">
                Bu yazılar henüz yayında değildir, sadece editörler görebilir.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPosts.map(post => (
                <div key={post.id} className="p-4 rounded-lg bg-[var(--bg-surface)] border border-amber-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-amber-400 font-bold uppercase text-[10px]">{post.category || 'Blog'}</span>
                      <span className="text-[var(--text-dim)]">{post.createdAt ? new Date(post.createdAt).toLocaleDateString('tr-TR') : ''}</span>
                    </div>
                    <h3 className="serif-font font-bold text-sm text-[var(--text-main)] mb-1">{post.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">{post.excerpt || post.content}</p>
                    <span className="text-[11px] text-[var(--text-dim)] block">Yazar: <strong>{post.author || post.authorEmail}</strong></span>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)]">
                    <form action={approvePost as any} className="flex-1">
                      <input type="hidden" name="postId" value={post.id} />
                      <button type="submit" className="w-full py-1.5 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1">
                        ✓ Yayına Al
                      </button>
                    </form>
                    <form action={rejectPost as any} className="flex-1">
                      <input type="hidden" name="postId" value={post.id} />
                      <button type="submit" className="w-full py-1.5 px-3 rounded bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-500/30 font-bold text-xs transition-colors flex items-center justify-center gap-1">
                        ✕ Reddet
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1380px] mx-auto px-[5%]">
        {publishedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {publishedPosts.map((post) => (
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
                    🖋️ {formatAuthorSignature(post.author)}
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
