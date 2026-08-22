import { Metadata } from 'next';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Kulübe Katıl | FSM Tiyatro',
  description: 'FSM Tiyatro öğrenci kulübüne katılın. Oyunculuk, sahne arkası, reji, ışık, ses ve organizasyon.',
};

export default function KatilPage() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  const areas = [
    { title: 'Oyunculuk', desc: 'Karakter çözümlemeleri, beden ve diksiyon pratikleri, sahne performansı.' },
    { title: 'Reji & Yönetmenlik', desc: 'Metin analizi, sahne trafiği ve reji vizyonu geliştirme.' },
    { title: 'Işık & Ses Tasarımı', desc: 'Sahne atmosferi, ışık mikseri ve oyun ses/müzik kumandası.' },
    { title: 'Dekor & Kostüm', desc: 'Mekan tasarımı, sahne dekoru inşası ve dönem kostümleri.' },
    { title: 'Dramaturgi & Metin', desc: 'Tiyatro tarihi araştırmaları, alt metin çözümlemeleri ve yazılar.' },
    { title: 'Medya & Fotoğraf', desc: 'Prova belgeseli, temsil fotoğrafçılığı, video ve afiş tasarımı.' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Katıl', url: `${baseUrl}/katil` }
        ]} 
      />

      <div className="max-w-3xl mx-auto px-6 space-y-12">
        
        {/* Başlık ve Ana Mesaj */}
        <div>
          <span className="editorial-tag text-[var(--primary-gold)] block mb-2">SEÇMELER & KATILIM</span>
          <h1 className="serif-font text-4xl sm:text-5xl text-[var(--text-main)] mb-4 leading-tight">
            Burada Sadece Oyuncular Yok.
          </h1>
          <p className="text-base text-[var(--text-muted)] font-light leading-relaxed">
            FSM Tiyatro'da bir oyunu sıfırdan sahneye taşımak için rejiye, ışığa, sese, dekora, afişe ve sahne arkası koordinasyonuna ihtiyaç duyarız. Önceden tiyatro deneyiminizin olması gerekmez; merakınız ve öğrenme isteğiniz yeterlidir.
          </p>
        </div>

        {/* Çalışma Alanları Listesi */}
        <div className="editorial-card p-8 bg-[var(--bg-surface)]">
          <h2 className="serif-font text-2xl text-[var(--text-main)] mb-6">Neler Yapıyoruz?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {areas.map((a, i) => (
              <div key={i} className="space-y-1">
                <h3 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-gold)]"></span>
                  {a.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-light leading-relaxed pl-3.5">
                  {a.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Nasıl Katılırım? */}
        <div className="editorial-card p-8 bg-[var(--bg-surface)] space-y-6">
          <h2 className="serif-font text-2xl text-[var(--text-main)]">Nasıl Katılırım?</h2>
          
          <div className="space-y-3 text-xs text-[var(--text-muted)] leading-relaxed font-light">
            <p>
              <strong className="text-[var(--text-main)]">1. Öğrenci Kaydı:</strong> Aşağıdaki buton üzerinden üniversite e-postanızla (@stu.fsm.edu.tr) portala kayıt olun.
            </p>
            <p>
              <strong className="text-[var(--text-main)]">2. Tanışma Atölyesi:</strong> Sezon başında veya dönem içindeki tanışma toplantımıza ve atölyelerimize katılın.
            </p>
            <p>
              <strong className="text-[var(--text-main)]">3. Provalar:</strong> İlgilendiğiniz alanda veya oyun kadrosunda provalara başlayın.
            </p>
          </div>

          <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[var(--text-dim)]">Sorularınız için: tiyatro@fsm.edu.tr</span>
            <Link href="/register" className="btn btn-primary text-xs font-bold px-8 py-3 w-full sm:w-auto text-center">
              Öğrenci Kaydı Oluştur
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
