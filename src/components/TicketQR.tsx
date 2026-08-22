'use client';

import QRCode from 'react-qr-code';

export default function TicketQR({ ticket }: { ticket: any }) {
  if (!ticket) return null;

  const isValid = ticket.status === 'VALID';

  return (
    <div className="ticket-stub p-8 max-w-sm mx-auto shadow-2xl animate-fadeIn flex flex-col justify-between">
      {/* Bilet Başlığı / Üst Bölüm */}
      <div className="text-center pb-4 border-b border-[var(--border-subtle)]">
        <span className="editorial-tag text-[var(--primary-gold)] block text-[10px] mb-1">
          FATİH SULTAN MEHMET VAKIF ÜNİVERSİTESİ
        </span>
        <h3 className="serif-font text-2xl text-[var(--text-main)] tracking-widest uppercase">
          FSM TİYATRO
        </h3>
        <span className="text-[9px] text-[var(--text-dim)] uppercase font-mono tracking-[0.2em] block mt-0.5">
          RESMİ GİRİŞ BİLETİ &bull; 2026 SEZONU
        </span>
      </div>

      {/* QR Kod Alanı */}
      <div className="py-6 flex flex-col items-center justify-center">
        <div className="p-3.5 bg-white rounded-lg shadow-md border border-[var(--border-medium)]">
          <QRCode 
            value={ticket.id} 
            size={180}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H" 
          />
        </div>
        <span className="font-mono text-[10px] text-[var(--text-dim)] mt-3 tracking-widest uppercase">
          ID: {ticket.id}
        </span>
      </div>

      {/* Delikli Koparma Çizgisi (Perforation) */}
      <div className="perforated-divider"></div>

      {/* Bilet Sahibi & Koltuk Detayı */}
      <div className="pt-2 text-center space-y-4">
        <div>
          <span className="text-[10px] text-[var(--text-dim)] uppercase font-bold tracking-wider block mb-1">
            SEYİRCİ
          </span>
          <p className="text-xl font-bold text-[var(--text-main)] uppercase tracking-wide">
            {ticket.name} {ticket.surname}
          </p>
        </div>

        {(ticket.row || ticket.seatNumber) && (
          <div className="flex justify-center gap-3">
            {ticket.row && (
              <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-medium)] px-4 py-2 rounded">
                <span className="text-[9px] text-[var(--text-muted)] uppercase block font-bold">SIRA</span>
                <span className="text-lg font-bold text-[var(--primary-gold)] font-mono leading-none">{ticket.row}</span>
              </div>
            )}
            {ticket.seatNumber && (
              <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-medium)] px-4 py-2 rounded">
                <span className="text-[9px] text-[var(--text-muted)] uppercase block font-bold">KOLTUK</span>
                <span className="text-lg font-bold text-[var(--primary-gold)] font-mono leading-none">{ticket.seatNumber}</span>
              </div>
            )}
          </div>
        )}

        {/* Durum Rozeti */}
        <div className="pt-2 flex justify-between items-center text-xs">
          <span className="text-[11px] text-[var(--text-dim)] uppercase font-bold tracking-wider">Durum</span>
          {isValid ? (
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded text-[10px] font-black tracking-widest border border-emerald-500/30 uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> GEÇERLİ
            </span>
          ) : (
            <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1 rounded text-[10px] font-black tracking-widest border border-rose-500/30 uppercase">
              KULLANILDI
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
