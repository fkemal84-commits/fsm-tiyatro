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
    const playsSnap = await adminDb.collection('plays').orderBy('createdAt', 'desc').get();
    plays = playsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[OYUNLAR] Veri çekme hatası:", error);
  }

  const currentPlays = plays.filter(p => p.status !== 'ARCHIVED');
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
        <span className="editorial-tag text-[var(--primary-gold)] block mb-2 text-[10px]">FSM TİYATRO</span>
        <h1 className="serif-font text-3xl sm:text-5xl md:text-6xl text-[var(--text-main)] mb-3 break-words">Oyunlarımız</h1>
        <p className="text-xs sm:text-sm md:text-base text-[var(--text-muted)] font-light max-w-xl">
          Sahnede hayat bulan güncel oyunlarımız ve kulübümüzün geçmiş prodüksiyonları.
        </p>
      </div>

      <div className="max-w-[1380px] mx-auto px-[5%] space-y-12 sm:space-y-16">
        
        {/* 1. GÜNCEL OYUNLAR */}
        <div>
          <h2 className="serif-font text-2xl sm:text-3xl text-[var(--text-main)] mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Sahnede & Bu Sezon</span>
          </h2>

          {(currentPlays.length > 0 ? currentPlays : plays).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(currentPlays.length > 0 ? currentPlays : plays).map((play) => (
                <div key={play.id} className="editorial-card group flex flex-col overflow-hidden bg-[var(--bg-surface)]">
                  <div className="relative w-full aspect-[3/4] bg-[var(--bg-surface-elevated)] overflow-hidden border-b border-[var(--border-subtle)]">
                    <Image
                      src={play.imageUrl || play.posterUrl || '/default-cover.svg'}
                      alt={play.title || 'Oyun Afişi'}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute top-4 left-4 bg-[var(--bg-dark)]/90 backdrop-blur-md px-3 py-1 rounded text-[11px] font-bold text-[var(--primary-gold)] tracking-widest border border-[var(--border-subtle)] uppercase">
                      {play.season || play.year || 'SEZON'}
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
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic">Yeni sezon oyun provaları devam ediyor.</p>
          )}
        </div>

        {/* 2. GEÇMİŞ OYUNLAR (ARŞİV) */}
        {pastPlays.length > 0 && (
          <div className="pt-10 border-t border-[var(--border-subtle)]">
            <h2 className="serif-font text-2xl text-[var(--text-main)] mb-6 text-[var(--text-muted)]">
              Geçmiş Oyunlar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {pastPlays.map((play) => (
                <Link key={play.id} href={`/oyunlar/${play.id}`} className="editorial-card p-4 bg-[var(--bg-surface)] group block">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] mb-3">
                    <Image
                      src={play.posterUrl || play.imageUrl || '/default-cover.svg'}
                      alt={play.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                      sizes="25vw"
                    />
                  </div>
                  <h4 className="serif-font text-base text-[var(--text-main)] group-hover:text-[var(--primary-gold)] transition-colors truncate">
                    {play.title}
                  </h4>
                  <span className="text-[11px] text-[var(--text-dim)] font-mono">{play.season || play.year}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
