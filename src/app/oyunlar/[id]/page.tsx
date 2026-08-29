import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PlayJsonLd, BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('plays').doc(resolvedParams.id).get();
  if (!docSnap.exists) return { title: 'Oyun Bulunamadı | FSM Tiyatro' };
  const play = docSnap.data() as any;
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';
  
  return {
    title: `${play.title} | FSM Tiyatro`,
    description: (play.description || '').substring(0, 160) + "...",
    openGraph: {
      title: `${play.title} | FSM Tiyatro`,
      description: (play.description || '').substring(0, 160) + "...",
      images: play.imageUrl ? [play.imageUrl] : [`${baseUrl}/brand-logo-v1.jpg`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${play.title} | FSM Tiyatro`,
      description: (play.description || '').substring(0, 160) + "...",
      images: play.imageUrl ? [play.imageUrl] : [`${baseUrl}/brand-logo-v1.jpg`],
    }
  };
}

export default async function OyunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('plays').doc(resolvedParams.id).get();
  
  if (!docSnap.exists) notFound();
  const play = { id: docSnap.id, ...docSnap.data() as any };

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';
  const pageUrl = `${baseUrl}/oyunlar/${play.id}`;
  const gallery = play.galleryUrls ? (play.galleryUrls as string).split(',').filter((u: string) => u.trim() !== '') : [];

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = play.videoUrl ? getYoutubeId(play.videoUrl) : null;

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-24 pb-16 sm:pt-32 sm:pb-24">
      {/* Yapısal Veri (JSON-LD) */}
      <PlayJsonLd play={play} />
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Oyunlar', url: `${baseUrl}/oyunlar` },
          { name: play.title, url: pageUrl }
        ]} 
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Üst Geri Butonu */}
        <Link 
          href="/oyunlar" 
          className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary-gold)] uppercase tracking-wider inline-flex items-center gap-1.5 mb-6 sm:mb-8 transition-colors"
        >
          <ion-icon name="arrow-back-outline"></ion-icon> Tüm Oyunlar
        </Link>

        {/* Ana Oyun Bloğu */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-10 mb-10 sm:mb-12">
          
          {/* Sol: Afiş */}
          <div className="md:col-span-5">
            <div className="editorial-card p-2.5 sm:p-3 bg-[var(--bg-surface)] max-w-sm mx-auto md:max-w-none">
              <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
                <Image
                  src={play.posterUrl || play.imageUrl || '/default-cover.svg'}
                  alt={play.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              </div>
            </div>
          </div>

          {/* Sağ: Bilgiler & Künye */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-bold text-[var(--primary-gold)] bg-[var(--primary-gold-dim)] px-2.5 py-0.5 rounded border border-[var(--primary-gold-border)] font-mono">
                  {play.season || play.year || 'FSM Tiyatro'}
                </span>
                {play.genre && (
                  <span className="text-[10px] sm:text-[11px] text-[var(--text-dim)] font-medium">
                    &bull; {play.genre}
                  </span>
                )}
              </div>

              <h1 className="serif-font text-2xl sm:text-4xl md:text-5xl text-[var(--text-main)] mb-3 sm:mb-4 leading-tight">
                {play.title}
              </h1>

              {/* Temel Künye */}
              <div className="space-y-1.5 text-xs text-[var(--text-muted)] mb-5 pb-5 border-b border-[var(--border-subtle)]">
                {play.playwright && (
                  <div><span className="text-[var(--text-dim)]">Yazan:</span> <strong className="text-[var(--text-main)]">{play.playwright}</strong></div>
                )}
                {play.translator && (
                  <div><span className="text-[var(--text-dim)]">Çeviren:</span> <strong className="text-[var(--text-main)]">{play.translator}</strong></div>
                )}
                {play.director && (
                  <div><span className="text-[var(--text-dim)]">Yöneten:</span> <strong className="text-[var(--text-main)]">{play.director}</strong></div>
                )}
                {play.duration && (
                  <div><span className="text-[var(--text-dim)]">Süre:</span> <span className="text-[var(--text-main)]">{play.duration}</span></div>
                )}
              </div>

              {/* Açıklama */}
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--text-muted)] font-light whitespace-pre-wrap mb-6">
                {play.description}
              </div>
            </div>

            {/* Bilet Sorgulama / Arşiv & Senaryo Bilgisi */}
            {play.status === 'ARCHIVED' ? (
              <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏛️</span>
                  <div>
                    <span className="text-xs font-bold text-[var(--text-main)] block">Arşiv Repertuvarı</span>
                    <span className="text-[11px] text-[var(--text-dim)]">Bu oyun geçmiş sezonlarımızda sahnelenmiş olup dijital arşivimizdedir.</span>
                  </div>
                </div>
                {play.scriptUrl && (
                  <a
                    href={play.scriptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[var(--primary-gold-dim)] hover:bg-[var(--primary-gold)] text-[var(--primary-gold)] hover:text-black border border-[var(--primary-gold-border)] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
                  >
                    <ion-icon name="document-text-outline"></ion-icon>
                    <span>📄 Oyun Metnini İncele (PDF)</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                <div className="text-center sm:text-left">
                  <span className="text-xs font-bold text-[var(--text-main)] block">Temsil Bileti Sorgulama</span>
                  <span className="text-[11px] text-[var(--text-dim)]">Koltuk ve biletinizi kontrol edin</span>
                </div>
                <Link href="/biletimi-bul" className="btn btn-primary !py-2.5 !px-5 text-xs font-bold w-full sm:w-auto text-center flex-shrink-0">
                  Biletimi Bul
                </Link>
              </div>
            )}

          </div>

        </div>

        {/* 1. OYUNCULAR (CAST) VİTRİNİ — BİLETİNİAL / BROADWAY STİLİ */}
        {play.cast && play.cast.length > 0 && (
          <div className="editorial-card p-6 sm:p-8 bg-[var(--bg-surface)] mb-12">
            <div className="flex items-center justify-between mb-6 border-b border-[var(--border-subtle)] pb-4">
              <div>
                <span className="editorial-tag text-[var(--primary-gold)] block text-[10px] mb-1">
                  SAHNE KADROSU
                </span>
                <h3 className="serif-font text-2xl sm:text-3xl text-[var(--text-main)] font-bold">
                  Oyuncular & Karakterler
                </h3>
              </div>
              <span className="text-xs font-mono text-[var(--text-dim)]">
                {play.cast.length} Oyuncu
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {play.cast.map((c: any, i: number) => {
                const initials = (c.actorName || 'O')
                  .split(' ')
                  .map((n: string) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div 
                    key={i} 
                    className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)] rounded-2xl flex flex-col items-center text-center group transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Oyuncu Portresi / Maske Rozeti */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 border-2 border-[var(--primary-gold-border)] group-hover:border-[var(--primary-gold)] transition-colors shadow-md flex items-center justify-center bg-[var(--bg-dark)]">
                      {c.photoUrl ? (
                        <Image
                          src={c.photoUrl}
                          alt={c.actorName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[var(--primary-gold-dim)] to-[var(--bg-surface-elevated)]">
                          <span className="text-xl sm:text-2xl opacity-80 group-hover:scale-110 transition-transform">🎭</span>
                        </div>
                      )}
                    </div>

                    {/* Oyuncu Adı */}
                    <h4 className="font-bold text-xs sm:text-sm text-[var(--text-main)] group-hover:text-[var(--primary-gold)] transition-colors leading-tight mb-1">
                      {c.actorName}
                    </h4>

                    {/* Karakter / Rol Rozeti */}
                    <span className="text-[11px] text-[var(--primary-gold)] italic font-serif leading-tight">
                      "{c.roleName}"
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. REJİ & SAHNE ARKASI EKİBİ (CREW) */}
        {((play.crew && play.crew.length > 0) || play.director || play.playwright) && (
          <div className="editorial-card p-6 sm:p-8 bg-[var(--bg-surface)] mb-12">
            <span className="editorial-tag text-[var(--primary-gold)] block text-[10px] mb-1">
              PERDE ARKASI
            </span>
            <h3 className="serif-font text-2xl text-[var(--text-main)] font-bold mb-6 border-b border-[var(--border-subtle)] pb-4">
              Reji & Teknik Kadro
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {play.director && (
                <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)]">
                  <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider block mb-1">Yönetmen</span>
                  <span className="text-sm font-bold text-[var(--text-main)]">{play.director}</span>
                </div>
              )}
              {play.playwright && (
                <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)]">
                  <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider block mb-1">Yazar</span>
                  <span className="text-sm font-bold text-[var(--text-main)]">{play.playwright}</span>
                </div>
              )}
              {play.crew && play.crew.map((cr: any, idx: number) => (
                <div key={idx} className="p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)]">
                  <span className="text-[10px] font-bold text-[var(--primary-gold)] uppercase tracking-wider block mb-1">{cr.task || 'Ekip'}</span>
                  <span className="text-sm font-bold text-[var(--text-main)]">{cr.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. YÖNETMENİN NOTU (Varsa) */}
        {play.directorNote && (
          <div className="editorial-card p-6 sm:p-8 bg-[var(--bg-surface)] mb-12 relative overflow-hidden">
            <div className="text-4xl text-[var(--primary-gold)] opacity-30 font-serif leading-none mb-2">“</div>
            <h3 className="serif-font text-xl text-[var(--text-main)] mb-3 font-bold">Yönetmenin Notu</h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] italic leading-relaxed whitespace-pre-wrap font-light">
              {play.directorNote}
            </p>
          </div>
        )}

        {/* VİDEO KAYDI / FRAGMAN (Varsa) */}
        {videoId && (
          <div className="editorial-card p-6 bg-[var(--bg-surface)] mb-12">
            <h3 className="serif-font text-xl text-[var(--text-main)] mb-4">Video / Fragman</h3>
            <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-black">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={play.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* FOTOĞRAF GALERİSİ (Varsa) */}
        {gallery.length > 0 && (
          <div className="editorial-card p-6 bg-[var(--bg-surface)]">
            <h3 className="serif-font text-xl text-[var(--text-main)] mb-4">Oyun Fotoğrafları</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((url: string, i: number) => (
                <div key={i} className="relative aspect-[16/10] rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
                  <Image 
                    src={url.trim()} 
                    alt={`${play.title} Fotoğraf`} 
                    fill
                    className="object-cover"
                    sizes="33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
