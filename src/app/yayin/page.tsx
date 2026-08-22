import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Yayın & Günce | FSM Tiyatro',
  description: 'FSM Tiyatro kulis günlükleri, tiyatro incelemeleri, oyun analizleri ve Google Scholar uyumlu akademik bildiriler.',
};

export default async function YayinPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams.kategori || 'Tümü';

  let posts: any[] = [];

  try {
    const snap = await adminDb.collection('posts').orderBy('createdAt', 'desc').get();
    posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[YAYIN] Veri çekme hatası:", error);
  }

  const filteredPosts = currentCategory === 'Tümü'
    ? posts
    : posts.filter(p => p.category === currentCategory || (currentCategory === 'Akademik' && (p.category === 'Akademik Bildiri' || p.academicMeta?.isAcademic)));

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  const categories = [
    { label: 'Tüm Yayınlar', value: 'Tümü' },
    { label: '🎭 Kulis Günlükleri', value: 'Kulis' },
    { label: '📖 Tiyatro İncelemeleri', value: 'Makale' },
    { label: '🎓 Akademik Bildiriler', value: 'Akademik' },
    { label: '📰 Kulüp Haberleri', value: 'Haber' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Yayın & Günce', url: `${baseUrl}/yayin` }
        ]} 
      />

      {/* Header */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-12">
        <div className="max-w-3xl">
          <span className="editorial-tag text-[var(--primary-gold)] block mb-2">YAYIN MERKEZİ & TİYATRO GÜNCESİ</span>
          <h1 className="serif-font text-4xl sm:text-5xl md:text-6xl text-[var(--text-main)] mb-4">
            Yayın, Makale & Kulis
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] font-light leading-relaxed">
            Dramaturgi metinlerinden prova günlüklerine, tiyatro tarihi analizlerinden Google Scholar standartlarındaki akademik araştırmalara açık kaynak yayın merkezimiz.
          </p>
        </div>

        {/* Kategori Filtreleme Barı */}
        <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex gap-2 flex-wrap">
          {categories.map((c) => (
            <Link
              key={c.value}
              href={c.value === 'Tümü' ? '/yayin' : `/yayin?kategori=${encodeURIComponent(c.value)}`}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                currentCategory === c.value
                  ? 'bg-[var(--primary-gold)] text-black shadow-md'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)]'
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Yazılar Grid */}
      <div className="max-w-[1380px] mx-auto px-[5%]">
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => {
              const isAcademic = post.academicMeta?.isAcademic || post.category === 'Akademik Bildiri';

              return (
                <article key={post.id} className="editorial-card p-6 bg-[var(--bg-surface)] flex flex-col justify-between group">
                  <div>
                    {/* Kapak Görseli (Varsa) */}
                    {post.imageUrl && (
                      <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-5 border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
                        <Image
                          src={post.imageUrl}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className={`font-bold uppercase tracking-wider ${isAcademic ? 'text-amber-500' : 'text-[var(--primary-gold)]'}`}>
                        {isAcademic ? '🎓 Akademik Bildiri' : post.category || 'Blog'}
                      </span>
                      <span className="text-[var(--text-dim)]">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString('tr-TR') : ''}
                      </span>
                    </div>

                    <h2 className="serif-font text-xl sm:text-2xl text-[var(--text-main)] mb-3 leading-snug group-hover:text-[var(--primary-gold)] transition-colors">
                      <Link href={`/yayin/${post.id}`}>{post.title}</Link>
                    </h2>

                    <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed mb-6 font-light">
                      {post.excerpt || post.content}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <span className="text-[var(--text-dim)] font-medium">
                      🖋️ {post.author || 'FSM Tiyatro Ekibi'}
                    </span>
                    <Link
                      href={`/yayin/${post.id}`}
                      className="font-bold text-[var(--primary-gold)] hover:underline flex items-center gap-1"
                    >
                      {isAcademic ? 'Metni & Alıntıyı İncele →' : 'Yazıyı Oku →'}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 editorial-card bg-[var(--bg-surface)]">
            <span className="text-3xl mb-2 block">📚</span>
            <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2">Bu Kategoride Yazı Bulunmuyor</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">
              Yeni tiyatro yazıları ve araştırmaları hazırlanmaktadır.
            </p>
            <Link href="/yayin" className="btn btn-outline text-xs">Tüm Yayınlara Dön</Link>
          </div>
        )}
      </div>
    </div>
  );
}
