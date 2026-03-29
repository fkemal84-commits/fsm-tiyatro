'use client';

import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { saveFCMToken } from '@/app/actions';

import { useSession } from 'next-auth/react';

export default function PushNotificationManager({ session: initialSession }: { session: any }) {
  const { data: session } = useSession();
  const currentSession = session || initialSession;

  const [permission, setPermission] = useState<string>('default');
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const [regStatus, setRegStatus] = useState<string>('');
  const [showDelayed, setShowDelayed] = useState(false);

  // 5 saniye sonra uyarının görünmesine izin ver
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDelayed(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const registerToken = async (currentPermission: string) => {
    if (currentPermission !== 'granted' || !messaging || !currentSession) return;
    
    try {
      setRegStatus('wait_sw');
      const registration = await navigator.serviceWorker.ready;
      
      setRegStatus('get_token');
      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: 'BBic0Z64gSgIWMc36FjQmhoWCPcLR439g-PHq6eHTN8RLNj4M1mWM4QNrrCzb1heiQpPUD66SVjrbka-lIvIqw4'
      });
      
      if (token) {
        setRegStatus('saving');
        await saveFCMToken(token);
        setRegStatus('done');
      } else {
        setRegStatus('no_token');
      }
    } catch (error: any) {
      console.error('[PUSH] Kayıt hatası:', error);
      setRegStatus('error: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  useEffect(() => {
    if (permission === 'granted') {
      registerToken(permission);
    }
  }, [permission, currentSession]);

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
    } catch (error) {
      console.error('[PUSH] İzin isteme hatası:', error);
    }
  };

  // Eğer her şey tamamsa ve kayıt yapıldıysa (veya reddedildiyse) bileşeni gizle
  // Ama hata varsa veya register bekliyorsak uyaralım
  if (!isSupported || !currentSession || !showDelayed) return null;
  
  if (permission === 'granted' && regStatus === 'done') return null;
  if (permission === 'denied' && regStatus !== 'error') return null;

  return (
    <div className="fixed bottom-24 left-[5%] right-[5%] z-[1001] sm:left-auto sm:right-10 sm:w-[420px]">
      <div className="glass-card p-8 border-[var(--primary-gold)]/30 border bg-[rgba(5,5,5,0.98)] shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl rounded-2xl overflow-hidden relative group">
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

          <div className="space-y-4">
            <p className="text-white/70 text-sm leading-relaxed">
              {regStatus.startsWith('error') 
                ? 'Bildirim kaydı yapılırken bir sorun oluştu. Lütfen sayfayı yenileyip tekrar deneyin.'
                : 'Prova saatleri ve kritik duyuruları anlık olarak almak için bildirimleri etkinleştirin.'}
            </p>

            {regStatus && (
              <div className="text-[10px] text-[var(--primary-gold)] uppercase tracking-[1px] bg-white/5 p-2 rounded border border-white/10">
                SİSTEM DURUMU: {
                  regStatus === 'wait_sw' ? 'Hizmet İşçisi Bekleniyor...' :
                  regStatus === 'get_token' ? 'Cihaz Kimliği Alınıyor...' :
                  regStatus === 'saving' ? 'Veritabanına Kaydediliyor...' :
                  regStatus === 'done' ? 'Bağlantı Kuruldu ✅' :
                  regStatus === 'no_token' ? 'Kimlik Alınamadı ❌' :
                  regStatus
                }
              </div>
            )}
          </div>
          
          {isIOS && !isStandalone ? (
            <div className="p-4 bg-[rgba(212,175,55,0.05)] border border-[var(--primary-gold)]/20 rounded-xl space-y-3">
              <p className="text-[11px] text-[var(--primary-gold)] uppercase font-bold tracking-widest flex items-center gap-2">
                <ion-icon name="information-circle-outline"></ion-icon> iPhone Kullanıcıları İçin
              </p>
              <p className="text-[13px] text-white/90 leading-normal">
                Bildirimler için önce tarayıcıdaki <strong>Paylaş</strong> simgesine basıp <strong>"Ana Ekrana Ekle"</strong> yapmalısınız. Ardından uygulamayı ana ekrandan açın.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {permission !== 'granted' && (
                <button 
                  onClick={handleRequestPermission}
                  className="w-full bg-[var(--primary-gold)] hover:bg-[#b8860b] text-black font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                >
                  Bildirimleri Etkinleştir
                </button>
              )}
              
              {permission === 'granted' && regStatus !== 'done' && (
                <button 
                  onClick={() => registerToken('granted')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[12px] uppercase"
                >
                  Yeniden Bağlanmayı Dene
                </button>
              )}
            </div>
          )}
          
          <button 
            onClick={() => setPermission('denied')}
            className="text-white/30 hover:text-white/60 text-[11px] uppercase tracking-widest transition-colors font-medium text-center"
          >
            Daha Sonra
          </button>
        </div>
      </div>
    </div>
  );
}
