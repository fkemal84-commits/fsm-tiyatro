import ScrollReveal from "@/components/ScrollReveal";
import HeroCarousel, { HeroSlide } from "@/components/HeroCarousel";
import { adminDb } from "@/lib/firebase-admin";
import Image from "next/image";
import Link from "next/link";
import { OrganizationJsonLd } from "@/components/JsonLd";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatAuthorSignature } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  let isLoggedIn = false;
  let cleanName = '';

  try {
    const session = await getServerSession(authOptions);
    isLoggedIn = !!session?.user;
    const rawName = session?.user?.name || '';
    cleanName = rawName.replace(/undefined/gi, '').trim() || session?.user?.email?.split('@')[0] || '';
  } catch (e) {
    console.warn("[HOME] Session fetch warning:", e);
  }

  let plays: any[] = [];
  let posts: any[] = [];
  let events: any[] = [];
  let siteConfig: any = null;

  try {
    const [playsSnapshot, postsSnapshot, eventsSnapshot, configDoc] = await Promise.all([
      adminDb.collection('plays').get().catch(() => ({ docs: [] as any[] })),
      adminDb.collection('posts').get().catch(() => ({ docs: [] as any[] })),
      adminDb.collection('events').get().catch(() => ({ docs: [] as any[] })),
      adminDb.collection('settings').doc('site_config').get().catch(() => ({ exists: false, data: () => ({}) })),
    ]);

    plays = ((playsSnapshot as any).docs || [])
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    posts = ((postsSnapshot as any).docs || [])
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .filter((p: any) => p.status === 'PUBLISHED' || !p.status)
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    events = ((eventsSnapshot as any).docs || [])
      .map((doc: any) => ({ id: doc.id, ...doc.data() }));

    if (configDoc && 'exists' in configDoc && (configDoc as any).exists) {
      siteConfig = (configDoc as any).data();
    }
  } catch (e) {
    console.error("[HOME] Data fetch error:", e);
  }

  // --- Hero Slaytları ---
  const pinnedIds: string[] = Array.isArray(siteConfig?.pinnedSlides) ? siteConfig.pinnedSlides : [];

  const allItems: HeroSlide[] = [];

  // 1. Özel Hero Banner varsa ekle
  if (siteConfig?.heroImageUrl) {
    allItems.push({
      id: 'custom_hero_banner',
      type: 'pinned',
      title: siteConfig.heroTitle || 'FSM Tiyatro',
      subtitle: siteConfig.heroSubtitle || 'Fatih Sultan Mehmet Vakıf Üniversitesi Sinema ve Tiyatro Kulübü.',
      imageUrl: siteConfig.heroImageUrl,
      href: '/oyunlar',
      tag: 'FSM Tiyatro',
    });
  }

  // 2. Oyunlar ve Kulis Yazıları
  allItems.push(
    ...plays.slice(0, 4).map(p => ({
      id: p.id,
      type: 'play' as const,
      title: p.title || 'FSM Tiyatro Oyunu',
      subtitle: p.description?.slice(0, 140) || '',
      imageUrl: p.imageUrl || p.posterUrl || siteConfig?.heroImageUrl || undefined,
      href: `/oyunlar/${p.id}`,
      tag: `${p.season || p.year || '2026'} · Oyun`,
      date: Array.isArray(p.showDates) && p.showDates.length > 0 ? p.showDates[0]?.date : (p.year || ''),
    })),
    ...posts.slice(0, 3).map(p => ({
      id: p.id,
      type: 'post' as const,
      title: p.title || 'Kulis Yazısı',
      subtitle: p.excerpt || p.content?.slice(0, 140) || '',
      imageUrl: p.imageUrl || siteConfig?.heroImageUrl || undefined,
      href: `/kulis/${p.id}`,
      tag: 'Kulis',
      date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('tr-TR') : undefined,
    }))
  );

  const pinnedSlides = allItems.filter(s => pinnedIds.includes(s.id));
  const restSlides = allItems.filter(s => !pinnedIds.includes(s.id));
  const slides: HeroSlide[] = [...pinnedSlides, ...restSlides].slice(0, 4);

  if (slides.length === 0) {
    slides.push({
      id: 'default',
      type: 'pinned',
      title: 'FSM Tiyatro',
      subtitle: 'Fatih Sultan Mehmet Vakıf Üniversitesi Sinema ve Tiyatro Kulübü.',
      imageUrl: siteConfig?.heroImageUrl || undefined,
      href: '/oyunlar',
      tag: 'FSM Tiyatro',
    });
  }

  const featuredPlays = plays.slice(0, 2);

  return (
    <main className="min-h-screen bg-[var(--bg-dark)]">
      <OrganizationJsonLd />

      {/* 1. HERO — Büyük Sahne ve Güncel Oyun */}
      <HeroCarousel slides={slides} showTicketQuery={siteConfig?.isTicketQueryActive !== false} />

      {/* 2. SAHNEDE & YAKLAŞANLAR (ODAKLI VE SADE) */}
      <section className="section max-w-[1380px] mx-auto py-16">
        <ScrollReveal className="flex items-center justify-between mb-8 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <span className="editorial-tag text-[var(--primary-gold)] block text-[10px] mb-1">REPERTUVAR</span>
            <h2 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)]">Sahnede</h2>
          </div>
          <Link href="/oyunlar" className="text-xs font-bold text-[var(--primary-gold)] hover:underline uppercase tracking-wider">
            Tüm Oyunlar →
          </Link>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuredPlays.length > 0 ? (
            featuredPlays.map((play) => (
              <ScrollReveal key={play.id} className="editorial-card group flex flex-col p-0 overflow-hidden bg-[var(--bg-surface)]">
                <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-[var(--bg-surface-elevated)] overflow-hidden border-b border-[var(--border-subtle)]">
                  <Image
                    src={play.imageUrl || play.posterUrl || '/default-cover.svg'}
                    alt={play.title || 'Oyun Görseli'}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute top-3 left-3 bg-[var(--bg-dark)]/90 backdrop-blur-md px-2.5 py-0.5 rounded text-[10px] font-bold text-[var(--primary-gold)] font-mono border border-[var(--border-subtle)]">
                    {play.season || play.year || 'FSM Tiyatro'}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="text-xs text-[var(--primary-gold)] font-mono mb-1">
                    {play.playwright ? `Yazan: ${play.playwright}` : 'FSM Tiyatro'}
                  </div>
                  <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2 group-hover:text-[var(--primary-gold)] transition-colors">
                    <Link href={`/oyunlar/${play.id}`}>{play.title}</Link>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-6 font-light leading-relaxed">
                    {play.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-xs text-[var(--text-dim)]">
                      {play.director ? `Yöneten: ${play.director}` : 'FSM Tiyatro'}
                    </span>
                    <Link
                      href={`/oyunlar/${play.id}`}
                      className="text-xs font-bold text-[var(--primary-gold)] hover:underline"
                    >
                      Oyun Detayı →
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))
          ) : (
            <div className="col-span-2 text-center py-12 editorial-card bg-[var(--bg-surface)]">
              <p className="text-xs text-[var(--text-muted)] mb-3">Yeni sezon provaları devam ediyor.</p>
              <Link href="/oyunlar" className="btn btn-outline text-xs">Oyun Arşivi</Link>
            </div>
          )}
        </div>
      </section>

      {/* 3. KULİSTEN (FOTOĞRAF VE YAZILAR) */}
      {posts.length > 0 && (
        <section className="section max-w-[1380px] mx-auto py-12">
          <ScrollReveal className="flex items-center justify-between mb-8 border-b border-[var(--border-subtle)] pb-4">
            <div>
              <span className="editorial-tag text-[var(--primary-gold)] block text-[10px] mb-1">PROVALAR & NOTLAR</span>
              <h2 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)]">Kulisten</h2>
            </div>
            <Link href="/kulis" className="text-xs font-bold text-[var(--primary-gold)] hover:underline uppercase tracking-wider">
              Tüm Yazılar →
            </Link>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((p) => (
              <div key={p.id} className="editorial-card p-5 bg-[var(--bg-surface)] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-[var(--primary-gold)] font-bold uppercase tracking-wider block mb-2">
                    {p.category || 'Kulis'}
                  </span>
                  <h3 className="serif-font text-lg text-[var(--text-main)] mb-2 leading-snug hover:text-[var(--primary-gold)] transition-colors">
                    <Link href={`/kulis/${p.id}`}>{p.title}</Link>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-4 font-light">
                    {p.excerpt || p.content}
                  </p>
                </div>
                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-dim)]">
                  <span>{formatAuthorSignature(p.author)}</span>
                  <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('tr-TR') : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. FSM TİYATRO NEDİR? (2 CÜMLELİK NET KİMLİK) */}
      <section className="section bg-[var(--bg-surface)] border-y border-[var(--border-subtle)] py-16">
        <div className="max-w-3xl mx-auto text-center space-y-4 px-[5%]">
          <span className="editorial-tag text-[var(--primary-gold)] block text-[10px]">FSM TİYATRO</span>
          <h2 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)] leading-snug">
            "Üniversitede tiyatro yapıyoruz."
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-muted)] font-light leading-relaxed">
            Fatih Sultan Mehmet Vakıf Üniversitesi Tiyatro Kulübü; oyunculuktan ışık tasarımına, metin çözümlemesinden sahne arkasına kadar tüm prodüksiyonu öğrencilerin kolektif emeğiyle kuran bir topluluktur.
          </p>
          <div className="pt-2">
            <Link href="/kulup" className="btn btn-outline text-xs font-bold">
              Kulüp & Ekip Hakkında
            </Link>
          </div>
        </div>
      </section>

      {/* 5. KULÜBE KATIL / ÜYE PANOSU ÇAĞRISI */}
      <section className="section max-w-4xl mx-auto py-16 text-center px-[5%]">
        <ScrollReveal className="space-y-4">
          {isLoggedIn ? (
            <>
              <span className="editorial-tag text-[var(--primary-gold)] block text-[10px]">FSM TİYATRO PORTALI</span>
              <h2 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)]">
                Hoş Geldiniz, {cleanName}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] font-light max-w-lg mx-auto leading-relaxed">
                Prova takviminiz, açık ekip ihtiyaç ilanları ve sahne metinlerinize Üye Panosu üzerinden hemen ulaşabilirsiniz.
              </p>
              <div className="pt-3">
                <Link href="/members" className="btn btn-primary text-xs font-bold px-8 py-3">
                  Üye Panosuna Git →
                </Link>
              </div>
            </>
          ) : (
            <>
              <span className="editorial-tag text-[var(--primary-gold)] block text-[10px]">SEN DE BİZE KATIL</span>
              <h2 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)]">
                Sahnede veya Perde Arkasında Yerini Al.
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] font-light max-w-lg mx-auto leading-relaxed">
                Oyunculuk, reji, ışık, ses, dekor, kostüm, afiş ve sahne arkası... Önceden tiyatro deneyiminizin olması gerekmez.
              </p>
              <div className="pt-3">
                <Link href="/katil" className="btn btn-primary text-xs font-bold px-8 py-3">
                  Kulübe Katılın
                </Link>
              </div>
            </>
          )}
        </ScrollReveal>
      </section>

    </main>
  );
}
