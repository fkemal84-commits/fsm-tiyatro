'use client';

import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { saveFCMToken } from '@/app/actions';

export default function PushNotificationManager({ session }: { session: any }) {
  const [permission, setPermission] = useState<string>('default');
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Notification desteği kontrolü
      if (!('Notification' in window)) {
        setIsSupported(false);
        return;
      }
      
      setPermission(Notification.permission);
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
      
      // Mesaj dinleyiciyi kur
      if (messaging) {
        onMessage(messaging, (payload) => {
          if (payload.notification) {
            new Notification(payload.notification.title || 'FSM Tiyatro', {
              body: payload.notification.body,
              icon: '/logo.jpg'
            });
          }
        });
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      if (!messaging || typeof window === 'undefined' || !('Notification' in window)) return;
      
      const res = await Notification.requestPermission();
      setPermission(res);
      
      if (res === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'BBic0Z64gSgIWMc36FjQmhoWCPcLR439g-PHq6eHTN8RLNj4M1mWM4QNrrCzb1heiQpPUD66SVjrbka-lIvIqw4'
        });
        if (token) await saveFCMToken(token);
      }
    } catch (error) {
      console.error('[PUSH] İzin hatası:', error);
    }
  };

  // Sadece session varsa ve destekleniyorsa göster
  if (!isSupported || !session || permission === 'granted') return null;

  return (
    <div className="fixed bottom-24 left-[5%] right-[5%] z-[1001] sm:left-auto sm:right-10 sm:w-[400px]">
      <div className="glass-card p-6 border-[var(--primary-gold)]/30 border-2 bg-[rgba(5,5,5,0.95)] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
        <div className="flex gap-4 items-start">
          <div className="text-3xl">🎭</div>
          <div className="flex-1">
            <h4 className="serif-font text-white text-lg mb-1">Sahne Seni Bekliyor!</h4>
            <p className="text-[var(--text-muted)] text-sm mb-4">
              Provada geç kalmamak ve önemli duyuruları kaçırmamak için bildirimleri açmalısın abi.
            </p>
            
            {isIOS && !isStandalone ? (
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 mb-4">
                <p className="text-xs text-[var(--primary-gold)] leading-relaxed">
                  📢 <strong>iPhone/iPad Notu:</strong> <br/>
                  Bildirim alabilmek için önce alttaki <strong>Paylaş</strong> simgesine basıp <strong>"Ana Ekrana Ekle"</strong> yapman gerek!
                </p>
              </div>
            ) : (
              <button 
                onClick={handleRequestPermission}
                className="btn-primary w-full py-2 hover:scale-105 transition-transform"
              >
                Bildirimleri Etkinleştir 🔔
              </button>
            )}
            
            <button 
              onClick={() => setPermission('denied')}
              className="mt-2 w-full text-center text-xs text-white/30 hover:text-white/60"
            >
              Daha sonra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
