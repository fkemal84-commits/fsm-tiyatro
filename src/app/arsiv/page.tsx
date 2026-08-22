import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Dijital Prodüksiyon Arşivi | FSM Tiyatro',
  description: 'FSM Tiyatro kuruluşundan bugüne sahnelenen tüm oyunlar, geçmiş sezon hafızası, afişler ve tiyatro belgeleri.',
};

export default async function ArsivPage() {
  let plays: any[] = [];

  try {
    const playsSnap = await adminDb.collection('plays').orderBy('createdAt', 'desc').get();
    plays = playsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[ARSIV] Veri çekme hatası:", error);
  }

  // Sezonlara veya yıllara göre grupla
  const seasonMap: Record<string, any[]> = {};

  plays.forEach(play => {
    const seasonKey = play.season || (play.year ? `${play.year} Sezonu` : 'Arşiv');
    if (!seasonMap[seasonKey]) {
      seasonMap[seasonKey] = [];
    }
    seasonMap[seasonKey].push(play);
  });

  const sortedSeasons = Object.keys(seasonMap);
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Dijital Arşiv', url: `${baseUrl}/arsiv` }
        ]} 
      />

      {/* Header */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-16">
        <span className="editorial-tag text-[var(--primary-gold)] block mb-2">KURUMSAL HAFIZA & TİYATRO BELGELİĞİ</span>
        <h1 className="serif-font text-4xl sm:text-5xl md:text-6xl text-[var(--text-main)] mb-4">Dijital Prodüksiyon Arşivi</h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl font-light leading-relaxed">
          FSM Tiyatro'nun kuruluşundan bu yana sahneye koyduğu tüm prodüksiyonlar, oyun afişleri, reji kadroları ve tiyatro hafızası.
        </p>
      </div>

      {/* Sezon Bazlı Arşiv Bloğu */}
      <div className="max-w-[1380px] mx-auto px-[5%] space-y-16">
        {sortedSeasons.length > 0 ? (
          sortedSeasons.map((season) => (
            <div key={season} className="border-t border-[var(--border-subtle)] pt-10">
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[var(--primary-gold)]"></div>
                  <h2 className="serif-font text-2xl sm:text-3xl text-[var(--text-main)]">{season}</h2>
                </div>
                <span className="text-xs font-mono text-[var(--text-dim)] uppercase">
                  {seasonMap[season].length} Prodüksiyon
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {seasonMap[season].map((play) => (
                  <div key={play.id} className="editorial-card group flex flex-col overflow-hidden bg-[var(--bg-surface)]">
                    <div className="relative w-full aspect-[16/10] bg-[var(--bg-surface-elevated)] overflow-hidden border-b border-[var(--border-subtle)]">
                      <Image
                        src={play.imageUrl || play.posterUrl || '/default-cover.svg'}
                        alt={play.title || 'Arşiv Fotoğrafı'}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      {play.genre && (
                        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white">
                          {play.genre}
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="text-xs text-[var(--primary-gold)] font-mono mb-1">
                        {play.playwright ? `Yazar: ${play.playwright}` : 'FSM Tiyatro'}
                      </div>
                      <h3 className="serif-font text-xl text-[var(--text-main)] mb-2 group-hover:text-[var(--primary-gold)] transition-colors">
                        <Link href={`/sahne/${play.id}`}>{play.title}</Link>
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-4 font-light leading-relaxed">
                        {play.description}
                      </p>

                      <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                        <span className="text-[var(--text-dim)]">
                          {play.director ? `Yönetmen: ${play.director}` : 'FSM Tiyatro'}
                        </span>
                        <Link 
                          href={`/sahne/${play.id}`} 
                          className="font-bold text-[var(--primary-gold)] hover:underline"
                        >
                          Arşiv Dosyası →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 editorial-card">
            <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2">Arşiv Verisi Yükleniyor</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">
              Geçmiş sezon prodüksiyon belgeleri dijital ortama aktarılmaktadır.
            </p>
            <Link href="/sahne" className="btn btn-primary text-xs">Sezon Repertuvarına Dön</Link>
          </div>
        )}
      </div>
    </div>
  );
}
