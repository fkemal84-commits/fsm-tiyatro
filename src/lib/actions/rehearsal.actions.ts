'use server';

import { adminDb, adminMessaging } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { requireAuth, handleServerError } from './common';
import { createEvent, deleteUnifiedEvent } from './event.actions';

// ============================================================================
// UYUMLULUK SARMALAYICILARI (Compatibility Wrappers -> event.actions)
// ============================================================================

export async function addRehearsal(formData: FormData) {
  return createEvent(formData);
}

export async function deleteRehearsal(formData: FormData) {
  return deleteUnifiedEvent(formData);
}

export async function addEvent(formData: FormData) {
  return createEvent(formData);
}

export async function deleteEvent(formData: FormData) {
  return deleteUnifiedEvent(formData);
}

export async function updateEvent(formData: FormData) {
  const eventId = formData.get('eventId') as string;
  const title = formData.get('title') as string;
  const date = formData.get('date') as string;
  const location = formData.get('location') as string;
  const description = formData.get('description') as string;
  const type = formData.get('type') as string;

  if (!eventId || !title) return { error: "Eksik parametre." };

  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);

    await adminDb.collection('events').doc(eventId).update({
      title,
      date,
      location,
      description,
      type,
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/etkinlikler');
    revalidatePath('/members');
    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "UPDATE_EVENT");
  }
}

export async function joinEvent(formData: FormData) {
  const eventId = formData.get('eventId') as string;
  if (!eventId) return;

  try {
    const { user, uid } = await requireAuth([
      'MEMBER', 'AKTOR', 'PLAYER', 'EDITOR', 'SALES', 
      'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN'
    ]);

    const istanbulTime = new Date().toLocaleTimeString('tr-TR', { 
      timeZone: 'Europe/Istanbul', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const userName = [user.name, user.surname].filter(Boolean).join(' ') || user.email;

    await adminDb.collection('eventRequests').add({
      eventId,
      userId: uid,
      userName,
      userRole: user.role,
      joinedAt: `${new Date().toLocaleDateString('tr-TR')} ${istanbulTime}`,
      status: 'JOINED'
    });

    revalidatePath('/etkinlikler');
  } catch (error) {
    return handleServerError(error, "JOIN_EVENT");
  }
}

// ============================================================================
// BİLETLİ ETKİNLİK REZERVASYON İŞLEMLERİ
// ============================================================================

export async function reserveEventTicket(eventId: string) {
  if (!eventId) return { error: "Etkinlik ID gereklidir." };

  try {
    const { user, uid } = await requireAuth([
      'MEMBER', 'AKTOR', 'PLAYER', 'EDITOR', 'SALES', 
      'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN'
    ]);

    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return { error: "Etkinlik bulunamadı." };
    }

    const eventData = eventDoc.data()!;
    if (!eventData.isTicketed) {
      return { error: "Bu etkinlik biletli bir etkinlik değildir." };
    }

    const currentReserved = eventData.reservedCount || 0;
    const quota = eventData.ticketQuota || 0;

    if (quota > 0 && currentReserved >= quota) {
      return { error: "Üzgünüz, bu etkinlik için tüm kontenjan / biletler dolmuştur." };
    }

    const existingSnap = await adminDb.collection('eventReservations')
      .where('eventId', '==', eventId)
      .where('userId', '==', uid)
      .where('status', '==', 'ACTIVE')
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const existingTicket = existingSnap.docs[0].data();
      return { 
        error: `Bu etkinlik için zaten biletiniz bulunmaktadır. (Bilet Kodunuz: ${existingTicket.ticketCode})` 
      };
    }

    const randomSuffix = crypto.randomUUID().split('-')[0].toUpperCase();
    const ticketCode = `ETK-${randomSuffix}`;
    const userName = [user.name, user.surname].filter(Boolean).join(' ') || user.email;

    const resRef = await adminDb.collection('eventReservations').add({
      eventId,
      eventTitle: eventData.title,
      eventDate: eventData.date,
      eventLocation: eventData.location,
      eventType: eventData.type || 'Biletli Etkinlik',
      userId: uid,
      userName,
      userEmail: user.email,
      userPhone: user.formattedPhone || user.phone || '',
      userDepartment: user.department || '',
      ticketCode,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    });

    await eventRef.update({
      reservedCount: currentReserved + 1,
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/etkinlikler');
    revalidatePath('/members');
    revalidatePath('/tanerabi/dashboard');

    return { 
      success: true, 
      ticketCode, 
      reservationId: resRef.id,
      message: `Biletiniz başarıyla ayrıldı! Bilet Kodunuz: ${ticketCode}` 
    };
  } catch (error) {
    return handleServerError(error, "RESERVE_EVENT_TICKET");
  }
}

export async function cancelEventTicketReservation(reservationId: string) {
  if (!reservationId) return { error: "Rezervasyon ID gereklidir." };

  try {
    const { user, uid } = await requireAuth([
      'MEMBER', 'AKTOR', 'PLAYER', 'EDITOR', 'SALES', 
      'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN'
    ]);

    const resRef = adminDb.collection('eventReservations').doc(reservationId);
    const resDoc = await resRef.get();

    if (!resDoc.exists) {
      return { error: "Rezervasyon bulunamadı." };
    }

    const resData = resDoc.data()!;

    if (resData.userId !== uid && user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') {
      return { error: "Sadece kendi biletinizi iptal edebilirsiniz." };
    }

    if (resData.status !== 'ACTIVE') {
      return { error: "Bu rezervasyon zaten aktif değil." };
    }

    await resRef.update({
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString()
    });

    if (resData.eventId) {
      const eventRef = adminDb.collection('events').doc(resData.eventId);
      const eventDoc = await eventRef.get();
      if (eventDoc.exists) {
        const currentReserved = eventDoc.data()?.reservedCount || 0;
        await eventRef.update({
          reservedCount: Math.max(0, currentReserved - 1),
          updatedAt: new Date().toISOString()
        });
      }
    }

    revalidatePath('/etkinlikler');
    revalidatePath('/members');
    revalidatePath('/tanerabi/dashboard');

    return { success: true, message: "Bilet rezervasyonunuz iptal edildi." };
  } catch (error) {
    return handleServerError(error, "CANCEL_EVENT_TICKET");
  }
}

export async function getEventReservations(eventId: string) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    if (!eventId) return [];

    const snap = await adminDb.collection('eventReservations')
      .where('eventId', '==', eventId)
      .where('status', '==', 'ACTIVE')
      .get();

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[GET_EVENT_RESERVATIONS] Hata:", error);
    return [];
  }
}

import { savePushSubscription } from './notification.actions';

// ============================================================================
// BİLDİRİM VE CİHAZ EŞLEŞTİRME İŞLEMLERİ (push_subscriptions canonical storage)
// ============================================================================

export async function saveFCMToken(token: string) {
  return savePushSubscription(token);
}

export async function nudgePlayers(targetUserIds?: string[]) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    let usersQuery = adminDb.collection('users').where('role', 'in', ['AKTOR', 'PLAYER']);
    const snapshot = await usersQuery.get();

    const targetUids = snapshot.docs
      .map(doc => doc.id)
      .filter(id => !targetUserIds || targetUserIds.includes(id));

    if (targetUids.length === 0) {
      return { success: false, message: "Kayıtlı aktif oyuncu bulunamadı." };
    }

    const subsSnap = await adminDb.collection('push_subscriptions')
      .where('userId', 'in', targetUids.slice(0, 10))
      .get();

    const uniqueTokens = Array.from(new Set(subsSnap.docs.map(d => d.data().token).filter(Boolean)));
    if (uniqueTokens.length === 0) {
      return { success: false, message: "Kayıtlı aktif bildirim cihazı bulunamadı." };
    }

    const payload = {
      notification: {
        title: "FSM Tiyatro Bildirimi",
        body: "Yeni bir prova duyurusu veya etkinlik planlandı. Lütfen panonuzu kontrol edin."
      },
      tokens: uniqueTokens
    };

    const response = await adminMessaging.sendEachForMulticast(payload);
    return { success: true, sentCount: response.successCount, failureCount: response.failureCount };
  } catch (error) {
    return handleServerError(error, "NUDGE_PLAYERS");
  }
}

export async function testPushToSelf() {
  try {
    const { uid } = await requireAuth(['SUPERADMIN', 'ADMIN']);
    const subsSnap = await adminDb.collection('push_subscriptions')
      .where('userId', '==', uid)
      .get();

    const tokens = Array.from(new Set(subsSnap.docs.map(d => d.data().token).filter(Boolean)));

    if (tokens.length === 0) return { error: "Cihazınızda kayıtlı bildirim belirteci yok." };

    const payload = {
      notification: {
        title: "FSM Tiyatro Test Bildirimi",
        body: "Bildirim sistemi başarıyla çalışıyor."
      },
      tokens
    };

    const response = await adminMessaging.sendEachForMulticast(payload);
    return { success: true, sentCount: response.successCount };
  } catch (error) {
    return handleServerError(error, "TEST_PUSH_TO_SELF");
  }
}
