'use client';

import QRCode from 'react-qr-code';

export default function TicketQR({ ticket }: { ticket: any }) {
  if (!ticket) return null;

  return (
    <div className="flex flex-col items-center justify-center p-8 glass-card border-[var(--primary-gold)]/30 rounded-3xl relative overflow-hidden animate-fade-in shadow-2xl max-w-sm mx-auto">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[var(--primary-gold)] to-transparent opacity-50"></div>
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-[var(--primary-gold)] rounded-full blur-[50px] opacity-20"></div>
      
      <h3 className="serif-font text-2xl mb-2 text-white tracking-widest uppercase">FSM TİYATRO</h3>
      <div className="text-[10px] text-[var(--primary-gold)] font-bold tracking-[3px] mb-8">GİRİŞ BİLETİ</div>

      <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] mb-6 transition-transform hover:scale-105">
        <QRCode 
          value={ticket.id} 
          size={200}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H" 
        />
      </div>

      <div className="text-center w-full">
        <p className="text-xl font-black text-white uppercase tracking-wider mb-1">
          {ticket.name} {ticket.surname}
        </p>

        {(ticket.row || ticket.seatNumber) && (
          <div className="mt-3 flex justify-center gap-4">
             {ticket.row && <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg"><span className="text-[10px] text-white/50 block leading-tight">SIRA</span><span className="font-bold text-[var(--primary-gold)] leading-tight">{ticket.row}</span></div>}
             {ticket.seatNumber && <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg"><span className="text-[10px] text-white/50 block leading-tight">KOLTUK</span><span className="font-bold text-[var(--primary-gold)] leading-tight">{ticket.seatNumber}</span></div>}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
          <span className="text-white/40 uppercase tracking-wider font-bold">Durum</span>
          {ticket.status === 'VALID' ? (
             <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-black tracking-widest border border-green-500/30">GEÇERLİ</span>
          ) : (
             <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-black tracking-widest border border-red-500/30">KULLANILDI</span>
          )}
        </div>
      </div>
    </div>
  );
}
