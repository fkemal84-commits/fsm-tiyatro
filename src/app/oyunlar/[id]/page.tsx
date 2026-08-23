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

            {/* Bilet Sorgulama Butonu */}
            <div className="p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold text-[var(--text-main)] block">Temsil Bileti Sorgulama</span>
                <span className="text-[11px] text-[var(--text-dim)]">Koltuk ve biletinizi kontrol edin</span>
              </div>
              <Link href="/biletimi-bul" className="btn btn-primary !py-2.5 !px-5 text-xs font-bold w-full sm:w-auto text-center flex-shrink-0">
                Biletimi Bul
              </Link>
            </div>

          </div>

        </div>

        {/* OYUNCULAR VE REJİ NOTU (Varsa) */}
        {((play.cast && play.cast.length > 0) || play.directorNote) && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
            {play.directorNote && (
              <div className="md:col-span-6 editorial-card p-6 bg-[var(--bg-surface)]">
                <h3 className="serif-font text-xl text-[var(--text-main)] mb-3">Yönetmenin Notu</h3>
                <p className="text-xs text-[var(--text-muted)] italic leading-relaxed whitespace-pre-wrap font-light">
                  "{play.directorNote}"
                </p>
              </div>
            )}

            {play.cast && play.cast.length > 0 && (
              <div className={`${play.directorNote ? 'md:col-span-6' : 'md:col-span-12'} editorial-card p-6 bg-[var(--bg-surface)]`}>
                <h3 className="serif-font text-xl text-[var(--text-main)] mb-3">Oyuncular</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {play.cast.map((c: any, i: number) => (
                    <div key={i} className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-main)] font-semibold">{c.actorName}</span>
                      <span className="text-[var(--primary-gold)] italic">{c.roleName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
