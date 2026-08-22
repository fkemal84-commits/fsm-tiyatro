import ScrollReveal from "@/components/ScrollReveal";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";

export const metadata: Metadata = {
  title: "Repertuvar & Sahnede İz Bırakanlar",
  description: "FSM Tiyatro'nun geçmişten bugüne sergilediği tüm oyunlar, sahne prodüksiyonları ve başarı hikayelerimiz.",
};

export const dynamic = 'force-dynamic';

export default async function Plays() {
  const snapshot = await adminDb.collection('plays').orderBy('createdAt', 'desc').get();
  const plays = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt ? new Date(doc.data().createdAt) : new Date()
  } as any));

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] pt-36 pb-24">
      {/* Header */}
      <header className="max-w-[1380px] mx-auto px-[5%] text-center mb-16">
        <span className="editorial-tag text-[var(--primary-gold)] block mb-3">REPERTUVAR & SAHNE TARİHİ</span>
        <h1 className="serif-font text-5xl sm:text-6xl md:text-7xl text-[var(--text-main)] mb-4">
          Sahnede İz Bırakanlar
        </h1>
        <p className="text-[var(--text-muted)] max-w-xl mx-auto text-base sm:text-lg font-light leading-relaxed">
          Kuruluşumuzdan bu yana sahnelediğimiz, üniversitemizde sanatın ve tiyatronun nabzını tutan seçkin eserlerimiz.
        </p>
      </header>

      {/* Oyunlar Galerisi */}
      <section className="max-w-[1380px] mx-auto px-[5%]">
        <ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {plays.length === 0 ? (
              <div className="col-span-full editorial-card text-center py-16">
                <p className="text-[var(--text-muted)] text-sm">Henüz kayıtlı bir oyun bulunmuyor.</p>
              </div>
            ) : (
              plays.map(play => (
                <ScrollReveal key={play.id}>
                  <article className="editorial-card group p-0 overflow-hidden flex flex-col h-full transition-all duration-300 hover:border-[var(--primary-gold-border)]">
                    <div className="relative w-full aspect-[3/4] bg-[var(--bg-surface-elevated)] overflow-hidden border-b border-[var(--border-subtle)]">
                      <Image 
                        src={play.imageUrl || '/default-cover.svg'} 
                        alt={`${play.title} Afişi`} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      {play.year && (
                        <div className="absolute top-4 left-4 bg-[var(--bg-dark)]/85 backdrop-blur-md px-3 py-1 rounded text-[11px] font-bold text-[var(--primary-gold)] tracking-widest border border-[var(--border-subtle)] uppercase">
                          {play.year}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
                      <div>
                        <h2 className="serif-font text-2xl md:text-3xl text-[var(--text-main)] mb-3 leading-snug group-hover:text-[var(--primary-gold)] transition-colors">
                          {play.title}
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm font-light leading-relaxed line-clamp-3 mb-6">
                          {play.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between mt-auto">
                        <span className="text-xs text-[var(--text-dim)] font-mono uppercase tracking-wider">FSM Tiyatro</span>
                        <Link 
                          href={`/plays/${play.id}`} 
                          className="text-xs font-bold text-[var(--primary-gold)] uppercase tracking-wider hover:underline flex items-center gap-1.5"
                        >
                          Detaylar & Afiş →
                        </Link>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              ))
            )}
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
