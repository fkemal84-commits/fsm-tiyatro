import ScrollReveal from "@/components/ScrollReveal";
import HeroCarousel, { HeroSlide } from "@/components/HeroCarousel";
import { adminDb } from "@/lib/firebase-admin";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  let plays: any[] = [];
  let posts: any[] = [];
  let siteConfig: any = null;

  try {
    const [playsSnapshot, postsSnapshot, configDoc] = await Promise.all([
      adminDb.collection('plays').orderBy('createdAt', 'desc').limit(6).get(),
      adminDb.collection('posts').orderBy('createdAt', 'desc').limit(4).get(),
      adminDb.collection('settings').doc('site_config').get(),
    ]);

    plays = playsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (configDoc.exists) siteConfig = configDoc.data();
  } catch (e) {
    console.error("Home fetch error:", e);
  }

  // --- Carousel slaytlarını oluştur ---
  const pinnedIds: string[] = siteConfig?.pinnedSlides || [];

  // Tüm içeriklerden havuz oluştur
  const allItems: HeroSlide[] = [
    ...plays.map(p => ({
      id: p.id,
      type: 'play' as const,
      title: p.title,
      subtitle: p.description?.slice(0, 160),
      imageUrl: p.imageUrl || siteConfig?.heroImageUrl || undefined,
      href: `/plays/${p.id}`,
      tag: `${p.year || '2026'} Sezonu · Oyun`,
      date: p.date,
    })),
    ...posts.map(p => ({
      id: p.id,
      type: 'post' as const,
      title: p.title,
      subtitle: p.excerpt || p.content?.slice(0, 160),
      imageUrl: p.imageUrl || siteConfig?.heroImageUrl || undefined,
      href: `/blog/${p.id}`,
      tag: 'Blog · Kulis',
      date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined,
    })),
  ];

  // Pinlenmiş içerikler önce, geri kalanlar ardından (max 5 slayt)
  const pinnedSlides = allItems.filter(s => pinnedIds.includes(s.id));
  const restSlides = allItems.filter(s => !pinnedIds.includes(s.id));
  const slides: HeroSlide[] = [...pinnedSlides, ...restSlides].slice(0, 5);

  // Eğer hiç içerik yoksa varsayılan slayt
  if (slides.length === 0) {
    slides.push({
      id: 'default',
      type: 'pinned',
      title: 'Sahnenin Hakikati, Perdenin Büyüsü.',
      subtitle: 'Klasik metinlerden çağdaş sahnelemelere; kolektif üretim disiplini ve üniversite ruhuyla sahnede insanı, duyguyu ve gerçeği arayan sanat topluluğuyuz.',
      imageUrl: siteConfig?.heroImageUrl || undefined,
      href: '/plays',
      tag: '2025–2026 Sezonu · Fatih Sultan Mehmet Vakıf Üniversitesi',
    });
  }

  // Ana sayfada gösterilecek oyunlar (en fazla 3)
  const featuredPlays = plays.slice(0, 3);

  return (
    <main className="min-h-screen bg-[var(--bg-dark)]">

      {/* 1. HERO — Dinamik Carousel */}
      <HeroCarousel slides={slides} />

      {/* 2. SEZON OYUNLARI VİTRİNİ */}
      <section className="section max-w-[1380px] mx-auto" id="repertuvar">
        <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-[var(--border-subtle)] pb-8">
          <div>
            <span className="editorial-tag text-[var(--primary-gold)] block mb-2">REPERTUVAR</span>
            <h2 className="serif-font text-4xl sm:text-5xl text-[var(--text-main)]">Sahnede Hayat Bulanlar</h2>
          </div>
          <Link href="/plays" className="text-sm font-semibold text-[var(--primary-gold)] hover:underline flex items-center gap-2">
            Tüm Oyunları İncele →
          </Link>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredPlays.length > 0 ? (
            featuredPlays.map((play) => (
              <ScrollReveal key={play.id} className="editorial-card group flex flex-col p-0 overflow-hidden">
                <div className="relative w-full aspect-[3/4] bg-[var(--bg-surface-elevated)] overflow-hidden border-b border-[var(--border-subtle)]">
                  <Image
                    src={play.imageUrl || '/default-cover.svg'}
                    alt={play.title || 'Oyun Afişi'}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-4 left-4 bg-[var(--bg-dark)]/85 backdrop-blur-md px-3 py-1 rounded text-[11px] font-bold text-[var(--primary-gold)] tracking-widest border border-[var(--border-subtle)] uppercase">
                    {play.year || 'SEZON'}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2 group-hover:text-[var(--primary-gold)] transition-colors">
                    {play.title}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-3 mb-6 font-light leading-relaxed">
                    {play.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-xs text-[var(--text-dim)] uppercase font-bold tracking-wider">FSM Tiyatro</span>
                    <Link
                      href={`/plays/${play.id}`}
                      className="text-xs font-bold text-[var(--primary-gold)] uppercase tracking-wider hover:text-[var(--text-main)] transition-colors"
                    >
                      Oyun Detayları & Afiş →
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))
          ) : (
            <div className="col-span-3 text-center py-16 editorial-card">
              <p className="text-[var(--text-muted)] mb-4">Yeni sezon oyunlarımız hazırlık aşamasında.</p>
              <Link href="/plays" className="btn btn-outline text-xs">Arşivi İnceleyin</Link>
            </div>
          )}
        </div>
      </section>

      {/* 3. SANAT MANİFESTOSU & DEĞERLERİMİZ */}
      <section className="section bg-[var(--bg-surface)] border-y border-[var(--border-subtle)]" id="manifesto">
        <div className="max-w-[1380px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <ScrollReveal className="lg:col-span-6 space-y-6">
            <span className="editorial-tag text-[var(--primary-gold)] block">HAKKIMIZDA</span>
            <h2 className="serif-font text-3xl sm:text-4xl md:text-5xl text-[var(--text-main)] leading-tight">
              "İnsanı, insana, insanla, insanca anlatma sanatı."
            </h2>
            <p className="text-base sm:text-lg text-[var(--text-muted)] font-light leading-relaxed">
              FSM Tiyatro, bir kulüpten öte; öğrencilerin oyunculuk, dramaturji, reji, sahne tasarımı ve prodüksiyon disiplinlerini bizzat yaşayarak öğrendiği açık bir sahne akademisidir.
            </p>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Haliç'in tarihi dokusunda, sahne tozunu samimiyetle harmanlayarak her yıl üniversitemizi ulusal ve yerel tiyatro festivallerinde gururla temsil ediyoruz.
            </p>

            <div className="pt-4 flex gap-4">
              <Link href="/blog" className="btn btn-outline text-xs tracking-wider">
                Blog & Yazılar
              </Link>
              <Link href="/members/team" className="btn btn-primary text-xs tracking-wider">
                Ekibimizi Tanıyın
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
              <span className="text-2xl text-[var(--primary-gold)] mb-3 block">🎭</span>
              <h4 className="text-[var(--text-main)] text-lg font-bold mb-2">Tiyatro Prodüksiyonu</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">Dünya klasiklerinden yerli yazarların çağdaş metinlerine uzanan kapsamlı sahne prodüksiyonları.</p>
            </div>

            <div className="p-6 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
              <span className="text-2xl text-[var(--primary-gold)] mb-3 block">🎬</span>
              <h4 className="text-[var(--text-main)] text-lg font-bold mb-2">Sinema & Senaryo</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">Kısa film çalışmaları, kamera önü oyunculuk pratikleri ve kolektif senaryo atölyeleri.</p>
            </div>

            <div className="p-6 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
              <span className="text-2xl text-[var(--primary-gold)] mb-3 block">📖</span>
              <h4 className="text-[var(--text-main)] text-lg font-bold mb-2">Metin & Dramaturji</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">Karakter analizleri, rol çözümlemeleri ve dijital senaryo kütüphanesiyle derinlikli hazırlık süreci.</p>
            </div>

            <div className="p-6 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
              <span className="text-2xl text-[var(--primary-gold)] mb-3 block">🎫</span>
              <h4 className="text-[var(--text-main)] text-lg font-bold mb-2">Dijital Gişe & Salon</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">Kendi geliştirdiğimiz QR bilet sistemi ve anlık koltuk haritasıyla kusursuz seyirci deneyimi.</p>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* 4. KURUMSAL İŞ BİRLİKLERİ & SANAT DESTEKÇİLERİ */}
      <section className="section max-w-[1380px] mx-auto text-center" id="sponsorluk">
        <ScrollReveal className="max-w-3xl mx-auto mb-12">
          <span className="editorial-tag text-[var(--primary-gold)] block mb-2">KURUMSAL & SANAT DESTEĞİ</span>
          <h2 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)] mb-4">Geleceğin Sanatçılarına Destek Olun</h2>
          <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed">
            Üniversitemizde sahne sanatlarının sürdürülebilirliği ve öğrencilerimizin daha geniş kitlelere ulaşması için kurumsal ve bireysel destekçilerimizle güçlü ortaklıklar kuruyoruz.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12 text-left">

          <div className="editorial-card p-8 border-t-2 border-t-[#a89078] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#a89078] uppercase tracking-widest block mb-2">ETKİNLİK DESTEĞİ</span>
              <h3 className="serif-font text-xl text-[var(--text-main)] mb-3">Tanıtım & İletişim</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
                Oyun broşürleri, afişler ve dijital yayınlarımızda logonuzla gençlik ve kültür sanat kitlelerine ulaşın.
              </p>
            </div>
            <span className="text-xs font-bold text-[var(--text-dim)] uppercase">Marka Görünürlüğü</span>
          </div>

          <div className="editorial-card p-8 border-t-2 border-t-[var(--primary-gold)] flex flex-col justify-between bg-[var(--bg-surface-elevated)]">
            <div>
              <span className="text-xs font-bold text-[var(--primary-gold)] uppercase tracking-widest block mb-2">PRODÜKSİYON ORTAKLIĞI</span>
              <h3 className="serif-font text-xl text-[var(--text-main)] mb-3">Sezon Partnerliği</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
                Sezon boyunca sahnelenen ana oyunların sahne, kostüm ve dekor prodüksiyonlarına doğrudan katkı sağlayın.
              </p>
            </div>
            <span className="text-xs font-bold text-[var(--primary-gold)] uppercase">Öne Çıkan Entegrasyon</span>
          </div>

          <div className="editorial-card p-8 border-t-2 border-t-[var(--accent-crimson-bright)] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[var(--accent-crimson-bright)] uppercase tracking-widest block mb-2">ÖZEL KATKI</span>
              <h3 className="serif-font text-xl text-[var(--text-main)] mb-3">Kültür & Mekan Destekçisi</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
                Turne, festival ve atölye organizasyonlarımızda genç tiyatrocuların yolunu açan stratejik hamimiz olun.
              </p>
            </div>
            <span className="text-xs font-bold text-[var(--text-dim)] uppercase">Kültür-Sanat Temsili</span>
          </div>

        </div>

        <ScrollReveal>
          <div className="inline-flex flex-wrap items-center justify-center gap-4 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-muted)]">Sponsorluk & İletişim:</span>
            <a
              href={`mailto:${siteConfig?.contactEmail || 'tiyatro@fsm.edu.tr'}`}
              className="text-xs font-bold text-[var(--primary-gold)] hover:underline flex items-center gap-1.5"
            >
              <ion-icon name="mail-outline"></ion-icon>
              {siteConfig?.contactEmail || 'tiyatro@fsm.edu.tr'}
            </a>
            <span className="text-[var(--text-dim)] hidden sm:inline">&bull;</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">FSMVÜ Sinema ve Tiyatro Kulübü</span>
          </div>
        </ScrollReveal>
      </section>

    </main>
  );
}
