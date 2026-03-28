'use client';

import { nudgePlayers } from "@/app/actions";
import { useState } from "react";

export default function NudgeButton() {
  const [loading, setLoading] = useState(false);

  const handleNudge = async () => {
    if (!confirm("Tüm oyunculara ve teknik ekibe bildirim gönderilecek. Emin misin?")) return;
    
    setLoading(true);
    const res = await nudgePlayers() as any;
    
    if (res.error) {
      alert("Hata: " + res.error);
    } else {
      alert(`Dürtme başarılı! \n\n${res.count} cihaz ulaşıldı, ${res.failure} başarısız.`);
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleNudge}
      disabled={loading}
      className="btn-primary flex items-center gap-2 bg-[#var(--primary-gold)] border-none hover:opacity-80 px-6 py-2 rounded-lg text-sm font-bold"
    >
      <ion-icon name="notifications-outline"></ion-icon>
      {loading ? 'Dürtülüyor...' : 'Oyuncuları Dürt 🎭'}
    </button>
  );
}
