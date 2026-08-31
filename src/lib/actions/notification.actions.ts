'use server';

import { adminDb, adminMessaging } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { requireAuth, handleServerError } from './common';
import { AppNotification, NotificationType, PushSubscriptionRecord } from '@/types/domain';
import crypto from 'crypto';

export interface SendNotificationPayload {
  targetUserIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  eventId?: string | null;
  sessionId?: string | null;
  sendPush?: boolean;
}

/**
 * Cihaz Push Token'ını tekil canonical `push_subscriptions` koleksiyonuna kaydeder.
 */
export async function savePushSubscription(token: string, platform?: 'ios' | 'android' | 'web') {
  try {
    const { uid } = await requireAuth();
    if (!token) return { error: "Belirteç (token) zorunludur." };

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex').slice(0, 32);
    const subRef = adminDb.collection('push_subscriptions').doc(tokenHash);

    const now = new Date().toISOString();
    const subscriptionData: PushSubscriptionRecord = {
      userId: uid,
      token,
      platform: platform || 'web',
      createdAt: now,
      updatedAt: now
    };

    await subRef.set(subscriptionData, { merge: true });
    return { success: true };
  } catch (error) {
    return handleServerError(error, "SAVE_PUSH_SUBSCRIPTION");
  }
}

/**
 * Tekil ve merkezi bildirim gönderim servisi (In-App + Push Subscriptions üzerinden Multicast Push)
 */
export async function sendAppNotification(payload: SendNotificationPayload): Promise<{ success: boolean; sentCount: number }> {
  try {
    const { targetUserIds, type, title, body, link, eventId, sessionId, sendPush = true } = payload;
    const uniqueUserIds = Array.from(new Set(targetUserIds.filter(Boolean)));

    if (uniqueUserIds.length === 0) {
      return { success: true, sentCount: 0 };
    }

    const batch = adminDb.batch();
    const now = new Date().toISOString();

    for (const uid of uniqueUserIds) {
      const notifRef = adminDb.collection('notifications').doc();
      const notification: Omit<AppNotification, 'id'> = {
        userId: uid,
        type,
        title,
        body,
        link: link || '',
        eventId: eventId || null,
        sessionId: sessionId || null,
        isRead: false,
        createdAt: now
      };
      batch.set(notifRef, notification);
    }

    await batch.commit();

    // Push Bildirimi Gönder (Canonical push_subscriptions koleksiyonundan oku)
    if (sendPush && adminMessaging && uniqueUserIds.length > 0) {
      try {
        const subsSnap = await adminDb.collection('push_subscriptions')
          .where('userId', 'in', uniqueUserIds.slice(0, 10))
          .get();

        const fcmTokens: string[] = subsSnap.docs
          .map(d => d.data().token)
          .filter(Boolean);

        const uniqueTokens = Array.from(new Set(fcmTokens));
        if (uniqueTokens.length > 0) {
          await adminMessaging.sendEachForMulticast({
            notification: { title, body },
            tokens: uniqueTokens
          });
        }
      } catch (pushErr) {
        console.warn("[SEND_APP_NOTIFICATION] Push gönderim uyarısı:", pushErr);
      }
    }

    return { success: true, sentCount: uniqueUserIds.length };
  } catch (error) {
    console.error("[SEND_APP_NOTIFICATION] Hata:", error);
    return { success: false, sentCount: 0 };
  }
}

/**
 * Kullanıcının bildirimlerini listeler
 */
export async function getUserNotifications(limitCount = 20): Promise<AppNotification[]> {
  try {
    const { uid } = await requireAuth();

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
