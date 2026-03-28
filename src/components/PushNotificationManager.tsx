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
      if (!('Notification' in window)) {
        setIsSupported(false);
        return;
      }
      
      setPermission(Notification.permission);
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
      
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
        console.log('[PUSH] İzin verildi, Service Worker bekleniyor...');
        
        // Service Worker'ın hazır olduğundan emin ol
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          console.log('[PUSH] Service Worker hazır, token alınıyor...');
          
          const token = await getToken(messaging, {
            serviceWorkerRegistration: registration,
            vapidKey: 'BBic0Z64gSgIWMc36FjQmhoWCPcLR439g-PHq6eHTN8RLNj4M1mWM4QNrrCzb1heiQpPUD66SVjrbka-lIvIqw4'
          });
          
          if (token) {
            console.log('[PUSH] Token başarıyla oluşturuldu.');
            await saveFCMToken(token);
          } else {
            console.warn('[PUSH] Token boş döndü.');
          }
        }
      }
    } catch (error) {
      console.error('[PUSH] İzin hatası:', error);
    }
  };

  if (!isSupported || !session || permission === 'granted') return null;

  return (
    <div className="fixed bottom-24 left-[5%] right-[5%] z-[1001] sm:left-auto sm:right-10 sm:w-[420px]">
      <div className="glass-card p-8 border-[var(--primary-gold)]/30 border bg-[rgba(5,5,5,0.98)] shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl rounded-2xl overflow-hidden relative group">
        {/* Dekoratif Işıklandırma */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--primary-gold)]/10 rounded-full blur-3xl group-hover:bg-[var(--primary-gold)]/20 transition-all duration-700"></div>
        
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--primary-gold)] to-[#b8860b] flex items-center justify-center text-2xl shadow-lg shadow-[var(--primary-gold)]/20">
              <ion-icon name="notifications-outline" className="text-black"></ion-icon>
            </div>
            <div>
              <h4 className="serif-font text-white text-xl tracking-tight">Dijital Sahneye Bağlanın</h4>
              <div className="w-12 h-1 bg-[var(--primary-gold)] rounded-full mt-1"></div>
            </div>
          </div>

          <p className="text-white/70 text-sm leading-relaxed">
            Prova saatleri, kritik duyurular ve ekip güncellemelerini anlık olarak almak için bildirim izinlerini etkinleştirin.
          </p>
          
          {isIOS && !isStandalone ? (
            <div className="p-4 bg-[rgba(212,175,55,0.05)] border border-[var(--primary-gold)]/20 rounded-xl space-y-3">
              <p className="text-[11px] text-[var(--primary-gold)] uppercase font-bold tracking-widest flex items-center gap-2">
                <ion-icon name="information-circle-outline"></ion-icon> iPhone / iPad Kullanıcıları İçin
              </p>
              <p className="text-[13px] text-white/90 leading-normal">
                iOS cihazlarda bildirimleri aktif edebilmek için önce tarayıcıdaki <strong>Paylaş</strong> <ion-icon name="share-outline" className="inline-block translate-y-[2px]"></ion-icon> simgesine basıp <strong>"Ana Ekrana Ekle"</strong> seçeneğini kullanmalısınız. Ardından uygulamayı ana ekrandan açarak bildirimleri etkinleştirebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <button 
                onClick={handleRequestPermission}
                className="w-full bg-[var(--primary-gold)] hover:bg-[#b8860b] text-black font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-[var(--primary-gold)]/30 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                Bildirimleri Etkinleştir
              </button>
              <p className="text-center text-[10px] text-white/40 uppercase tracking-[2px]">FSM Tiyatro Portalı • Resmi Duyuru Sistemi</p>
            </div>
          )}
          
          <button 
            onClick={() => setPermission('denied')}
            className="text-white/30 hover:text-white/60 text-[11px] uppercase tracking-widest transition-colors font-medium text-center"
          >
            Daha Sonra Hatırlat
          </button>
        </div>
      </div>
    </div>
  );
}
