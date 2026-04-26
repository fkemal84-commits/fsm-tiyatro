'use client';

import { useState } from 'react';
import { addTicket } from '@/app/actions';

export default function TicketManagementPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData(e.currentTarget);
    try {
      const res = await addTicket(formData);
      if (res.error) {
        setMessage({ type: 'error', text: res.error });
      } else if (res.success) {
        setMessage({ type: 'success', text: 'Bilet başarıyla oluşturuldu ve sisteme eklendi!' });
        (e.target as HTMLFormElement).reset();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Beklenmeyen bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Gişe & Bilet Yönetimi</h1>
          <p className="text-white/40 mt-1">Sistemden elden sattığınız biletleri isimlere tanımlayın.</p>
        </div>
        <a href="/tanerabi/tickets/scan" className="btn btn-primary bg-green-500 hover:bg-green-600 border-none flex gap-2">
          <ion-icon name="scan-outline"></ion-icon> Kapı Kontrol (QR Tarayıcı)
        </a>
      </div>

      <div className="glass-card p-6 border-white/10 max-w-2xl bg-white/[0.01]">
        <h2 className="text-xl font-bold text-[var(--primary-gold)] mb-6 flex gap-2 items-center">
          <ion-icon name="ticket-outline"></ion-icon> Yeni Bilet Tanımla
        </h2>

        {message.text && (
          <div className={`p-4 rounded-xl text-sm font-bold mb-6 ${
            message.type === 'error' 
              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
              : 'bg-green-500/10 text-green-400 border border-green-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase mb-2">İSİM (Seyirci)</label>
              <input 
                name="name" 
                type="text" 
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary-gold)] placeholder:text-white/20"
                placeholder="Örn: Ahmet"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase mb-2">SOYİSİM</label>
              <input 
                name="surname" 
                type="text" 
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary-gold)] placeholder:text-white/20"
                placeholder="Örn: Yılmaz"
              />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-white/50 uppercase mb-2">TELEFON / ÖĞRENCİ NO</label>
             <input 
                name="identifier" 
                type="text" 
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary-gold)] placeholder:text-white/20"
                placeholder="İleride doğrulama ihtimaline karşı"
             />
          </div>

          <button 
             type="submit" 
             disabled={loading}
             className="w-full bg-[var(--primary-gold)] text-black font-black py-4 rounded-xl transition-all hover:brightness-110 disabled:opacity-50"
          >
            {loading ? 'Oluşturuluyor...' : 'SİSTEME KAYDET VE BİLET OLUŞTUR'}
          </button>
        </form>
      </div>
    </div>
  );
}
