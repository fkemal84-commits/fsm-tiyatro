import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Manifestomuz & Tarihçe | FSM Tiyatro',
  description: 'Fatih Sultan Mehmet Vakıf Üniversitesi Sinema ve Tiyatro Kulübü vizyonu, sanat ilkeleri, sahne geleneği ve manifestosu.',
};

export default function KulupPage() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Kulüp & Manifesto', url: `${baseUrl}/kulup` }
        ]} 
      />

      {/* Hero */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-16">
        <div className="max-w-3xl">
          <span className="editorial-tag text-[var(--primary-gold)] block mb-3">KULÜP KİMLİĞİ & MANİFESTO</span>
          <h1 className="serif-font text-4xl sm:text-5xl md:text-6xl text-[var(--text-main)] mb-6 leading-tight">
            "Sahnede İnsanı, Perdede Hakikati Aramak."
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-muted)] font-light leading-relaxed">
            FSM Tiyatro, Fatih Sultan Mehmet Vakıf Üniversitesi Sağlık, Kültür ve Spor Daire Başkanlığı çatısı altında; tiyatroyu yalnızca bir sahneleme faaliyeti değil, kolektif bir insan ve düşünce mektebi olarak gören bağımsız bir öğrenci topluluğudur.
          </p>
        </div>
      </div>

      {/* Navigasyon Kartları (Ekip & Alumni) */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/kulup/ekip" className="editorial-card p-8 bg-[var(--bg-surface)] hover:border-[var(--primary-gold-border)] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">🎭</span>
              <span className="text-xs font-bold text-[var(--primary-gold)] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                Kadro Rehberi →
              </span>
            </div>
            <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2">Aktif Topluluk & Kadro</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Yönetmenlerimiz, aktif oyuncularımız, sahne arkası teknisyenlerimiz ve departman sorumlularımız.
            </p>
          </Link>

          <Link href="/kulup/alumni" className="editorial-card p-8 bg-[var(--bg-surface)] hover:border-[var(--primary-gold-border)] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">🎓</span>
              <span className="text-xs font-bold text-[var(--primary-gold)] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                Mezunlar Ağı →
              </span>
            </div>
            <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2">Mezunlar & Alumni Hafızası</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Kulübümüzün kuruluşundan bu yana sahneye emek vermiş, gelenek bırakmış kıymetli mezunlarımız.
            </p>
          </Link>
        </div>
      </div>

      {/* MANİFESTO METNİ */}
      <div className="max-w-[1380px] mx-auto px-[5%]">
        <div className="editorial-card p-8 md:p-14 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-10">
          
          <div>
            <span className="editorial-tag text-[var(--primary-gold)] block mb-2">SANAT İLKELERİMİZ</span>
            <h2 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)] mb-4">Neye İnanıyoruz?</h2>
            <p className="text-base text-[var(--text-muted)] leading-relaxed font-light">
              Bizler sahneye adım attığımızda; metnin lafzını ezberlemekten öte, insanın varoluşsal sancılarını, çelişkilerini, sevincini ve adalet arayışını görünür kılmayı hedefleriz. Muhsin Ertuğrul'un, Haldun Dormen'in ve dünya tiyatro ustalarının izinde; klasik disiplinle çağdaş sahneleme cesaretini harmanlarız.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-[var(--border-subtle)]">
            <div>
              <h4 className="serif-font text-xl text-[var(--text-main)] mb-2">1. Kolektif Emek</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Sahnenin başrolü oyuncu olduğu kadar, ışığı yönlendiren kondüvit ve dekoru çakan emekçidir. Hiyerarşisiz bir sahne yoldaşlığı esastır.
              </p>
            </div>

            <div>
              <h4 className="serif-font text-xl text-[var(--text-main)] mb-2">2. Dramaturgik Derinlik</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Sahnelenecek her oyun, aylar süren metin analizleri, tarihi arka plan araştırmaları ve alt metin çözümlemeleriyle inşa edilir.
              </p>
            </div>

            <div>
              <h4 className="serif-font text-xl text-[var(--text-main)] mb-2">3. Açık Sahne Okulu</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Her fakülteden öğrencinin oyunculuk, reji, ışık, ses veya tasarım alanında kendini geliştirebileceği özgür bir gelişim alanıyız.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-6 bg-[var(--bg-surface-elevated)] p-6 rounded-xl">
            <div>
              <h4 className="font-bold text-sm text-[var(--text-main)]">Sahnemizin Bir Parçası Olmak İster misiniz?</h4>
              <p className="text-xs text-[var(--text-muted)]">Yeni sezon seçmeleri ve departman başvuruları hakkında bilgi alın.</p>
            </div>
            <Link href="/katil" className="btn btn-primary text-xs tracking-wider flex-shrink-0">
              Kulübe Katılın
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
