import Image from 'next/image';
import Link from 'next/link';

export default function Footer({ showTicketQuery = true }: { showTicketQuery?: boolean }) {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] mt-20 text-[var(--text-muted)] text-sm">
      <div className="max-w-[1380px] mx-auto px-[5%] py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10 pb-8 border-b border-[var(--border-subtle)]">

          {/* Kulüp Künyesi */}
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 overflow-hidden rounded-full border border-[var(--primary-gold)]">
                <Image
                  src="/brand-logo-v1.jpg"
                  alt="FSM Tiyatro Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="serif-font text-xl text-[var(--text-main)] font-bold">
                FSM <span className="text-[var(--primary-gold)]">TİYATRO</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-light leading-relaxed">
              Fatih Sultan Mehmet Vakıf Üniversitesi Öğrenci Sinema ve Tiyatro Kulübü. Haliç Yerleşkesi &bull; Beyoğlu / İstanbul
            </p>
          </div>

          {/* Sade Bağlantılar */}
          <div className="flex items-center gap-6 flex-wrap text-xs font-medium">
            <Link href="/oyunlar" className="hover:text-[var(--primary-gold)] transition-colors">Oyunlar</Link>
            <Link href="/etkinlikler" className="hover:text-[var(--primary-gold)] transition-colors">Etkinlikler</Link>
            <Link href="/kulis" className="hover:text-[var(--primary-gold)] transition-colors">Kulis</Link>
            <Link href="/kulup" className="hover:text-[var(--primary-gold)] transition-colors">Kulüp & Ekip</Link>
            <Link href="/katil" className="text-[var(--primary-gold)] font-bold hover:underline">Kulübe Katıl</Link>
            {showTicketQuery && (
              <Link href="/biletimi-bul" className="text-[var(--primary-gold)] font-bold hover:underline">🎟️ Biletimi Bul</Link>
            )}
          </div>

        </div>

        {/* Alt Satır */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-dim)]">
          <p>&copy; {new Date().getFullYear()} FSM Tiyatro Kulübü. Provalardan sahneye.</p>
          <a href="mailto:tiyatro@fsm.edu.tr" className="hover:text-[var(--primary-gold)] transition-colors">
            tiyatro@fsm.edu.tr
          </a>
        </div>
      </div>
    </footer>
  );
}
