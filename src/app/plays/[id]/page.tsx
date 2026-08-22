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
  if (!docSnap.exists) return { title: 'Oyun Bulunamadı' };
  const play = docSnap.data() as any;
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';
  
  return {
    title: `${play.title} | FSM Tiyatro`,
    description: play.description?.substring(0, 160) + "...",
    openGraph: {
      title: `${play.title} | FSM Tiyatro`,
      description: play.description?.substring(0, 160) + "...",
      images: play.imageUrl ? [play.imageUrl] : [`${baseUrl}/brand-logo-v1.jpg`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${play.title} | FSM Tiyatro`,
      description: play.description?.substring(0, 160) + "...",
      images: play.imageUrl ? [play.imageUrl] : [`${baseUrl}/brand-logo-v1.jpg`],
    }
  };
}

export default async function PlayDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('plays').doc(resolvedParams.id).get();
  
  if (!docSnap.exists) notFound();
  const play = { id: docSnap.id, ...docSnap.data() as any };

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';
  const pageUrl = `${baseUrl}/plays/${play.id}`;

  const gallery = play.galleryUrls ? (play.galleryUrls as string).split(',').filter((u: string) => u.trim() !== '') : [];

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = play.videoUrl ? getYoutubeId(play.videoUrl) : null;

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      {/* Yapısal Veri (JSON-LD) */}
      <PlayJsonLd play={play} />
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Oyunlarımız', url: `${baseUrl}/plays` },
          { name: play.title, url: pageUrl }
        ]} 
      />

      {/* Hero Banner */}
      <div className="relative h-[45vh] min-h-[320px] w-full flex items-end justify-center overflow-hidden border-b border-[var(--border-subtle)]">
        <Image 
          src={play.imageUrl || '/default-cover.svg'} 
          alt={play.title} 
          fill
          priority
          className="object-cover object-top opacity-50 filter blur-xs scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark)] via-[var(--bg-dark)]/70 to-transparent"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl mb-8">
          {play.year && (
            <span className="editorial-tag text-[var(--primary-gold)] inline-block mb-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-[var(--border-subtle)]">
              {play.year} Sezonu
            </span>
          )}
          <h1 className="serif-font text-4xl sm:text-5xl md:text-6xl text-[var(--text-main)] leading-tight drop-shadow-md">
            {play.title}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-6 relative z-20">
        <div className="editorial-card p-8 md:p-12 shadow-2xl bg-[var(--bg-surface)]">
          
          <div className="flex items-center justify-between pb-6 border-b border-[var(--border-subtle)] mb-8 flex-wrap gap-4">
            <Link 
              href="/plays" 
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary-gold)] uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <ion-icon name="arrow-back-outline"></ion-icon> Repertuvara Dön
            </Link>
            <span className="text-xs font-mono text-[var(--primary-gold)] uppercase font-bold">
              FSM Tiyatro Yapımı
            </span>
          </div>
          
          {/* Video Player (Varsa) */}
          {videoId && (
            <div className="mb-10 rounded-xl overflow-hidden border border-[var(--border-medium)] shadow-lg bg-black">
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

          <div className="space-y-4">
            <h2 className="serif-font text-2xl text-[var(--text-main)]">Oyun Özeti ve Sanatsal Çerçeve</h2>
            <p className="text-base sm:text-lg leading-relaxed text-[var(--text-muted)] font-light whitespace-pre-wrap">
              {play.description}
            </p>
          </div>

          {/* Galeri */}
          {gallery.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
              <h3 className="serif-font text-2xl text-[var(--text-main)] mb-6">Sahne Arkası & Fotoğraflar</h3>
              <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
                {gallery.map((url: string, i: number) => (
                  <div key={i} className="relative h-[240px] w-[360px] flex-shrink-0 snap-start rounded-lg overflow-hidden border border-[var(--border-medium)] bg-[var(--bg-surface-elevated)]">
                    <Image 
                      src={url.trim()} 
                      alt={`${play.title} Fotoğraf - ${i + 1}`} 
                      fill
                      className="object-cover"
                      sizes="360px"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
