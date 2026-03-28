'use client';

import { useState } from 'react';
import { joinEvent } from '@/app/actions';

export default function JoinEventButton({ eventId, eventTitle }: { eventId: string, eventTitle: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('eventId', eventId);
    formData.append('eventTitle', eventTitle);

    try {
      const res = await joinEvent(formData);
      if (res?.success) {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Katılım hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-2 text-[var(--primary-gold)] text-sm font-semibold bg-white/5 p-2 rounded-lg">
        <ion-icon name="checkmark-done-outline"></ion-icon>
        Talebin Alındı!
      </div>
    );
  }

  return (
    <button 
      onClick={handleJoin}
      disabled={loading}
      className={`btn w-full text-sm py-2 flex items-center justify-center gap-2 transition-all ${
        loading ? 'opacity-50 cursor-not-allowed' : 'btn-primary'
      }`}
    >
      <ion-icon name={loading ? "sync-outline" : "hand-right-outline"} className={loading ? 'animate-spin' : ''}></ion-icon>
      {loading ? 'İletiliyor...' : 'Katılmak İstiyorum'}
    </button>
  );
}
