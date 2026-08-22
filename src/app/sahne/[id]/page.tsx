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

export default async function PlayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('plays').doc(resolvedParams.id).get();
  
  if (!docSnap.exists) notFound();
  const play = { id: docSnap.id, ...docSnap.data() as any };

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';
  const pageUrl = `${baseUrl}/sahne/${play.id}`;

  const gallery = play.galleryUrls ? (play.galleryUrls as string).split(',').filter((u: string) => u.trim() !== '') : [];

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = play.videoUrl ? getYoutubeId(play.videoUrl) : null;

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-28 pb-24">
      {/* Yapısal Veri (JSON-LD) */}
      <PlayJsonLd play={play} />
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Repertuvar', url: `${baseUrl}/sahne` },
          { name: play.title, url: pageUrl }
        ]} 
      />

      {/* HERO BANNER */}
      <div className="relative h-[55vh] min-h-[380px] w-full flex items-end justify-center overflow-hidden border-b border-[var(--border-subtle)]">
        <Image 
          src={play.imageUrl || play.posterUrl || '/default-cover.svg'} 
          alt={play.title} 
          fill
          priority
          className="object-cover object-top opacity-40 filter blur-xs scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark)] via-[var(--bg-dark)]/75 to-transparent"></div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mb-12">
          <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
            <span className="editorial-tag text-[var(--primary-gold)] bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-[var(--primary-gold-border)]">
              {play.season || play.year || '2025–2026'} SEZONU
            </span>
            {play.genre && (
              <span className="text-[11px] text-[var(--text-main)] bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                {play.genre}
              </span>
            )}
          </div>
          <h1 className="serif-font text-4xl sm:text-5xl md:text-6xl text-[var(--text-main)] leading-tight drop-shadow-md">
            {play.title}
          </h1>
          {play.originalTitle && (
            <p className="text-xs sm:text-sm text-[var(--text-muted)] italic mt-1 font-serif">
              Orijinal Adı: {play.originalTitle}
            </p>
          )}
        </div>
      </div>

      {/* İÇERİK KONTEYNERİ */}
      <div className="max-w-5xl mx-auto px-6 -mt-8 relative z-20">
        
        {/* KÜNYE ÖZET KARTI */}
        <div className="editorial-card p-6 md:p-8 bg-[var(--bg-surface)] mb-10 shadow-2xl">
          <div className="flex items-center justify-between pb-6 border-b border-[var(--border-subtle)] mb-6 flex-wrap gap-4">
            <Link 
              href="/sahne" 
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary-gold)] uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <ion-icon name="arrow-back-outline"></ion-icon> Repertuvara Dön
            </Link>
            <span className="text-xs font-mono text-[var(--primary-gold)] uppercase font-bold">
              FSM Tiyatro Prodüksiyonu
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-xs">
            {play.playwright && (
              <div>
                <span className="text-[var(--text-dim)] block uppercase font-bold text-[10px] mb-1">Yazar</span>
                <span className="text-[var(--text-main)] font-semibold text-sm">{play.playwright}</span>
              </div>
            )}
            {play.translator && (
              <div>
                <span className="text-[var(--text-dim)] block uppercase font-bold text-[10px] mb-1">Çevirmen</span>
                <span className="text-[var(--text-main)] font-semibold text-sm">{play.translator}</span>
              </div>
            )}
            {play.director && (
              <div>
                <span className="text-[var(--text-dim)] block uppercase font-bold text-[10px] mb-1">Yönetmen</span>
                <span className="text-[var(--text-main)] font-semibold text-sm">{play.director}</span>
              </div>
            )}
            {play.duration && (
              <div>
                <span className="text-[var(--text-dim)] block uppercase font-bold text-[10px] mb-1">Süre</span>
                <span className="text-[var(--text-main)] font-semibold text-sm">{play.duration}</span>
              </div>
            )}
            {play.stageLocation && (
              <div>
                <span className="text-[var(--text-dim)] block uppercase font-bold text-[10px] mb-1">Sahne</span>
                <span className="text-[var(--text-main)] font-semibold text-sm">{play.stageLocation}</span>
              </div>
            )}
            <div>
              <span className="text-[var(--text-dim)] block uppercase font-bold text-[10px] mb-1">Durum</span>
              <span className="text-emerald-500 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                {play.status === 'ARCHIVED' ? 'Arşivde' : play.status === 'UPCOMING' ? 'Pek Yakında' : 'Sahnede'}
              </span>
            </div>
          </div>
        </div>

        {/* OYUN ÖZETİ VE YÖNETMEN NOTU */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
          
          {/* Sol Kolon: Açıklama ve Notlar */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Video Fragman (Varsa) */}
            {videoId && (
              <div className="rounded-xl overflow-hidden border border-[var(--border-medium)] shadow-lg bg-black">
                <div className="relative pb-[56.25%] h-0">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={`${play.title} Video Kaydı`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {/* Oyun Özeti */}
            <div className="editorial-card p-8 bg-[var(--bg-surface)]">
              <h2 className="serif-font text-2xl text-[var(--text-main)] mb-4">Oyunun Konusu ve Çerçevesi</h2>
              <p className="text-base leading-relaxed text-[var(--text-muted)] font-light whitespace-pre-wrap">
                {play.description}
              </p>
            </div>

            {/* Yönetmenin Notu (Varsa) */}
            {play.directorNote && (
              <div className="editorial-card p-8 bg-[var(--primary-gold-dim)] border border-[var(--primary-gold-border)]">
                <span className="editorial-tag text-[var(--primary-gold)] block mb-2">REJİ GÖRÜŞÜ</span>
                <h3 className="serif-font text-2xl text-[var(--text-main)] mb-3">Yönetmenin Notu</h3>
                <p className="text-sm leading-relaxed text-[var(--text-main)] italic font-light whitespace-pre-wrap">
                  "{play.directorNote}"
                </p>
                {play.director && (
                  <p className="text-xs text-[var(--primary-gold)] font-bold mt-4 text-right">
                    — {play.director}
                  </p>
                )}
              </div>
            )}

            {/* OYUNCU VE TEKNİK EKİP KÜNYESİ */}
            {((play.cast && play.cast.length > 0) || (play.crew && play.crew.length > 0)) && (
              <div className="editorial-card p-8 bg-[var(--bg-surface)] space-y-8">
                {play.cast && play.cast.length > 0 && (
                  <div>
                    <h3 className="serif-font text-2xl text-[var(--text-main)] mb-6">Oyuncu Kadrosu</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {play.cast.map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs">
                          <span className="font-bold text-[var(--text-main)]">{c.actorName}</span>
                          <span className="text-[var(--primary-gold)] italic">{c.roleName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {play.crew && play.crew.length > 0 && (
                  <div className="pt-6 border-t border-[var(--border-subtle)]">
                    <h3 className="serif-font text-xl text-[var(--text-main)] mb-4">Sahne Arkası & Teknik Kadro</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {play.crew.map((cr: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[var(--text-muted)]">
                          <span className="text-[var(--text-dim)]">{cr.department}:</span>
                          <span className="font-semibold text-[var(--text-main)]">{cr.memberName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sağ Kolon: Afiş, Seanslar & Basın Kiti */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Büyük Resmi Afiş */}
            <div className="editorial-card p-4 bg-[var(--bg-surface)] overflow-hidden">
              <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
                <Image
                  src={play.posterUrl || play.imageUrl || '/default-cover.svg'}
                  alt={`${play.title} Resmi Afiş`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
            </div>

            {/* Gösterim Seansları & Bilet */}
            {play.showDates && play.showDates.length > 0 && (
              <div className="editorial-card p-6 bg-[var(--bg-surface)]">
                <h4 className="serif-font text-lg text-[var(--text-main)] mb-4 flex items-center gap-2">
                  <ion-icon name="calendar-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
                  <span>Temsil Tarihleri</span>
                </h4>
                <div className="space-y-3">
                  {play.showDates.map((sd: any, idx: number) => (
                    <div key={idx} className="p-3 bg-[var(--bg-surface-elevated)] rounded-lg border border-[var(--border-subtle)] text-xs">
                      <div className="font-bold text-[var(--text-main)]">{sd.date} • {sd.time}</div>
                      <div className="text-[var(--text-dim)]">{sd.venue}</div>
                      {sd.ticketUrl && (
                        <a href={sd.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--primary-gold)] font-bold block mt-1 hover:underline">
                          Bilet Al →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bilet Sorgulama / Gişe Kutusu */}
            <div className="editorial-card p-6 bg-[var(--bg-surface)] text-center">
              <span className="text-2xl mb-2 block">🎟️</span>
              <h4 className="font-bold text-sm text-[var(--text-main)] mb-1">Biletinizi Aldınız mı?</h4>
              <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                Temsil günü sıra beklemeden koltuk numaranızı ve QR biletinizi online sorgulayın.
              </p>
              <Link href="/biletimi-bul" className="btn btn-primary w-full py-2.5 text-xs font-bold">
                Biletimi Sorgula
              </Link>
            </div>

          </div>

        </div>

        {/* FOTOĞRAF GALERİSİ */}
        {gallery.length > 0 && (
          <div className="editorial-card p-8 bg-[var(--bg-surface)]">
            <h3 className="serif-font text-2xl text-[var(--text-main)] mb-6">Sahne Arkası & Prodüksiyon Galerisi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.map((url: string, i: number) => (
                <div key={i} className="relative aspect-[16/10] rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] group">
                  <Image 
                    src={url.trim()} 
                    alt={`${play.title} Fotoğraf - ${i + 1}`} 
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="360px"
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
