import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Sezon Repertuvarı | FSM Tiyatro',
  description: 'FSM Tiyatro güncel tiyatro sezonunda sahnelenen prodüksiyonlar, oyun künyeleri ve gösterim tarihleri.',
};

export default async function SahnePage() {
  let plays: any[] = [];

  try {
    const playsSnap = await adminDb.collection('plays').orderBy('createdAt', 'desc').get();
    plays = playsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[SAHNE] Veri çekme hatası:", error);
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Sahne & Repertuvar', url: `${baseUrl}/sahne` }
        ]} 
      />

      {/* Header */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border-subtle)] pb-8 gap-4">
          <div>
            <span className="editorial-tag text-[var(--primary-gold)] block mb-2">PRODÜKSİYONLAR & OYUNLAR</span>
            <h1 className="serif-font text-4xl sm:text-5xl md:text-6xl text-[var(--text-main)]">Sezon Repertuvarı</h1>
            <p className="text-sm text-[var(--text-muted)] mt-2 font-light max-w-xl">
              FSM Tiyatro oyuncuları ve sahne arkası ekibinin kolektif üretimiyle hayat bulan güncel oyunlarımız.
            </p>
          </div>
          <Link href="/arsiv" className="btn btn-outline text-xs tracking-wider flex items-center gap-1.5 self-start md:self-auto">
            <ion-icon name="time-outline"></ion-icon>
            <span>Geçmiş Sezonlar Arşivi</span>
          </Link>
        </div>
      </div>

      {/* Oyun Listesi */}
      <div className="max-w-[1380px] mx-auto px-[5%]">
        {plays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plays.map((play) => (
              <div key={play.id} className="editorial-card group flex flex-col overflow-hidden">
                
                {/* Afiş / Kapak */}
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
                  {play.genre && (
                    <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded text-[10px] text-white font-medium">
                      {play.genre}
                    </div>
                  )}
                </div>

                {/* Bilgiler */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between text-xs text-[var(--primary-gold)] font-mono mb-2">
                    <span>{play.playwright ? `Yazar: ${play.playwright}` : 'FSM Tiyatro Prodüksiyonu'}</span>
                    {play.duration && <span>{play.duration}</span>}
                  </div>
                  <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2 group-hover:text-[var(--primary-gold)] transition-colors">
                    <Link href={`/sahne/${play.id}`}>{play.title}</Link>
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-3 mb-6 font-light leading-relaxed">
                    {play.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-xs text-[var(--text-dim)] uppercase font-bold tracking-wider">
                      {play.director ? `Yönetmen: ${play.director}` : 'FSM Tiyatro'}
                    </span>
                    <Link
                      href={`/sahne/${play.id}`}
                      className="text-xs font-bold text-[var(--primary-gold)] uppercase tracking-wider hover:text-[var(--text-main)] transition-colors"
                    >
                      Oyun Künyesi & Afiş →
                    </Link>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 editorial-card">
            <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2">Yeni Sezon Hazırlıkları Sürüyor</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6 font-light">
              Yeni oyunlarımızın reji ve prova çalışmaları devam ediyor. Geçmiş sezon prodüksiyonlarımızı dijital arşivimizden inceleyebilirsiniz.
            </p>
            <Link href="/arsiv" className="btn btn-primary text-xs">Dijital Arşive Göz At</Link>
          </div>
        )}
      </div>
    </div>
  );
}
