'use client';

import { useState, useEffect } from 'react';
import { findTicket, getOccupiedSeats } from '@/app/actions';
import TicketQR from '@/components/TicketQR';
import SeatMap, { OccupiedSeat } from '@/components/SeatMap';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default function BiletimiBulPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<OccupiedSeat[]>([]);
  const [isTicketQueryActive, setIsTicketQueryActive] = useState<boolean>(true);
  const [configLoaded, setConfigLoaded] = useState<boolean>(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "site_config"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.isTicketQueryActive === 'boolean') {
          setIsTicketQueryActive(data.isTicketQueryActive);
        }
      }
      setConfigLoaded(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isTicketQueryActive) return;
    const loadSeats = async () => {
      const res = await getOccupiedSeats();
      if (res.success && res.seats) {
        setOccupiedSeats(res.seats);
      }
    };
    loadSeats();
  }, [isTicketQueryActive]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTickets([]);

    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await findTicket(formData);
      if (res.error) {
        setError(res.error);
      } else if (res.success && res.tickets) {
        setTickets(res.tickets);
      }
    } catch (err: any) {
      setError("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Gişe Kapalı Ekranı
  if (configLoaded && !isTicketQueryActive) {
    return (
      <main className="min-h-screen pt-36 pb-24 bg-[var(--bg-dark)] flex items-center justify-center">
        <div className="max-w-xl mx-auto px-6 text-center">
          <div className="editorial-card p-10 bg-[var(--bg-surface)] space-y-6">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-medium)] flex items-center justify-center mx-auto text-3xl text-[var(--primary-gold)]">
              <ion-icon name="ticket-outline"></ion-icon>
            </div>

            <span className="editorial-tag text-[var(--primary-gold)] block">DİJİTAL GİŞE BİLGİSİ</span>
            <h1 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)]">Gişe Şu Anda Kapalıdır</h1>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              Şu anda aktif olarak sahnelenen bir oyun bilet satışımız veya aktif seyirci giriş kontrolümüz bulunmamaktadır. Sezon oyunları ve etkinlik günlerinde bilet sorgulama ekranı yeniden aktifleşecektir.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link href="/plays" className="btn btn-primary text-xs font-bold tracking-wider">
                Sezon Repertuvarını İncele
              </Link>
              <Link href="/" className="btn btn-outline text-xs tracking-wider">
                Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16 sm:pt-36 sm:pb-24 bg-[var(--bg-dark)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Başlık Alanı */}
        <div className="text-center mb-8 sm:mb-12 max-w-xl mx-auto">
          <span className="editorial-tag text-[var(--primary-gold)] block mb-2 text-[10px]">DİJİTAL GİŞE & KONTROL</span>
          <h1 className="serif-font text-2xl sm:text-4xl md:text-5xl text-[var(--text-main)] mb-3 break-words">Biletimi Sorgula</h1>
          <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed">
            Ad ve soyadınızı girerek biletinize ait QR kodu ve koltuk bilginizi görüntüleyebilirsiniz. Lütfen salona girişte bu ekranı görevliye gösterin.
          </p>
        </div>

        {tickets.length === 0 ? (
          <div className="space-y-10 sm:space-y-16">
            {/* Sorgu Formu */}
            <div className="editorial-card p-5 sm:p-8 max-w-lg mx-auto bg-[var(--bg-surface)]">
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 p-3.5 rounded text-xs font-medium">
                    {error}
                  </div>
                )}
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1.5">
                      ADINIZ
                    </label>
                    <input 
                      name="name" 
                      required 
                      type="text" 
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-medium)] rounded-lg px-3.5 py-3 text-[var(--text-main)] focus:outline-none focus:border-[var(--primary-gold)] transition-colors text-sm placeholder:text-[var(--text-dim)]"
                      placeholder="Örn: Ahmet"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1.5">
                      SOYADINIZ
                    </label>
                    <input 
                      name="surname" 
                      required 
                      type="text" 
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-medium)] rounded-lg px-3.5 py-3 text-[var(--text-main)] focus:outline-none focus:border-[var(--primary-gold)] transition-colors text-sm placeholder:text-[var(--text-dim)]"
                      placeholder="Örn: Yılmaz"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full btn btn-primary py-3.5 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Sorgulanıyor...' : (
                    <>
                      <ion-icon name="qr-code-outline" style={{ fontSize: '1.1rem' }}></ion-icon>
                      BİLETİMİ GÖSTER
                    </>
                  )}
                </button>
              </form>
            </div>
            
            {/* Salon Yerleşim Haritası */}
            <div className="editorial-card p-4 sm:p-6 md:p-8 bg-[var(--bg-surface)] overflow-hidden">
              <div className="text-center mb-6">
                <span className="editorial-tag text-[var(--text-dim)] block text-[10px] mb-1">SALON DÜZENİ</span>
                <h2 className="serif-font text-xl sm:text-2xl text-[var(--text-main)]">Koltuk Yerleşim Durumu</h2>
              </div>
              <SeatMap occupiedSeats={occupiedSeats} readonly />
            </div>
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto">
            <button 
              onClick={() => setTickets([])}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors mx-auto"
            >
              <ion-icon name="arrow-back-outline"></ion-icon> Yeni Sorgu Yap
            </button>
            <div className="text-center mb-8">
              <h2 className="serif-font text-3xl text-[var(--text-main)]">Adınıza Kayıtlı Biletler</h2>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Toplam <span className="text-[var(--primary-gold)] font-bold">{tickets.length}</span> bilet bulundu. Girişte ilgili QR kodu görevliye okutunuz.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {tickets.map(ticket => (
                <TicketQR key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
