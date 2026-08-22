import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Üretim & Atölyeler | FSM Tiyatro',
  description: 'FSM Tiyatro atölye çalışmaları, tiyatro festivalleri, söyleşiler, okuma tiyatrosu ve özel projeler.',
};

export default async function UretimPage() {
  let events: any[] = [];

  try {
    const snap = await adminDb.collection('events').orderBy('createdAt', 'desc').get();
    events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[URETIM] Veri çekme hatası:", error);
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  const defaultWorkshops = [
    {
      title: "Beden Dili & Sahne Hareketi Atölyesi",
      type: "Atölye",
      desc: "Oyuncunun sahnede alan hakimiyeti, postür, denge ve fiziksel ifade olanaklarını keşfettiğimiz pratik çalışma.",
      icon: "walk-outline",
      period: "Haftalık / Düzenli"
    },
    {
      title: "Diksiyon, Fonetik & Artikülasyon",
      type: "Eğitim",
      desc: "Doğru nefes, diyafram kullanımı, ses tınısı ve Türkçe fonetik kurallarına uygun tirad çalışmaları.",
      icon: "mic-outline",
      period: "Sezon Boyunca"
    },
    {
      title: "Kolektif Metin & Dramaturgi Okumaları",
      type: "Seminer",
      desc: "Dünya tiyatro klasiklerinin alt metinlerini, dönem koşullarını ve felsefi arka planını incelediğimiz okuma çemberi.",
      icon: "book-outline",
      period: "Aylık Buluşmalar"
    },
    {
      title: "Kamera Önü & Kısa Film Pratikleri",
      type: "Proje",
      desc: "Sinema ve kamera disipliniyle oyuncunun mikro mimik ve sahne ölçeği çalışmalarını birleştiren özel atölye.",
      icon: "videocam-outline",
      period: "Bahar Dönemi"
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Üretim & Atölyeler', url: `${baseUrl}/uretim` }
        ]} 
      />

      {/* Header */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-16">
        <div className="max-w-3xl">
          <span className="editorial-tag text-[var(--primary-gold)] block mb-2">SANATSAL GELİŞİM & ATÖLYELER</span>
          <h1 className="serif-font text-4xl sm:text-5xl md:text-6xl text-[var(--text-main)] mb-4">Üretim & Atölye Programı</h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] font-light leading-relaxed">
            Oyunculuk eğitimlerinden dramaturgi seminerlerine, festival katılımlarından kamera önü pratiklerine uzanan çok yönlü üretim alanlarımız.
          </p>
        </div>
      </div>

      {/* TEMEL ATÖLYE PROGRAMLARI */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-16">
        <h2 className="serif-font text-2xl sm:text-3xl text-[var(--text-main)] mb-8 border-b border-[var(--border-subtle)] pb-4">
          Düzenli Kulüp Atölyeleri
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {defaultWorkshops.map((w, i) => (
            <div key={i} className="editorial-card p-6 bg-[var(--bg-surface)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--primary-gold-dim)] text-[var(--primary-gold)] flex items-center justify-center text-xl border border-[var(--primary-gold-border)]">
                    <ion-icon name={w.icon}></ion-icon>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--primary-gold)] uppercase font-mono">{w.type}</span>
                </div>
                <h3 className="serif-font text-lg text-[var(--text-main)] mb-2 leading-snug">{w.title}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">{w.desc}</p>
              </div>
              <div className="pt-4 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-dim)] font-mono">
                📅 {w.period}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GÜNCEL ETKİNLİK & FESTİVAL TAKVİMİ */}
      <div className="max-w-[1380px] mx-auto px-[5%]">
        <h2 className="serif-font text-2xl sm:text-3xl text-[var(--text-main)] mb-8 border-b border-[var(--border-subtle)] pb-4">
          Etkinlik & Festival Ajandası ({events.length})
        </h2>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e) => (
              <div key={e.id} className="editorial-card p-6 bg-[var(--bg-surface)] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[var(--primary-gold)] bg-[var(--primary-gold-dim)] px-2.5 py-1 rounded-full uppercase border border-[var(--primary-gold-border)] inline-block mb-3">
                    {e.type || 'Etkinlik'}
                  </span>
                  <h3 className="serif-font text-xl text-[var(--text-main)] mb-2">{e.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">{e.description}</p>
                </div>
                <div className="pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-dim)] space-y-1.5 font-medium">
                  <div className="flex items-center gap-2 text-[var(--text-main)]">
                    <ion-icon name="calendar-outline"></ion-icon>
                    <span>{e.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ion-icon name="location-outline"></ion-icon>
                    <span>{e.location || 'Haliç Yerleşkesi'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="editorial-card p-12 text-center max-w-2xl mx-auto bg-[var(--bg-surface)]">
            <span className="text-3xl mb-2 block">🗓️</span>
            <h4 className="serif-font text-xl text-[var(--text-main)] mb-1">Yeni Etkinlik Takvimi Açıklanacak</h4>
            <p className="text-xs text-[var(--text-muted)] font-light">
              Yaklaşan tiyatro festivali katılımlarımız ve atölye tarihlerimiz buradan duyurulacaktır.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
