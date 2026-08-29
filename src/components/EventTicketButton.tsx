'use client';

import { useState } from 'react';
import { reserveEventTicket, cancelEventTicketReservation } from '@/app/actions';
import Link from 'next/link';

interface EventTicketButtonProps {
  eventId: string;
  eventTitle: string;
  isTicketed?: boolean;
  ticketQuota?: number;
  reservedCount?: number;
  isLoggedIn: boolean;
  initialReservation?: {
    id: string;
    ticketCode: string;
  } | null;
}

export default function EventTicketButton({
  eventId,
  eventTitle,
  isTicketed = false,
  ticketQuota = 0,
  reservedCount = 0,
  isLoggedIn,
  initialReservation = null
}: EventTicketButtonProps) {
  const [loading, setLoading] = useState(false);
  const [reservation, setReservation] = useState<{ id: string; ticketCode: string } | null>(initialReservation);
  const [currentReservedCount, setCurrentReservedCount] = useState(reservedCount);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isTicketed) {
    return null;
  }

  const remaining = ticketQuota > 0 ? Math.max(0, ticketQuota - currentReservedCount) : null;
  const isFull = ticketQuota > 0 && remaining === 0;

  // 1. Üye girişi yapılmamışsa
  if (!isLoggedIn) {
    return (
      <div className="space-y-2 mt-4">
        <Link 
          href={`/login?callbackUrl=/etkinlikler`}
          className="btn btn-outline w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-[var(--primary-gold-border)] text-[var(--primary-gold)] hover:bg-[var(--primary-gold)] hover:text-black transition-all"
        >
          <ion-icon name="lock-closed-outline"></ion-icon>
          <span>Bilet Ayırt (Üye Girişi Gerekli)</span>
        </Link>
        {ticketQuota > 0 && (
          <div className="flex justify-between items-center text-[10px] text-[var(--text-dim)] px-1">
            <span>Kulüp Üyelerine Özel</span>
            <span>Kalan Kontenjan: <strong className="text-[var(--primary-gold)]">{remaining}</strong> / {ticketQuota}</span>
          </div>
        )}
      </div>
    );
  }

  // 2. Kullanıcının zaten ayrılmış bileti varsa
  if (reservation) {
    const handleCancel = async () => {
      if (!confirm("Bilet rezervasyonunuzu iptal etmek istediğinize emin misiniz? Biletiniz boşa çıkacaktır.")) return;
      setLoading(true);
      setErrorMsg('');

      try {
        const res = await cancelEventTicketReservation(reservation.id);
        if ('error' in res && res.error) {
          setErrorMsg(res.error);
        } else {
          setReservation(null);
          setCurrentReservedCount(prev => Math.max(0, prev - 1));
          setSuccessMsg("Biletiniz iptal edildi.");
          setTimeout(() => setSuccessMsg(''), 4000);
        }
      } catch (err: any) {
        setErrorMsg("İptal işlemi sırasında hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="mt-4 p-3.5 bg-[var(--primary-gold-dim)] border border-[var(--primary-gold-border)] rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--primary-gold)] text-xs font-bold">
            <ion-icon name="ticket-outline" style={{ fontSize: '1.2rem' }}></ion-icon>
            <span>Biletiniz Ayrıldı</span>
          </div>
          <span className="font-mono text-xs font-black bg-black/40 text-[var(--primary-gold)] px-2 py-0.5 rounded border border-[var(--primary-gold-border)]">
            {reservation.ticketCode}
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] leading-tight">
          Etkinlik günü giriş için bilet kodunuzu veya profilinizdeki kaydı görevliye gösterebilirsiniz.
        </p>
        <div className="flex items-center justify-between pt-1 border-t border-[var(--primary-gold-border)]">
          <span className="text-[10px] text-[var(--text-dim)]">1 Kişilik Kulüp Kontenjanı</span>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:underline transition-colors cursor-pointer"
          >
            {loading ? 'İptal Ediliyor...' : 'Rezervasyonu İptal Et'}
          </button>
        </div>
        {errorMsg && <p className="text-rose-400 text-[10px] font-semibold">{errorMsg}</p>}
      </div>
    );
  }

  // 3. Kontenjan dolmuşsa
  if (isFull) {
    return (
      <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
        <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-bold">
          <ion-icon name="close-circle-outline"></ion-icon>
          <span>Kontenjan Doldu (Tükendi)</span>
        </div>
        <span className="text-[10px] text-[var(--text-dim)] mt-0.5 block">Tüm {ticketQuota} bilet ayrılmıştır.</span>
      </div>
    );
  }

  // 4. Bilet ayırtma butonu
  const handleReserve = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await reserveEventTicket(eventId);
      if ('error' in res && res.error) {
        setErrorMsg(res.error);
      } else if ((res as any).success) {
        setReservation({
          id: (res as any).reservationId,
          ticketCode: (res as any).ticketCode
        });
        setCurrentReservedCount(prev => prev + 1);
        setSuccessMsg((res as any).message || "Biletiniz ayrıldı!");
      }
    } catch (err: any) {
      setErrorMsg("Bilet ayırtılırken bir bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 mt-4">
      {errorMsg && (
        <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-[11px] font-medium">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-[11px] font-medium">
          {successMsg}
        </div>
      )}

      <button
        onClick={handleReserve}
        disabled={loading}
        className="btn btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ion-icon name="ticket-outline" style={{ fontSize: '1.1rem' }}></ion-icon>
        <span>{loading ? 'Bilet Ayırtılıyor...' : 'Bilet Ayırt (Ücretsiz)'}</span>
      </button>

      {ticketQuota > 0 && (
        <div className="flex justify-between items-center text-[10px] text-[var(--text-dim)] px-1">
          <span>1 Üye = 1 Bilet</span>
          <span>Kalan: <strong className="text-[var(--primary-gold)]">{remaining}</strong> / {ticketQuota}</span>
        </div>
      )}
    </div>
  );
}
