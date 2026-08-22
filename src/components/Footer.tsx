import Image from 'next/image';
import Link from 'next/link';

export default function Footer({ showTicketQuery = true }: { showTicketQuery?: boolean }) {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] mt-24 text-[var(--text-muted)] text-sm">
      <div className="max-w-[1380px] mx-auto px-[5%] py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">

          {/* Kulüp Künyesi */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 overflow-hidden rounded-full border border-[var(--primary-gold)]">
                <Image
                  src="/brand-logo-v1.jpg"
                  alt="FSM Tiyatro Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="serif-font text-2xl tracking-wider text-[var(--text-main)] font-bold">
                FSM <span className="text-[var(--primary-gold)]">TİYATRO</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] max-w-md font-light leading-relaxed">
              Fatih Sultan Mehmet Vakıf Üniversitesi Sağlık, Kültür ve Spor Daire Başkanlığı bünyesinde faaliyet gösteren resmi Sinema ve Tiyatro Topluluğudur. Sahne sanatları üretimi, kurumsal dijital arşiv ve tiyatro araştırmaları merkezi.
            </p>
            <p className="text-[11px] text-[var(--text-dim)] font-mono">
              Haliç Yerleşkesi &bull; Beyoğlu / İstanbul
            </p>
          </div>

          {/* Sahne & Arşiv */}
          <div className="space-y-3">
            <span className="editorial-tag text-[var(--text-main)] block text-xs">SAHNE & ARŞİV</span>
            <ul className="space-y-2 text-xs">
              <li><Link href="/sahne" className="hover:text-[var(--primary-gold)] transition-colors">Sezon Repertuvarı</Link></li>
              <li><Link href="/arsiv" className="hover:text-[var(--primary-gold)] transition-colors">Dijital Prodüksiyon Arşivi</Link></li>
              {showTicketQuery && (
                <li><Link href="/biletimi-bul" className="text-[var(--primary-gold)] hover:underline flex items-center gap-1 font-bold">🎫 Biletimi Sorgula</Link></li>
              )}
              <li><Link href="/medya" className="hover:text-[var(--primary-gold)] transition-colors">Medya & Fotoğraf Galerisi</Link></li>
            </ul>
          </div>

          {/* Topluluk & Üretim */}
          <div className="space-y-3">
            <span className="editorial-tag text-[var(--text-main)] block text-xs">TOPLULUK & YAYIN</span>
            <ul className="space-y-2 text-xs">
              <li><Link href="/kulup" className="hover:text-[var(--primary-gold)] transition-colors">Manifestomuz & Tarihçe</Link></li>
              <li><Link href="/kulup/ekip" className="hover:text-[var(--primary-gold)] transition-colors">Topluluk & Kadro Rehberi</Link></li>
              <li><Link href="/kulup/alumni" className="hover:text-[var(--primary-gold)] transition-colors">Mezunlar / Alumni Ağı</Link></li>
              <li><Link href="/uretim" className="hover:text-[var(--primary-gold)] transition-colors">Atölyeler & Etkinlikler</Link></li>
              <li><Link href="/yayin" className="hover:text-[var(--primary-gold)] transition-colors">Yayın & Akademik Bildiriler</Link></li>
            </ul>
          </div>

          {/* Katılım & Destek */}
          <div className="space-y-3">
            <span className="editorial-tag text-[var(--primary-gold)] block text-xs">KULÜBE KATIL & DESTEK</span>
            <ul className="space-y-2 text-xs">
              <li><Link href="/katil" className="hover:text-[var(--primary-gold)] transition-colors font-bold text-[var(--text-main)]">✨ 12 Departman / Seçmeler</Link></li>
              <li><Link href="/destek" className="hover:text-[var(--primary-gold)] transition-colors">🤝 Sponsorluk & Destek</Link></li>
              <li><Link href="/members" className="hover:text-[var(--primary-gold)] transition-colors">🔐 Üye Panosu (Kulis)</Link></li>
              <li><Link href="/login" className="hover:text-[var(--primary-gold)] transition-colors">Üye Girişi / Kayıt</Link></li>
            </ul>
          </div>

        </div>

        {/* Alt Telif ve Beyan */}
        <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-dim)]">
          <p>&copy; {new Date().getFullYear()} FSM Tiyatro Topluluğu. Tüm hakları saklıdır.</p>
          <p className="font-mono text-[11px]">Sanatın, İnsanın ve Sahne Hafızasının Buluşma Noktası</p>
        </div>
      </div>
    </footer>
  );
}
