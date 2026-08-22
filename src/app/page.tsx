import ScrollReveal from "@/components/ScrollReveal";
import HeroCarousel, { HeroSlide } from "@/components/HeroCarousel";
import { adminDb } from "@/lib/firebase-admin";
import Image from "next/image";
import Link from "next/link";
import { OrganizationJsonLd } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

export default async function Home() {
  let plays: any[] = [];
  let posts: any[] = [];
  let events: any[] = [];
  let siteConfig: any = null;

  try {
    const [playsSnapshot, postsSnapshot, eventsSnapshot, configDoc] = await Promise.all([
      adminDb.collection('plays').orderBy('createdAt', 'desc').limit(6).get(),
      adminDb.collection('posts').orderBy('createdAt', 'desc').limit(4).get(),
      adminDb.collection('events').orderBy('createdAt', 'desc').limit(4).get(),
      adminDb.collection('settings').doc('site_config').get(),
    ]);

    plays = playsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (configDoc.exists) siteConfig = configDoc.data();
  } catch (e) {
    console.error("Home fetch error:", e);
  }

  // --- Hero Carousel Slaytları ---
  const pinnedIds: string[] = siteConfig?.pinnedSlides || [];

  const allItems: HeroSlide[] = [
    ...plays.map(p => ({
      id: p.id,
      type: 'play' as const,
      title: p.title,
      subtitle: p.description?.slice(0, 160),
      imageUrl: p.imageUrl || siteConfig?.heroImageUrl || undefined,
      href: `/sahne/${p.id}`,
      tag: `${p.season || p.year || '2026'} Sezonu · Prodüksiyon`,
      date: p.showDates && p.showDates.length > 0 ? p.showDates[0].date : p.year,
    })),
    ...posts.map(p => ({
      id: p.id,
      type: 'post' as const,
      title: p.title,
      subtitle: p.excerpt || p.content?.slice(0, 160),
      imageUrl: p.imageUrl || siteConfig?.heroImageUrl || undefined,
      href: `/yayin/${p.id}`,
      tag: `${p.category || 'Yayın'} · FSM Tiyatro`,
      date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined,
    })),
  ];

  const pinnedSlides = allItems.filter(s => pinnedIds.includes(s.id));
  const restSlides = allItems.filter(s => !pinnedIds.includes(s.id));
  const slides: HeroSlide[] = [...pinnedSlides, ...restSlides].slice(0, 5);

  if (slides.length === 0) {
    slides.push({
      id: 'default',
      type: 'pinned',
      title: 'Sahnenin Hakikati, Perdenin Büyüsü.',
      subtitle: 'Klasik metinlerden çağdaş sahnelemelere; kolektif üretim disiplini ve üniversite ruhuyla sahnede insanı, duyguyu ve gerçeği arayan tiyatro topluluğuyuz.',
      imageUrl: siteConfig?.heroImageUrl || undefined,
      href: '/sahne',
      tag: '2025–2026 Sezonu · Fatih Sultan Mehmet Vakıf Üniversitesi',
    });
  }

  const featuredPlays = plays.slice(0, 3);
  const activeSeason = siteConfig?.activeSeason || '2025–2026';

  const departments = [
    { title: 'Oyunculuk & Rol Dağıtımı', icon: 'happy-outline', desc: 'Karakter çözümlemeleri, beden dili, diksiyon ve sahne duruşu pratikleri.' },
    { title: 'Reji & Yönetmenlik', icon: 'film-outline', desc: 'Metin analizi, sahne trafiği yönetimi, oyuncu yönetimi ve rejisör vizyonu.' },
    { title: 'Dramaturgi & Metin', icon: 'book-outline', desc: 'Tiyatro tarihi araştırmaları, alt metin çözümlemeleri ve akademik incelemeler.' },
    { title: 'Işık & Görsel Tasarım', icon: 'bulb-outline', desc: 'Sahne atmosferi oluşturma, ışık masası yönetimi ve renk psikolojisi.' },
    { title: 'Ses & Sahne Müziği', icon: 'musical-notes-outline', desc: 'Oyun müzikleri seçimi, efekt tasarımı ve mikser kumandası.' },
    { title: 'Dekor & Kostüm Tasarımı', icon: 'color-palette-outline', desc: 'Dönem kostümleri, aksesuar üretimi ve mekan/dekor inşası.' },
    { title: 'Fotoğraf & Video Arşivi', icon: 'camera-outline', desc: 'Prova belgeseli, sahne çekimleri, fragmanlar ve dijital medya.' },
    { title: 'Gişe & Seyirci Deneyimi', icon: 'ticket-outline', desc: 'QR bilet operasyonu, koltuk organizasyonu ve salon yönetimi.' },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg-dark)]">
      <OrganizationJsonLd />

      {/* 1. HERO — Dinamik Canlı Sahne Slaytı */}
      <HeroCarousel slides={slides} showTicketQuery={siteConfig?.isTicketQueryActive !== false} />

      {/* 2. SEZON REPERTUVARI & ŞU ANDA SAHNEDE */}
      <section className="section max-w-[1380px] mx-auto" id="repertuvar">
        <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-[var(--border-subtle)] pb-8">
          <div>
            <span className="editorial-tag text-[var(--primary-gold)] block mb-2">{activeSeason} SEZONU</span>
            <h2 className="serif-font text-4xl sm:text-5xl text-[var(--text-main)]">Sahnede Hayat Bulanlar</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2 font-light">Kolektif emekle üretilen güncel tiyatro prodüksiyonlarımız</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/arsiv" className="text-xs font-bold text-[var(--text-dim)] hover:text-[var(--text-main)] uppercase tracking-wider">
              Geçmiş Arşiv →
            </Link>
            <Link href="/sahne" className="btn btn-outline text-xs tracking-wider">
              Tüm Repertuvar
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredPlays.length > 0 ? (
            featuredPlays.map((play) => (
              <ScrollReveal key={play.id} className="editorial-card group flex flex-col p-0 overflow-hidden">
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

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs text-[var(--primary-gold)] font-mono">
                    <span>{play.playwright ? `Yazar: ${play.playwright}` : 'FSM Tiyatro Yapımı'}</span>
                    {play.duration && <span>{play.duration}</span>}
                  </div>
                  <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2 group-hover:text-[var(--primary-gold)] transition-colors">
                    {play.title}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-3 mb-6 font-light leading-relaxed">
                    {play.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-xs text-[var(--text-dim)] uppercase font-bold tracking-wider">
                      {play.director ? `Reji: ${play.director}` : 'FSM Tiyatro'}
                    </span>
                    <Link
                      href={`/sahne/${play.id}`}
                      className="text-xs font-bold text-[var(--primary-gold)] uppercase tracking-wider hover:text-[var(--text-main)] transition-colors"
                    >
                      Oyun Künyesi & Afiş →
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))
          ) : (
            <div className="col-span-3 text-center py-16 editorial-card">
              <p className="text-[var(--text-muted)] mb-4">Yeni sezon prodüksiyonlarımız provalarda şekilleniyor.</p>
              <Link href="/arsiv" className="btn btn-outline text-xs">Dijital Arşivi İnceleyin</Link>
            </div>
          )}
        </div>
      </section>

      {/* 3. İSTATİSTİKLER & KURUMSAL GÜÇ (STATS TICKER) */}
      <section className="section bg-[var(--bg-surface)] border-y border-[var(--border-subtle)] py-14">
        <div className="max-w-[1380px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <ScrollReveal className="space-y-1">
            <span className="serif-font text-4xl sm:text-5xl text-[var(--primary-gold)] font-bold">10+</span>
            <p className="text-xs sm:text-sm text-[var(--text-main)] font-semibold uppercase tracking-wider">Yıllık Sahne Geleneği</p>
            <p className="text-[11px] text-[var(--text-dim)]">Üniversite ruhuyla kesintisiz üretim</p>
          </ScrollReveal>

          <ScrollReveal className="space-y-1">
            <span className="serif-font text-4xl sm:text-5xl text-[var(--primary-gold)] font-bold">30+</span>
            <p className="text-xs sm:text-sm text-[var(--text-main)] font-semibold uppercase tracking-wider">Tiyatro Prodüksiyonu</p>
            <p className="text-[11px] text-[var(--text-dim)]">Klasik ve çağdaş metinler</p>
          </ScrollReveal>

          <ScrollReveal className="space-y-1">
            <span className="serif-font text-4xl sm:text-5xl text-[var(--primary-gold)] font-bold">15.000+</span>
            <p className="text-xs sm:text-sm text-[var(--text-main)] font-semibold uppercase tracking-wider">Tiyatro Seyircisi</p>
            <p className="text-[11px] text-[var(--text-dim)]">Salonları dolduran sanatseverler</p>
          </ScrollReveal>

          <ScrollReveal className="space-y-1">
            <span className="serif-font text-4xl sm:text-5xl text-[var(--primary-gold)] font-bold">12</span>
            <p className="text-xs sm:text-sm text-[var(--text-main)] font-semibold uppercase tracking-wider">Sanat & Teknik Alan</p>
            <p className="text-[11px] text-[var(--text-dim)]">Oyunculuktan ışık tasarımına</p>
          </ScrollReveal>
        </div>
      </section>

      {/* 4. ATÖLYELER & ETKİNLİK TAKVİMİ */}
      {events.length > 0 && (
        <section className="section max-w-[1380px] mx-auto">
          <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 border-b border-[var(--border-subtle)] pb-6">
            <div>
              <span className="editorial-tag text-[var(--primary-gold)] block mb-1">AJANDA & BULUŞMALAR</span>
              <h2 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)]">Atölyeler ve Etkinlikler</h2>
            </div>
            <Link href="/uretim" className="text-xs font-bold text-[var(--primary-gold)] uppercase tracking-wider hover:underline">
              Tüm Takvimi Gör →
            </Link>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((e) => (
              <div key={e.id} className="editorial-card p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[var(--primary-gold)] bg-[var(--primary-gold-dim)] px-2.5 py-1 rounded-full uppercase border border-[var(--primary-gold-border)] inline-block mb-3">
                    {e.type || 'Etkinlik'}
                  </span>
                  <h4 className="serif-font text-xl text-[var(--text-main)] mb-2">{e.title}</h4>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-4">{e.description}</p>
                </div>
                <div className="pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-dim)] space-y-1">
                  <div className="flex items-center gap-1.5 text-[var(--text-main)] font-medium">
                    <ion-icon name="calendar-outline"></ion-icon>
                    <span>{e.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ion-icon name="location-outline"></ion-icon>
                    <span>{e.location || 'Haliç Yerleşkesi'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. KÜLTÜR, SANAT & YAYIN MERKEZİ VİTRİNİ */}
      <section className="section max-w-[1380px] mx-auto">
        <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-[var(--border-subtle)] pb-8">
          <div>
            <span className="editorial-tag text-[var(--primary-gold)] block mb-2">YAYIN MERKEZİ & GÜNCE</span>
            <h2 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)]">Kulis Günlükleri ve Tiyatro İncelemeleri</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2 font-light">Dramaturgi analizleri, sahne arkası düşünceleri ve akademik bildiriler</p>
          </div>
          <Link href="/yayin" className="btn btn-outline text-xs tracking-wider">
            Yayın Arşivi
          </Link>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.slice(0, 3).map((p) => (
            <div key={p.id} className="editorial-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-[var(--primary-gold)] font-bold uppercase tracking-wider">{p.category || 'Yazı'}</span>
                  <span className="text-[var(--text-dim)]">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('tr-TR') : ''}</span>
                </div>
                <h3 className="serif-font text-xl text-[var(--text-main)] mb-3 leading-snug hover:text-[var(--primary-gold)] transition-colors">
                  <Link href={`/yayin/${p.id}`}>{p.title}</Link>
                </h3>
                <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed mb-6">
                  {p.excerpt || p.content}
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-dim)] font-medium">🖋️ {p.author || 'FSM Tiyatro'}</span>
                <Link href={`/yayin/${p.id}`} className="text-[var(--primary-gold)] font-bold hover:underline">
                  Yazıyı Oku →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. KULÜBE KATIL — 12 FARKLI SANAT DEPARTMANI */}
      <section className="section bg-[var(--bg-surface)] border-y border-[var(--border-subtle)]" id="katil">
        <div className="max-w-[1380px] mx-auto">
          <ScrollReveal className="max-w-3xl mb-12">
            <span className="editorial-tag text-[var(--primary-gold)] block mb-2">TOPLULUĞUMUZA KATILIN</span>
            <h2 className="serif-font text-3xl sm:text-4xl md:text-5xl text-[var(--text-main)] leading-tight mb-4">
              "Tiyatro Yalnızca Sahneden İbaret Değildir."
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-muted)] font-light leading-relaxed">
              FSM Tiyatro; oyunculuktan ışık tasarımına, dramaturjiden sahne arkası yönetimine kadar 12 farklı alanda öğrencilerin kendilerini geliştirebileceği kolektif bir sanat okuludur.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {departments.map((dep, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[var(--primary-gold-dim)] text-[var(--primary-gold)] flex items-center justify-center text-xl mb-4 border border-[var(--primary-gold-border)]">
                  <ion-icon name={dep.icon}></ion-icon>
                </div>
                <h4 className="text-base font-bold text-[var(--text-main)] mb-2">{dep.title}</h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{dep.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-r from-[var(--primary-gold-dim)] via-[var(--bg-surface-elevated)] to-[var(--bg-surface)] border border-[var(--primary-gold-border)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="serif-font text-2xl text-[var(--text-main)] mb-1">Sezon Seçmelerine ve Ekibe Dahil Olun</h3>
              <p className="text-xs text-[var(--text-muted)]">Deneyim şartı aranmaksızın, tutkusu olan tüm üniversite öğrencilerimize kapımız açık.</p>
            </div>
            <Link href="/katil" className="btn btn-primary text-xs tracking-wider px-8 py-3.5 flex-shrink-0">
              Başvuru & Departman Rehberi
            </Link>
          </div>
        </div>
      </section>

      {/* 7. KURUMSAL İŞ BİRLİKLERİ & SANAT DESTEKÇİLERİ */}
      <section className="section max-w-[1380px] mx-auto text-center" id="destek">
        <ScrollReveal className="max-w-2xl mx-auto mb-10">
          <span className="editorial-tag text-[var(--primary-gold)] block mb-2">DESTEK & ORTAKLIK</span>
          <h2 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)] mb-3">Geleceğin Sanatçılarına Destek Olun</h2>
          <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed font-light">
            Üniversitemizde sahne sanatlarının sürdürülebilirliği için kurumsal hamilerimiz ve kültür-sanat kurumlarıyla iş birliği yapıyoruz.
          </p>
        </ScrollReveal>

        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/destek" className="btn btn-outline text-xs tracking-wider">
            Kurumsal İş Birliği & Sponsorluk
          </Link>
          <a
            href={`mailto:${siteConfig?.contactEmail || 'tiyatro@fsm.edu.tr'}`}
            className="btn btn-primary text-xs tracking-wider"
          >
            İletişime Geçin
          </a>
        </div>
      </section>

    </main>
  );
}
