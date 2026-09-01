import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Etkinlikler & Atölyeler | FSM Tiyatro',
  description: 'FSM Tiyatro atölyeleri, söyleşileri, okuma tiyatrosu buluşmaları ve prova takvimi.',
};

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EventTicketButton from '@/components/EventTicketButton';

export default async function EtkinliklerPage() {
  let events: any[] = [];
  const userReservationsMap: Record<string, { id: string; ticketCode: string }> = {};

  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.email;

  try {
    const snap = await adminDb.collection('events').orderBy('createdAt', 'desc').get();
    events = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .filter(ev => ev.visibility === 'PUBLIC' || (!ev.visibility && ev.type !== 'PROVA'))
      .map(ev => ({
        id: ev.id,
        title: ev.title,
        type: ev.type,
        date: ev.date,
        time: ev.time,
        location: ev.location,
        description: ev.description,
        isTicketed: ev.isTicketed,
        ticketQuota: ev.ticketQuota,
        reservedCount: ev.reservedCount
      }));

    // Eğer kullanıcı giriş yapmışsa bu etkinlikler için aktif bilet rezervasyonlarını çek
    if (isLoggedIn && session?.user?.email) {
      const userSnap = await adminDb.collection('users').where('email', '==', session.user.email).limit(1).get();
      if (!userSnap.empty) {
        const uid = userSnap.docs[0].id;
        const resSnap = await adminDb.collection('eventReservations')
          .where('userId', '==', uid)
          .where('status', '==', 'ACTIVE')
          .get();

        resSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.eventId) {
            userReservationsMap[data.eventId] = {
              id: doc.id,
              ticketCode: data.ticketCode
            };
          }
        });
      }
    }
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
          Atölye çalışmalarımız, tiyatro ve sinema buluşmaları, özel biletli etkinlikler ve prova takvimi.
        </p>
      </div>

      <div className="max-w-[1380px] mx-auto px-[5%]">
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {events.map((e) => (
              <div key={e.id} className="editorial-card p-5 sm:p-6 bg-[var(--bg-surface)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-3 flex-wrap gap-2">
                    <span className="text-[10px] font-bold text-[var(--primary-gold)] uppercase font-mono bg-[var(--primary-gold-dim)] px-2 py-0.5 rounded border border-[var(--primary-gold-border)]">
                      {e.type || 'Etkinlik'}
                    </span>
                    {e.isTicketed && (
                      <span className="text-[10px] font-black tracking-wider uppercase text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                        🎟️ BİLETLİ ETKİNLİK
                      </span>
                    )}
                  </div>
                  <h3 className="serif-font text-xl text-[var(--text-main)] mb-2 leading-snug">{e.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6 font-light">{e.description}</p>
                </div>
                
                <div>
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

                  {/* Biletli Etkinlik Rezervasyon Butonu */}
                  {e.isTicketed && (
                    <EventTicketButton 
                      eventId={e.id}
                      eventTitle={e.title}
                      isTicketed={e.isTicketed}
                      ticketQuota={e.ticketQuota || 0}
                      reservedCount={e.reservedCount || 0}
                      isLoggedIn={isLoggedIn}
                      initialReservation={userReservationsMap[e.id] || null}
                    />
                  )}
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
