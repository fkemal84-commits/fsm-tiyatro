import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Etkinlikler & Atölyeler | FSM Tiyatro',
  description: 'FSM Tiyatro atölyeleri, söyleşileri, okuma tiyatrosu buluşmaları ve prova takvimi.',
};

export default async function EtkinliklerPage() {
  let events: any[] = [];

  try {
    const snap = await adminDb.collection('events').orderBy('createdAt', 'desc').get();
    events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[ETKINLIKLER] Veri çekme hatası:", error);
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-24 pb-16 sm:pt-32 sm:pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Etkinlikler', url: `${baseUrl}/etkinlikler` }
        ]} 
      />

      {/* Başlık */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-8 sm:mb-12">
        <span className="editorial-tag text-[var(--primary-gold)] block mb-2 text-[10px]">AJANDA & BULUŞMALAR</span>
        <h1 className="serif-font text-3xl sm:text-5xl md:text-6xl text-[var(--text-main)] mb-3 break-words">Etkinlikler</h1>
        <p className="text-xs sm:text-sm md:text-base text-[var(--text-muted)] font-light max-w-xl">
          Atölye çalışmalarımız, tiyatro söyleşilerimiz, okuma provaları ve kulüp buluşmalarımız.
        </p>
      </div>

      <div className="max-w-[1380px] mx-auto px-[5%]">
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {events.map((e) => (
              <div key={e.id} className="editorial-card p-5 sm:p-6 bg-[var(--bg-surface)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-[10px] font-bold text-[var(--primary-gold)] uppercase font-mono bg-[var(--primary-gold-dim)] px-2 py-0.5 rounded border border-[var(--primary-gold-border)]">
                      {e.type || 'Etkinlik'}
                    </span>
                  </div>
                  <h3 className="serif-font text-xl text-[var(--text-main)] mb-2 leading-snug">{e.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6 font-light">{e.description}</p>
                </div>
                <div className="pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-dim)] space-y-1">
                  <div className="flex items-center gap-1.5 text-[var(--text-main)] font-semibold">
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
        ) : (
          <div className="editorial-card p-12 text-center max-w-xl mx-auto bg-[var(--bg-surface)]">
            <span className="text-3xl mb-2 block">🗓️</span>
            <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2">Yaklaşan Etkinlik Bulunmuyor</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
              Yeni atölye ve prova tarihleri açıklandığında burada listelenecektir.
            </p>
            <Link href="/oyunlar" className="btn btn-outline text-xs">Oyunlarımıza Göz Atın</Link>
          </div>
        )}
      </div>
    </div>
  );
}
