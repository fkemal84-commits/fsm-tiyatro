'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function FlashAttendanceOverlay() {
  const { data: session } = useSession();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const q = query(
      collection(db, "attendance_sessions"),
      where("status", "==", "OPEN")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        let foundValid = false;

        for (const doc of snapshot.docs) {
          const docData = doc.data();
          const id = doc.id;
          const expiresAt = docData.expiresAt;
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

          if (remaining > 0) {
            // Başlatan kişi kendisi görmesin
            if (userId !== docData.openedBy) {
              setActiveSession({ id, ...docData });
              setTimeLeft(remaining);
              foundValid = true;
              break;
            }
          }
        }

        if (!foundValid) setActiveSession(null);
      } else {
        setActiveSession(null);
      }
    }, (error) => {
      console.warn("[ATTENDANCE_OVERLAY] Bağlantı:", error);
    });

    return () => unsubscribe();
  }, [session]);

  // Sayaç
  useEffect(() => {
    if (activeSession && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setActiveSession(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeSession, timeLeft]);

  if (!activeSession) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-[90vw] p-5 rounded-2xl bg-zinc-950/95 border border-[var(--primary-gold)]/60 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-fadeIn">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-[var(--primary-gold)] uppercase tracking-wider">
            Canlı Yoklama Başladı
          </span>
        </div>
        <button
          onClick={() => setActiveSession(null)}
          className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors p-1"
        >
          ✕
        </button>
      </div>

      <h4 className="serif-font text-white font-bold text-base mb-1 line-clamp-1">
        {activeSession.eventTitle || 'Prova / Etkinlik'}
      </h4>
      <p className="text-zinc-400 text-xs leading-relaxed mb-4">
        Etkinlik alanındaysanız, yönetmenin/yöneticinin gösterdiği <strong>QR kodu kameranızla tarayarak</strong> katılımınızı doğrulayınız.
      </p>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800">
        <span className="text-[11px] text-zinc-500 font-mono">
          ⏱️ Kalan: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </span>
        <Link
          href={`/members/attendance?session=${activeSession.id}`}
          onClick={() => setActiveSession(null)}
          className="py-1.5 px-4 rounded-lg bg-[var(--primary-gold)] hover:bg-[#c49b2c] text-black font-bold text-xs transition-all flex items-center gap-1.5 shadow-md"
        >
          <ion-icon name="qr-code-outline"></ion-icon>
          <span>QR Oku / Doğrula</span>
        </Link>
      </div>
    </div>
  );
}
