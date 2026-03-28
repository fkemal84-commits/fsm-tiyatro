'use client';

import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { saveFCMToken } from '@/app/actions';
import { useSession } from 'next-auth/react';

export default function PushNotificationManager() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.email) return;

    const setupPush = async () => {
      try {
        if (!messaging) return;

        // 1. İzin İste
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('[PUSH] Bildirim izni verilmedi.');
          return;
        }

        // 2. Token Al
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });

        if (token) {
          console.log('[PUSH] FCM Token Alındı.');
          await saveFCMToken(token);
        }

        // 3. Ön Plandaki Mesajları Dinle
        onMessage(messaging, (payload) => {
          console.log('[PUSH] Ön planda mesaj alındı:', payload);
          // Tarayıcı ön plandaysa bile bildirim gösterilebilir
          if (payload.notification) {
            new Notification(payload.notification.title || 'FSM Tiyatro', {
              body: payload.notification.body,
              icon: '/logo.jpg'
            });
          }
        });

      } catch (error) {
        console.error('[PUSH] Hata:', error);
      }
    };

    setupPush();
  }, [session]);

  return null; // Görünmez bileşen
}
