'use client';

import { useState } from 'react';
import { findTicket } from '@/app/actions';
import TicketQR from '@/components/TicketQR';

export default function BiletimiBulPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTicket(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await findTicket(formData);
      if (res.error) {
        setError(res.error);
      } else if (res.success && res.ticket) {
        setTicket(res.ticket);
      }
    } catch (err: any) {
      setError("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-20 relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary-gold)]/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
      
      <div className="max-w-xl mx-auto px-6 relative z-10">
        <div className="text-center mb-10">
           <h1 className="serif-font text-4xl md:text-5xl mb-4 text-white">Biletimi Bul</h1>
           <p className="text-white/50 text-sm md:text-base">Adınızı ve soyadınızı girerek biletinize ait QR kodu görüntüleyebilirsiniz. Lütfen kapı girişinde bu ekranı görevliye gösterin.</p>
        </div>

        {!ticket ? (
          <div className="glass-card p-6 md:p-10 shadow-2xl animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-100 p-4 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2 ml-1">İSİM</label>
                  <input 
                    name="name" 
                    required 
                    type="text" 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[var(--primary-gold)] transition-colors placeholder:text-white/20"
                    placeholder="Adınız"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2 ml-1">SOYİSİM</label>
                  <input 
                    name="surname" 
                    required 
                    type="text" 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[var(--primary-gold)] transition-colors placeholder:text-white/20"
                    placeholder="Soyadınız"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[var(--primary-gold)] hover:bg-[#b8962e] text-black font-black text-lg py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Aranıyor...' : (
                  <>
                     <ion-icon name="qr-code-outline"></ion-icon>
                     BİLEMİ GÖSTER
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            <button 
               onClick={() => setTicket(null)}
               className="text-white/40 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors mx-auto"
            >
              <ion-icon name="arrow-back-outline"></ion-icon> Geri Dön
            </button>
            <TicketQR ticket={ticket} />
          </div>
        )}
      </div>
    </main>
  );
}
