import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Oyunlarımız | FSM Tiyatro',
  description: 'FSM Tiyatro güncel tiyatro sezonunda sahnelenen ve geçmişte sergilenen tüm oyunlar.',
};

export default async function OyunlarPage() {
  let plays: any[] = [];

  try {
    const playsSnap = await adminDb.collection('plays').get();
    plays = playsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (error) {
    console.error("[OYUNLAR] Veri çekme hatası:", error);
  }

  // Geçmiş ve Gelecek / Güncel Oyunları Ayır
  const currentPlays = plays.filter(p => p.status === 'ACTIVE' || p.status === 'UPCOMING' || !p.status);
  const pastPlays = plays.filter(p => p.status === 'ARCHIVED');
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-24 pb-16 sm:pt-32 sm:pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Oyunlar', url: `${baseUrl}/oyunlar` }
        ]} 
      />

      {/* Başlık */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-8 sm:mb-12">
        <span className="editorial-tag text-[var(--primary-gold)] block mb-2 text-[10px]">FSM TİYATRO REPERTUARI</span>
        <h1 className="serif-font text-3xl sm:text-5xl md:text-6xl text-[var(--text-main)] mb-3 break-words">Oyunlarımız</h1>
        <p className="text-xs sm:text-sm md:text-base text-[var(--text-muted)] font-light max-w-xl leading-relaxed">
          Bu sezon sahnede olan yapımlarımız, hazırlığı süren prömiyerler ve kulübümüzün geçmiş oyun arşivi.
        </p>
      </div>

      <div className="max-w-[1380px] mx-auto px-[5%] space-y-16 sm:space-y-20">
        
        {/* 1. GÜNCEL & YAKLAŞAN OYUNLAR (REPERTUAR) */}
        <div>
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-[var(--border-subtle)]">
            <h2 className="serif-font text-2xl sm:text-3xl text-[var(--text-main)] flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sahnede & Yakında</span>
            </h2>
            <span className="text-xs text-[var(--text-dim)] font-mono">
              {currentPlays.length} Aktif Yapım
            </span>
          </div>

          {currentPlays.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
              {currentPlays.map((play) => {
                const isUpcoming = play.status === 'UPCOMING';
                const poster = play.posterUrl || play.imageUrl || '/default-cover.svg';

                return (
                  <div key={play.id} className="editorial-card group flex flex-col overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)] transition-all">
                    {/* Dikey Afiş Alanı (2:3 Oranı) */}
                    <div className="relative w-full aspect-[2/3] max-h-[480px] bg-[var(--bg-surface-elevated)] overflow-hidden border-b border-[var(--border-subtle)]">
                      <Image
                        src={poster}
                        alt={play.title || 'Oyun Afişi'}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="bg-[var(--bg-dark)]/90 backdrop-blur-md px-3 py-1 rounded text-[11px] font-bold text-[var(--primary-gold)] tracking-wider border border-[var(--border-subtle)] uppercase">
                          {play.season || play.year || 'SEZON'}
                        </span>
                        {isUpcoming ? (
                          <span className="bg-sky-500/20 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-bold text-sky-400 border border-sky-500/30 uppercase">
                            ✨ Yakında
                          </span>
                        ) : (
                          <span className="bg-emerald-500/20 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase">
                            🎭 Sahnede
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center justify-between text-xs text-[var(--primary-gold)] font-mono mb-1">
                        <span>{play.playwright ? `Yazar: ${play.playwright}` : 'FSM Tiyatro'}</span>
                        {play.genre && <span>{play.genre}</span>}
                      </div>
                      <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2 group-hover:text-[var(--primary-gold)] transition-colors">
                        <Link href={`/oyunlar/${play.id}`}>{play.title}</Link>
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-3 mb-6 font-light leading-relaxed">
                        {play.description}
                      </p>

                      <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="text-xs text-[var(--text-dim)]">
                          {play.director ? `Reji: ${play.director}` : 'FSM Tiyatro'}
                        </span>
                        <Link
                          href={`/oyunlar/${play.id}`}
                          className="text-xs font-bold text-[var(--primary-gold)] uppercase tracking-wider hover:underline"
                        >
                          Oyun Detayı →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center editorial-card bg-[var(--bg-surface)]">
              <p className="text-sm text-[var(--text-muted)]">Yeni sezon oyun provaları devam ediyor; yakında ilan edilecektir.</p>
            </div>
          )}
        </div>

        {/* 2. GEÇMİŞ OYUNLAR (ARŞİV) */}
        <div>
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-[var(--border-subtle)]">
            <h2 className="serif-font text-2xl sm:text-3xl text-[var(--text-main)] flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-dim)]"></span>
              <span>Geçmiş Oyunlar & Arşiv</span>
            </h2>
            <span className="text-xs text-[var(--text-dim)] font-mono">
              {pastPlays.length} Arşiv Kaydı
            </span>
          </div>

          {pastPlays.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {pastPlays.map((play) => (
                <Link 
                  key={play.id} 
                  href={`/oyunlar/${play.id}`} 
                  className="editorial-card p-4 bg-[var(--bg-surface)] group block border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)] transition-all"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] mb-3">
                    <Image
                      src={play.posterUrl || play.imageUrl || '/default-cover.svg'}
                      alt={play.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-[var(--text-dim)] font-mono">
                      {play.season || play.year || 'Arşiv'}
                    </div>
                  </div>
                  <h4 className="serif-font text-base text-[var(--text-main)] group-hover:text-[var(--primary-gold)] transition-colors truncate">
                    {play.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-dim)] mt-1 font-mono">
                    <span>{play.playwright || 'FSM Tiyatro'}</span>
                    <span className="text-[var(--primary-gold)]">İncele →</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center editorial-card bg-[var(--bg-surface)]">
              <p className="text-xs text-[var(--text-muted)]">Arşivde henüz kayıtlı geçmiş oyun bulunmuyor.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
