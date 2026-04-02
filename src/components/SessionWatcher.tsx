'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

/**
 * Bu bileşen, veritabanındaki kullanıcı verilerini (özellikle Rol) anlık olarak dinler
 * ve bir değişiklik olduğunda NextAuth oturumunu (session) otomatik olarak günceller.
 * Böylece kullanıcının çıkış-giriş yapmasına gerek kalmaz.
 */
export default function SessionWatcher() {
  const { data: session, update } = useSession();

  useEffect(() => {
    if (!session?.user?.email) return;

    // Kullanıcının Firestore'daki dokümanını dinle
    // Not: users koleksiyonunda ID'ler e-posta da olabilir veya rastgele ID. 
    // FSM App'te users koleksiyonu e-posta ile mi sorgulanıyor bakalım.
    // actions.ts'de email ile sorgu yapılıyor. Benzer bir mantık kurmalıyız.
    
    // Daha güvenli yol: Session'da kullanıcının ID'si (doc id) varsa onu kullanmalıyız.
    const userId = (session.user as any).id;
    if (!userId) return;

    const unsub = onSnapshot(doc(db, "users", userId), (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        const dbRole = userData.role;
        const currentSessionRole = (session.user as any).role;
        const currentIsAdminMode = (session.user as any).isAdminMode;

        // EĞER VERİTABANINDAKİ ROL, OTURUMDAKİ ROLDEN FARKLIYSA GÜNCELLE
        if (dbRole !== currentSessionRole) {
          console.log(`[SESSION_WATCHER] Rol değişikliği saptandı: ${currentSessionRole} -> ${dbRole}`);
          
          let nextIsAdminMode = currentIsAdminMode;
          // Eğer yeni rol yönetici rolü değilse ve admin modundaysa, modu kapat
          if (!['ADMIN', 'SUPERADMIN', 'DIRECTOR'].includes(dbRole)) {
            nextIsAdminMode = false;
          }

          update({
            role: dbRole,
            isAdminMode: nextIsAdminMode
          }).then(() => {
            // Sayfayı zorunlu yenile ki Server Component'lar (Layout, Header vb.) da güncellensin
            window.location.reload();
          });
        }
      }
    });

    return () => unsub();
  }, [session?.user?.email, (session?.user as any)?.id]);

  return null; // Görünmez bileşen
}
