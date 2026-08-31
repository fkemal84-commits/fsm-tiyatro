'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { requireAuth, handleServerError } from './common';
import { AppNotification } from '@/types/domain';

/**
 * Kullanıcının bildirimlerini listeler
 */
export async function getUserNotifications(limitCount = 20): Promise<AppNotification[]> {
  try {
    const { uid } = await requireAuth([
      'MEMBER', 'AKTOR', 'PLAYER', 'EDITOR', 'SALES', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN'
    ]);

    const snap = await adminDb.collection('notifications')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
  } catch (error) {
    console.error("[GET_USER_NOTIFICATIONS] Hata:", error);
    return [];
  }
}

/**
 * Bildirimi okundu olarak işaretler
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    if (!notificationId) return { error: "Bildirim ID gereklidir." };
    const { uid } = await requireAuth();

    const notifRef = adminDb.collection('notifications').doc(notificationId);
    const notifDoc = await notifRef.get();
    if (!notifDoc.exists) return { error: "Bildirim bulunamadı." };

    const data = notifDoc.data() as AppNotification;
    if (data.userId !== uid) return { error: "Yetkisiz işlem." };

    await notifRef.update({ isRead: true });
    revalidatePath('/members');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "MARK_NOTIFICATION_READ");
  }
}

/**
 * Kullanıcının tüm bildirimlerini okundu işaretler
 */
export async function markAllNotificationsAsRead() {
  try {
    const { uid } = await requireAuth();

    const unreadSnap = await adminDb.collection('notifications')
      .where('userId', '==', uid)
      .where('isRead', '==', false)
      .get();

    if (!unreadSnap.empty) {
      const batch = adminDb.batch();
      unreadSnap.docs.forEach(d => batch.update(d.ref, { isRead: true }));
      await batch.commit();
    }

    revalidatePath('/members');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "MARK_ALL_NOTIFICATIONS_READ");
  }
}
