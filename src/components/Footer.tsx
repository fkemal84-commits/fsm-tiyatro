import Image from 'next/image';
import Link from 'next/link';

export default function Footer({ showTicketQuery = true }: { showTicketQuery?: boolean }) {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] mt-24 text-[var(--text-muted)] text-sm">
      <div className="max-w-[1380px] mx-auto px-[5%] py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Kulüp Künyesi */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 overflow-hidden rounded-lg border border-[var(--border-medium)]">
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
              Fatih Sultan Mehmet Vakıf Üniversitesi Sağlık, Kültür ve Spor Daire Başkanlığı bünyesinde faaliyet gösteren resmi Sinema ve Tiyatro Kulübüdür.
            </p>
            <p className="text-[11px] text-[var(--text-dim)] font-mono">
              Haliç Yerleşkesi &bull; Beyoğlu / İstanbul
            </p>
          </div>

          {/* Hızlı Bağlantılar */}
          <div className="space-y-3">
            <span className="editorial-tag text-[var(--text-main)] block text-xs">REPERTUVAR & BİLET</span>
            <ul className="space-y-2 text-xs">
              <li><Link href="/plays" className="hover:text-[var(--primary-gold)] transition-colors">Sezon Oyunları</Link></li>
              {showTicketQuery && (
                <li><Link href="/biletimi-bul" className="text-[var(--primary-gold)] hover:underline flex items-center gap-1.5 font-bold">🎫 Biletimi Sorgula</Link></li>
              )}
              <li><Link href="/blog" className="hover:text-[var(--primary-gold)] transition-colors">Kulis Blogu & Yazılar</Link></li>
              <li><Link href="/#manifesto" className="hover:text-[var(--primary-gold)] transition-colors">Sanat Manifestosu</Link></li>
            </ul>
          </div>

          {/* Dijital Portal */}
          <div className="space-y-3">
            <span className="editorial-tag text-[var(--text-main)] block text-xs">SAHNE ARKASI</span>
            <ul className="space-y-2 text-xs">
              <li><Link href="/members" className="hover:text-[var(--primary-gold)] transition-colors">Üye Panosu</Link></li>
              <li><Link href="/members/rehearsals" className="hover:text-[var(--primary-gold)] transition-colors">Prova Takvimi</Link></li>
              <li><Link href="/members/team" className="hover:text-[var(--primary-gold)] transition-colors">Ekip Rehberi</Link></li>
              <li><Link href="/login" className="hover:text-[var(--primary-gold)] transition-colors">Oyuncu & Üye Girişi</Link></li>
            </ul>
          </div>

        </div>

        {/* Alt Telif ve Beyan */}
        <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-dim)]">
          <p>&copy; {new Date().getFullYear()} FSM Tiyatro Topluluğu. Tüm hakları saklıdır.</p>
          <p className="font-mono text-[11px]">Sahnenin ve Gerçeğin Kesişme Noktası</p>
        </div>
      </div>
    </footer>
  );
}
