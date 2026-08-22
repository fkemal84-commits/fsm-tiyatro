import { Metadata } from 'next';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Kulübe Katılın | FSM Tiyatro',
  description: 'FSM Tiyatro yeni sezon seçmeleri, 12 farklı sanat ve teknik departman başvuru rehberi.',
};

export default function KatilPage() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  const departments = [
    {
      title: "1. Oyunculuk & Sahne Performansı",
      icon: "happy-outline",
      tag: "Sahne Önü",
      desc: "Karakter çözümlemesi, beden dili, ses/nefes kullanımı, tirad çalışmaları ve sahneleme pratikleri. Sezon oyunlarında rol alma fırsatı."
    },
    {
      title: "2. Reji & Yönetmenlik",
      icon: "film-outline",
      tag: "Yaratıcı Reji",
      desc: "Metni sahneye aktarma, reji vizyonu geliştirme, sahne mizansenleri tasarlama ve oyuncu yönetimi süreçleri."
    },
    {
      title: "3. Dramaturgi & Metin Analizi",
      icon: "book-outline",
      tag: "Kuram & Metin",
      desc: "Tiyatro tarihi araştırmaları, oyun metinlerinin alt metin ve bağlam analizleri, akademik yayın ve bildiri üretimi."
    },
    {
      title: "4. Işık Tasarımı & Işık Masası",
      icon: "bulb-outline",
      tag: "Sahne Teknolojisi",
      desc: "Sahne ışık planlarının çizimi, renk ve açı psikolojisi, oyun boyunca ışık mikseri kumandası ve atmosfer inşası."
    },
    {
      title: "5. Ses & Sahne Müziği Tasarımı",
      icon: "musical-notes-outline",
      tag: "Akustik & Efekt",
      desc: "Oyun müziklerinin bestelenmesi/seçimi, foley ses efektleri tasarımı, mikrofon ve salon ses mikseri yönetimi."
    },
    {
      title: "6. Dekor & Sahne Mekanı Tasarımı",
      icon: "construct-outline",
      tag: "Mekan & Mimari",
      desc: "Sahne eskizleri çizimi, modüler dekor üretimi, ahşap/metal sahne konstrüksiyonu ve mekan yerleşimi."
    },
    {
      title: "7. Kostüm & Aksesuar Tasarımı",
      icon: "shirt-outline",
      tag: "Dönem & Stil",
      desc: "Karakterlerin dönemine uygun kostüm seçimi, dikiş/uyarlama çalışmaları, sahne aksesuarları temini ve bakımı."
    },
    {
      title: "8. Sahne Yönetimi & Kondüvit",
      icon: "hourglass-outline",
      tag: "Sahne Arkası",
      desc: "Oyun akışının saniye saniye yönetimi, oyuncu sahne giriş-çıkış takibi, perde ve dekor değişim koordinasyonu."
    },
    {
      title: "9. Fotoğraf & Video Belgeseli",
      icon: "camera-outline",
      tag: "Görsel Medya",
      desc: "Prova günlüklerinin belgelenmesi, profesyonel temsil fotoğrafçılığı, tanıtım fragmanları ve sahne kayıtları."
    },
    {
      title: "10. Grafik Tasarım & Afiş Sanatı",
      icon: "color-palette-outline",
      tag: "Görsel İletişim",
      desc: "Oyun afişleri, tiyatro broşürleri, sosyal medya görsel kimliği ve dijital bilet tasarımları."
    },
    {
      title: "11. Sosyal Medya & Basın İletişimi",
      icon: "megaphone-outline",
      tag: "İletişim & Tanıtım",
      desc: "Kulüp etkinlik duyuruları, basın bültenleri yazımı, dijital içerik stratejisi ve tiyatro topluluğu yönetimi."
    },
    {
      title: "12. Gişe & Salon / Seyirci Yönetimi",
      icon: "ticket-outline",
      tag: "Operasyon",
      desc: "Dijital biletleme sistemi kontrolü, fuaye karşılama, seyirci salon yerleşimi ve temsil günü operasyonları."
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Kulübe Katıl', url: `${baseUrl}/katil` }
        ]} 
      />

      {/* Header */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-16">
        <div className="max-w-3xl">
          <span className="editorial-tag text-[var(--primary-gold)] block mb-2">SEÇMELER & EKİP ALIMLARI</span>
          <h1 className="serif-font text-4xl sm:text-5xl md:text-6xl text-[var(--text-main)] mb-6 leading-tight">
            "Sahnemizde Sana da Bir Rol Var."
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-muted)] font-light leading-relaxed">
            FSM Tiyatro, tiyatronun tüm disiplinlerini yaşayarak öğreten bir üniversite okuludur. Oyunculuktan ışık tasarımına, dramaturjiden kostüme kadar 12 farklı alanda aramıza katılabilirsiniz. Önceden tiyatro deneyiminiz olması gerekmez.
          </p>
        </div>
      </div>

      {/* 12 DEPARTMAN MATRİSİ */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-16">
        <h2 className="serif-font text-2xl sm:text-3xl text-[var(--text-main)] mb-8 border-b border-[var(--border-subtle)] pb-4">
          Faaliyet Gösterebileceğiniz 12 Alan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((d, idx) => (
            <div key={idx} className="editorial-card p-6 bg-[var(--bg-surface)] flex flex-col justify-between hover:border-[var(--primary-gold-border)] transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--primary-gold-dim)] text-[var(--primary-gold)] flex items-center justify-center text-xl border border-[var(--primary-gold-border)]">
                    <ion-icon name={d.icon}></ion-icon>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--primary-gold)] uppercase font-mono bg-[var(--primary-gold-dim)] px-2 py-0.5 rounded border border-[var(--primary-gold-border)]">
                    {d.tag}
                  </span>
                </div>
                <h3 className="serif-font text-lg text-[var(--text-main)] mb-2 font-bold">{d.title}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KATILIM SÜRECİ & BAŞVURU REHBERİ */}
      <div className="max-w-[1380px] mx-auto px-[5%]">
        <div className="editorial-card p-8 md:p-12 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-8">
          <div>
            <span className="editorial-tag text-[var(--primary-gold)] block mb-2">NASIL ÇALIŞIYOR?</span>
            <h2 className="serif-font text-3xl text-[var(--text-main)] mb-4">Katılım & Seçme Aşamaları</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
              <span className="text-2xl font-serif text-[var(--primary-gold)] font-bold mb-2 block">01</span>
              <h4 className="font-bold text-sm text-[var(--text-main)] mb-2">Ön Kayıt & Başvuru</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Sitemiz üzerinden veya seçme döneminde açılan form üzerinden bilgilerinizi ve ilgilendiğiniz alanları belirtin.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
              <span className="text-2xl font-serif text-[var(--primary-gold)] font-bold mb-2 block">02</span>
              <h4 className="font-bold text-sm text-[var(--text-main)] mb-2">Tanışma & Seçme Atölyesi</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Sahne enerjinizi, motivasyonunuzu ve kolektif uyumunuzu görmek için düzenlediğimiz keyifli tanışma atölyesine katılın.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
              <span className="text-2xl font-serif text-[var(--primary-gold)] font-bold mb-2 block">03</span>
              <h4 className="font-bold text-sm text-[var(--text-main)] mb-2">Ekibe Dahil Olma & Provalar</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                İlgilendiğiniz departmanda veya oyun kadrosunda provalara ve eğitim atölyelerine başlayın.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--text-main)] font-bold">Öğrenci Portalımızdan Hemen Kayıt Olabilirsiniz</p>
              <p className="text-[11px] text-[var(--text-dim)]">@stu.fsm.edu.tr uzantılı okul e-postanızla anında üye olabilirsiniz.</p>
            </div>
            <Link href="/register" className="btn btn-primary text-xs tracking-wider px-8 py-3">
              Öğrenci Kaydı Oluştur
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
