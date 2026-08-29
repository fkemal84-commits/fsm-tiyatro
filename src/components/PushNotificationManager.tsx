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
  const [isDismissed, setIsDismissed] = useState(false);

  // 15 saniye sonra uyarının görünmesine izin ver ve dismissal kontrolü yap
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        setPermission(Notification.permission);
        return;
      }
    }

    const dismissedUntil = localStorage.getItem('push_notif_dismissed_until');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
      setIsDismissed(true);
      return;
    }

    const timer = setTimeout(() => {
      setShowDelayed(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    // 7 gün boyunca bir daha sorma
    const expireTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('push_notif_dismissed_until', expireTime.toString());
    setIsDismissed(true);
  };

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
      
      const currentPerm = Notification.permission;
      setPermission(currentPerm);
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

  // İzin zaten verilmişse veya reddedilmişse KESİNLİKLE hiçbir kutu gösterme
  if (!isSupported || !currentSession || !showDelayed || isDismissed) return null;
  if (permission === 'granted' || permission === 'denied') return null;

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', left: 'auto',
      zIndex: 1001, width: '380px', maxWidth: 'calc(100vw - 2rem)',
    }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--primary-gold-border)',
        borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-stage)',
        position: 'relative', overflow: 'hidden',
      }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
              background: 'var(--primary-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', color: '#000',
            }}>
              <ion-icon name="notifications-outline"></ion-icon>
            </div>
            <div>
              <h4 className="serif-font" style={{ color: 'var(--text-main)', fontSize: '1.05rem', margin: 0, lineHeight: 1.3 }}>Bildirimleri Açın</h4>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', margin: 0, marginTop: '0.15rem' }}>Prova ve duyurulardan haberdar olun</p>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>
            {regStatus.startsWith('error') 
              ? 'Bildirim kaydı sırasında bir sorun oluştu. Sayfayı yenileyip tekrar deneyebilirsiniz.'
              : 'Prova saatleri ve önemli duyuruları anında almak için bildirimleri etkinleştirin.'}
          </p>

          {regStatus && regStatus !== 'done' && (
            <div style={{
              fontSize: '0.65rem', color: 'var(--text-dim)', padding: '0.4rem 0.6rem',
              background: 'var(--bg-surface-elevated)', borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
            }}>
              {regStatus === 'wait_sw' ? 'Hazırlanıyor...' :
               regStatus === 'get_token' ? 'Cihaz tanımlanıyor...' :
               regStatus === 'saving' ? 'Kaydediliyor...' :
               regStatus === 'no_token' ? 'Cihaz tanımlanamadı.' :
               regStatus.startsWith('error') ? 'Hata oluştu.' : regStatus}
            </div>
          )}
          
          {isIOS && !isStandalone ? (
            <div style={{
              padding: '0.75rem', background: 'var(--primary-gold-dim)',
              border: '1px solid var(--primary-gold-border)', borderRadius: '10px',
            }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--primary-gold)', fontWeight: 'bold', margin: '0 0 0.3rem 0' }}>
                iPhone Kullanıcıları İçin
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Bildirimler için önce tarayıcıdaki <strong>Paylaş</strong> simgesine basıp <strong>&quot;Ana Ekrana Ekle&quot;</strong> yapmalısınız. Ardından uygulamayı ana ekrandan açın.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {permission !== 'granted' && (
                <button 
                  onClick={handleRequestPermission}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '10px', border: 'none',
                    background: 'var(--primary-gold)', color: '#000', fontWeight: 'bold',
                    fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  Bildirimleri Etkinleştir
                </button>
              )}
              
              {permission === 'granted' && regStatus !== 'done' && (
                <button 
                  onClick={() => registerToken('granted')}
                  style={{
                    width: '100%', padding: '0.65rem', borderRadius: '10px',
                    background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)',
                    color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer',
                  }}
                >
                  Tekrar Dene
                </button>
              )}
            </div>
          )}
          
          <button 
            onClick={handleDismiss}
            style={{
              background: 'none', border: 'none', color: 'var(--text-dim)',
              fontSize: '0.7rem', cursor: 'pointer', padding: '0.25rem',
              textAlign: 'center',
            }}
          >
            Daha Sonra
          </button>
        </div>
      </div>
    </div>
  );
}
