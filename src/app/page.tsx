import ScrollReveal from "@/components/ScrollReveal";
import { adminDb } from "@/lib/firebase-admin";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  let plays: any[] = [];
  try {
    const playsSnapshot = await adminDb.collection('plays').orderBy('createdAt', 'desc').limit(3).get();
    plays = playsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (e) {
    console.error("Home plays fetch error:", e);
  }

  return (
    <main className="min-h-screen bg-[var(--bg-dark)]">
      
      {/* 1. HERO SECTION - Editoryal Sahne */}
      <section className="relative pt-40 pb-24 px-[5%] max-w-[1380px] mx-auto min-h-[90vh] flex flex-col justify-center">
        <div className="max-w-4xl">
          
          {/* Sezon & Kurum Damgası */}
          <div className="inline-flex items-center gap-3 mb-6 px-3.5 py-1.5 rounded-full border border-[var(--primary-gold-border)] bg-[var(--primary-gold-dim)] text-[var(--primary-gold)] text-xs font-bold tracking-[0.18em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-gold)] animate-pulse"></span>
            2025–2026 Sezonu &bull; Fatih Sultan Mehmet Vakıf Üniversitesi
          </div>

          <h1 className="serif-font text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-[var(--text-main)] leading-[1.04] mb-8">
            Sahnenin Hakikati,<br />
            <span className="italic font-normal text-[var(--primary-gold)] serif-sub">Perdenin Büyüsü.</span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--text-muted)] max-w-2xl font-light leading-relaxed mb-10">
            Klasik metinlerden çağdaş sahnelemelere; kolektif üretim disiplini ve üniversite ruhuyla sahnede insanı, duyguyu ve gerçeği arayan sanat topluluğuyuz.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link 
              href="/biletimi-bul" 
              className="btn btn-primary px-8 py-4 text-sm font-bold tracking-wider"
            >
              <ion-icon name="qr-code-outline" style={{ fontSize: '1.2rem' }}></ion-icon>
              BİLETİMİ SORGULA
            </Link>
            
            <Link 
              href="/plays" 
              className="btn btn-outline px-8 py-4 text-sm tracking-wider"
            >
              SEZON REPERTUVARI
            </Link>

            <Link 
              href="#manifesto" 
              className="px-6 py-4 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              Kulüp Hakkında →
            </Link>
          </div>
        </div>

        {/* Alt Meta Şerit */}
        <div className="mt-20 pt-8 border-t border-[var(--border-subtle)] grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div>
            <span className="block text-[11px] text-[var(--text-dim)] uppercase font-bold tracking-widest">TOPLULUK</span>
            <span className="text-sm font-semibold text-[var(--text-main)]">Sinema ve Tiyatro Kulübü</span>
          </div>
          <div>
            <span className="block text-[11px] text-[var(--text-dim)] uppercase font-bold tracking-widest">YERLEŞKE</span>
            <span className="text-sm font-semibold text-[var(--text-main)]">Haliç Yerleşkesi & Sahne</span>
          </div>
          <div>
            <span className="block text-[11px] text-[var(--text-dim)] uppercase font-bold tracking-widest">DİJİTAL SİSTEM</span>
            <span className="text-sm font-semibold text-[var(--text-main)]">Canlı Yoklama & QR Gişe</span>
          </div>
          <div>
            <span className="block text-[11px] text-[var(--text-dim)] uppercase font-bold tracking-widest">DURUM</span>
            <span className="text-sm font-semibold text-[var(--primary-gold)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Provalar Aktif
            </span>
          </div>
        </div>
      </section>

      {/* 2. KAYAN SAHNE BANDI (MARQUEE TICKER) */}
      <div className="marquee-container" aria-hidden="true">
        <div className="marquee-content">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--text-muted)] flex items-center gap-4">
            PERDE HİÇ KAPANMASIN <span className="text-[var(--primary-gold)]">&bull;</span>
            2026 SEZONU REPERTUVARI <span className="text-[var(--primary-gold)]">&bull;</span>
            CANLI PROVA VE ATÖLYELER <span className="text-[var(--primary-gold)]">&bull;</span>
            HALİÇ SAHNESİ <span className="text-[var(--primary-gold)]">&bull;</span>
            SENARYO KASASI VE KULİS <span className="text-[var(--primary-gold)]">&bull;</span>
            BİLETİNİ ONLİNE DOĞRULA <span className="text-[var(--primary-gold)]">&bull;</span>
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--text-muted)] flex items-center gap-4">
            PERDE HİÇ KAPANMASIN <span className="text-[var(--primary-gold)]">&bull;</span>
            2026 SEZONU REPERTUVARI <span className="text-[var(--primary-gold)]">&bull;</span>
            CANLI PROVA VE ATÖLYELER <span className="text-[var(--primary-gold)]">&bull;</span>
            HALİÇ SAHNESİ <span className="text-[var(--primary-gold)]">&bull;</span>
            SENARYO KASASI VE KULİS <span className="text-[var(--primary-gold)]">&bull;</span>
            BİLETİNİ ONLİNE DOĞRULA <span className="text-[var(--primary-gold)]">&bull;</span>
          </span>
        </div>
      </div>

      {/* 3. SEZON OYUNLARI VİTRİNİ */}
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
          {plays.length > 0 ? (
            plays.map((play) => (
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

      {/* 4. SANAT MANİFESTOSU & DEĞERLERİMİZ */}
      <section className="section bg-[var(--bg-surface)] border-y border-[var(--border-subtle)]" id="manifesto">
        <div className="max-w-[1380px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <ScrollReveal className="lg:col-span-6 space-y-6">
            <span className="editorial-tag text-[var(--primary-gold)] block">SANAT MANİFESTOSU</span>
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
                Kulis Güncesi & Blog
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

      {/* 5. KURUMSAL İŞ BİRLİKLERİ & SANAT DESTEKÇİLERİ */}
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
            <span className="text-xs text-[var(--text-muted)]">Sponsorluk & İletişim Koordinasyonu:</span>
            <a 
              href="mailto:tiyatro@fsm.edu.tr" 
              className="text-xs font-bold text-[var(--primary-gold)] hover:underline flex items-center gap-1.5"
            >
              <ion-icon name="mail-outline"></ion-icon> tiyatro@fsm.edu.tr
            </a>
            <span className="text-[var(--text-dim)] hidden sm:inline">&bull;</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">FSMVÜ Sinema ve Tiyatro Kulübü</span>
          </div>
        </ScrollReveal>
      </section>

    </main>
  );
}
