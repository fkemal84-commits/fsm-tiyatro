'use client';

import { testPushToSelf } from "@/app/actions";
import { useState } from "react";

export default function TestPushButton() {
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    const res = await testPushToSelf();
    if (res.error) {
      alert("Hata: " + res.error);
    } else {
      alert("Test bildirimi gönderildi! Lütfen telefonunuzu kontrol edin.");
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleTest}
      disabled={loading}
      className="text-[var(--primary-gold)] text-xs border border-[var(--primary-gold)]/30 px-3 py-1 rounded-full hover:bg-[var(--primary-gold)]/10 transition-all flex items-center gap-2"
    >
      <ion-icon name="flask-outline"></ion-icon>
      {loading ? 'Test ediliyor...' : 'Kendi Cihazımı Test Et'}
    </button>
  );
}
