import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Medya & Görsel Arşiv | FSM Tiyatro',
  description: 'FSM Tiyatro sahne fotoğrafları, prodüksiyon afişleri, fragmanlar ve dijital video kütüphanesi.',
};

export default async function MedyaPage({
  searchParams,
}: {
  searchParams: Promise<{ tur?: string }>;
}) {
  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tur || 'Tümü';

  let plays: any[] = [];

  try {
    const snap = await adminDb.collection('plays').orderBy('createdAt', 'desc').get();
    plays = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[MEDYA] Veri çekme hatası:", error);
  }

  // Fotoğraflar havuzu
  const photoItems: Array<{ url: string; playTitle: string; playId: string; season?: string }> = [];
  const posterItems: Array<{ url: string; playTitle: string; playId: string; season?: string }> = [];
  const videoItems: Array<{ url: string; videoId: string; playTitle: string; playId: string; season?: string }> = [];

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  plays.forEach(play => {
    if (play.posterUrl) {
      posterItems.push({ url: play.posterUrl, playTitle: play.title, playId: play.id, season: play.season || play.year });
    } else if (play.imageUrl) {
      posterItems.push({ url: play.imageUrl, playTitle: play.title, playId: play.id, season: play.season || play.year });
    }

    if (play.galleryUrls) {
      const urls = (play.galleryUrls as string).split(',').filter((u: string) => u.trim() !== '');
      urls.forEach(u => {
        photoItems.push({ url: u.trim(), playTitle: play.title, playId: play.id, season: play.season || play.year });
      });
    }

    if (play.videoUrl) {
      const vId = getYoutubeId(play.videoUrl);
      if (vId) {
        videoItems.push({ url: play.videoUrl, videoId: vId, playTitle: play.title, playId: play.id, season: play.season || play.year });
      }
    }
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  const filterTabs = [
    { label: 'Tüm Medya', value: 'Tümü' },
    { label: `📷 Sahne Fotoğrafları (${photoItems.length})`, value: 'Fotograflar' },
    { label: `🎨 Afiş Koleksiyonu (${posterItems.length})`, value: 'Afisler' },
    { label: `🎬 Video Kayıtları (${videoItems.length})`, value: 'Videolar' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Medya Arşivi', url: `${baseUrl}/medya` }
        ]} 
      />

      {/* Header */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-12">
        <div className="max-w-3xl">
          <span className="editorial-tag text-[var(--primary-gold)] block mb-2">DİJİTAL BELGE & GÖRSEL KÜTÜPHANE</span>
          <h1 className="serif-font text-4xl sm:text-5xl md:text-6xl text-[var(--text-main)] mb-4">Medya Arşivi</h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] font-light leading-relaxed">
            FSM Tiyatro prodüksiyonlarının sahne arkası belgeselleri, yüksek çözünürlüklü temsil fotoğrafları, afiş tasarımları ve video kayıtları.
          </p>
        </div>

        {/* Filtre Barı */}
        <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex gap-2 flex-wrap">
          {filterTabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value === 'Tümü' ? '/medya' : `/medya?tur=${tab.value}`}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === tab.value
                  ? 'bg-[var(--primary-gold)] text-black shadow-md'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)]'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Medya İçerik Izgarası */}
      <div className="max-w-[1380px] mx-auto px-[5%] space-y-16">
        
        {/* VİDEOLAR */}
        {(activeTab === 'Tümü' || activeTab === 'Videolar') && videoItems.length > 0 && (
          <div>
            <h2 className="serif-font text-2xl text-[var(--text-main)] mb-6 flex items-center gap-2">
              <ion-icon name="videocam-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
              <span>Sahne Kayıtları & Fragmanlar</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoItems.map((vid, idx) => (
                <div key={idx} className="editorial-card p-4 bg-[var(--bg-surface)] overflow-hidden">
                  <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-black mb-3">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${vid.videoId}`}
                      title={vid.playTitle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-main)]">{vid.playTitle}</span>
                    <Link href={`/sahne/${vid.playId}`} className="text-[var(--primary-gold)] hover:underline font-medium">
                      Oyun Künyesi →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AFİŞLER */}
        {(activeTab === 'Tümü' || activeTab === 'Afisler') && posterItems.length > 0 && (
          <div>
            <h2 className="serif-font text-2xl text-[var(--text-main)] mb-6 flex items-center gap-2">
              <ion-icon name="color-palette-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
              <span>Afiş Koleksiyonu</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {posterItems.map((poster, idx) => (
                <Link key={idx} href={`/sahne/${poster.playId}`} className="editorial-card p-3 bg-[var(--bg-surface)] group block overflow-hidden">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] mb-3">
                    <Image
                      src={poster.url}
                      alt={poster.playTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <h4 className="serif-font text-base text-[var(--text-main)] group-hover:text-[var(--primary-gold)] transition-colors truncate">
                    {poster.playTitle}
                  </h4>
                  <span className="text-[10px] text-[var(--text-dim)] font-mono">{poster.season}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* FOTOĞRAFLAR */}
        {(activeTab === 'Tümü' || activeTab === 'Fotograflar') && photoItems.length > 0 && (
          <div>
            <h2 className="serif-font text-2xl text-[var(--text-main)] mb-6 flex items-center gap-2">
              <ion-icon name="camera-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
              <span>Sahne Arkası & Oyun Fotoğrafları</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photoItems.map((photo, idx) => (
                <div key={idx} className="editorial-card p-2.5 bg-[var(--bg-surface)] group overflow-hidden">
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] mb-2">
                    <Image
                      src={photo.url}
                      alt={photo.playTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  </div>
                  <div className="px-1 flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)] truncate font-medium">{photo.playTitle}</span>
                    <Link href={`/sahne/${photo.playId}`} className="text-[var(--primary-gold)] hover:underline font-bold">
                      İncele →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {photoItems.length === 0 && posterItems.length === 0 && videoItems.length === 0 && (
          <div className="text-center py-24 editorial-card bg-[var(--bg-surface)]">
            <span className="text-3xl mb-2 block">📷</span>
            <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2">Medya Arşivi Güncelleniyor</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">
              Oyun fotoğrafları ve sahne kayıtları sisteme yüklenmektedir.
            </p>
            <Link href="/sahne" className="btn btn-outline text-xs">Repertuvara Dön</Link>
          </div>
        )}

      </div>
    </div>
  );
}
