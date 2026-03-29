'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { respondToPulse } from '@/app/actions';

export default function FlashAttendanceOverlay() {
  const { data: session } = useSession();
  const [activeRehearsal, setActiveRehearsal] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [responded, setResponded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    const q = query(
      collection(db, "rehearsals"),
      where("pulseActive", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        let foundValid = false;

        for (const doc of snapshot.docs) {
          const docData = doc.data();
          const id = doc.id;
          const expiresAt = docData.pulseExpiresAt;
          const responses = docData.pulseResponses || [];
          
          const hasResponded = responses.includes(userId);
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

          if (remaining > 0 && !hasResponded) {
            // BAŞLATAN KİŞİ VE REJİ (Admin/Director) GÖRMESİN
            const isStarter = userId === docData.pulseStartedBy;
            const isActor = ['AKTOR', 'PLAYER'].includes(userRole);
            const isManager = ['ADMIN', 'SUPERADMIN', 'DIRECTOR', 'ASST_DIRECTOR'].includes(userRole);

            if (isActor && !isStarter && !isManager) {
              setActiveRehearsal({ id, ...docData });
              setTimeLeft(remaining);
              setResponded(false);
              foundValid = true;
              break; 
            }
          }
        }

        if (!foundValid) setActiveRehearsal(null);
      } else {
        setActiveRehearsal(null);
      }
    }, (error) => {
      console.error("[FLASH] Connection error:", error);
    });

    return () => unsubscribe();
  }, [session]);

  // Sayaç işlemi
  useEffect(() => {
    if (activeRehearsal && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setActiveRehearsal(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeRehearsal, timeLeft]);

  const handleImHere = async () => {
    if (!activeRehearsal) return;
    setLoading(true);
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
      await respondToPulse(activeRehearsal.id);
      setResponded(true);
      setTimeout(() => setActiveRehearsal(null), 1500);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {activeRehearsal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fadeIn">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--primary-gold)]/20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[var(--primary-gold)] flex items-center justify-center text-4xl font-bold text-[var(--primary-gold)] bg-black/50">
                {timeLeft}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="serif-font text-3xl text-white">Nabız <span className="text-[var(--primary-gold)]">Yoklaması</span></h2>
              <p className="text-white/60 text-sm">Provada mısın? Hemen butona basarak varlığını kanıtla!</p>
            </div>

            {responded ? (
              <div className="bg-green-600/20 border border-green-500/30 p-6 rounded-3xl animate-bounce">
                <ion-icon name="checkmark-done-outline" style={{ fontSize: '3rem', color: '#22c55e' }}></ion-icon>
                <p className="text-green-400 font-bold mt-2 uppercase tracking-widest text-sm">VARLIĞINIZ MÜHÜRLENDİ</p>
              </div>
            ) : (
              <button
                onClick={handleImHere}
                disabled={loading}
                className="w-full aspect-square max-w-[280px] mx-auto rounded-full bg-gradient-to-tr from-[var(--primary-gold)] to-[#FFD700] p-1 shadow-[0_0_50px_rgba(212,175,55,0.3)] active:scale-95 transition-all group"
              >
                <div className="w-full h-full rounded-full bg-black flex flex-col items-center justify-center space-y-2 group-hover:bg-transparent transition-colors">
                  <ion-icon name="finger-print-outline" style={{ fontSize: '4rem', color: loading ? '#666' : 'var(--primary-gold)' }} className="group-hover:text-black"></ion-icon>
                  <span className="text-white group-hover:text-black font-bold tracking-widest uppercase text-xl">
                    {loading ? 'YÜKLENİYOR...' : 'BURADAYIM!'}
                  </span>
                </div>
              </button>
            )}

            <p className="text-white/20 text-xs uppercase tracking-[0.2em]">Kalan Süre: {timeLeft} Saniye</p>
          </div>
        </div>
      )}
    </>
  );
}
