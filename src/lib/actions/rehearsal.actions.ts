'use server';

import { adminDb, adminMessaging } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { requireAuth, handleServerError } from './common';

export async function addRehearsal(formData: FormData) {
  const title = formData.get('title') as string;
  const date = formData.get('rehearsalDate') as string;
  const time = formData.get('rehearsalTime') as string;
  const location = formData.get('location') as string;
  const notes = formData.get('notes') as string;
  const saveAsPreset = formData.get('saveAsPreset') === 'on';

  if (!title || !date || !time) return;

  await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);

  const dateTimeStr = `${date} - ${time}`;

  await adminDb.collection('rehearsals').add({
    title,
    date: dateTimeStr,
    location: location || 'Haliç Yerleşkesi',
    notes: notes || '',
    createdAt: new Date().toISOString()
  });

  if (saveAsPreset) {
    await adminDb.collection('presets').add({
      type: 'rehearsal',
      title,
      location: location || 'Haliç Yerleşkesi',
      time,
      createdAt: new Date().toISOString()
    });
  }

  revalidatePath('/members/rehearsals');
}

export async function deleteRehearsal(formData: FormData) {
  const rehearsalId = formData.get('rehearsalId') as string;
  if (!rehearsalId) return;

  await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
  await adminDb.collection('rehearsals').doc(rehearsalId).delete();
  revalidatePath('/members/rehearsals');
}

export async function addEvent(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const rawDate = (formData.get('date') as string) || '';
    const eventDate = (formData.get('eventDate') as string) || '';
    const eventTime = (formData.get('eventTime') as string) || '';
    const location = (formData.get('location') as string) || 'Haliç Yerleşkesi';
    const description = (formData.get('description') as string) || '';
    const type = (formData.get('type') as string) || 'Etkinlik';
    
    // Biletli / Kontenjanlı Etkinlik Alanları
    const isTicketed = formData.get('isTicketed') === 'true' || formData.get('isTicketed') === 'on';
    const ticketQuotaRaw = formData.get('ticketQuota') as string;
    const ticketQuota = isTicketed && ticketQuotaRaw ? Math.max(1, parseInt(ticketQuotaRaw, 10)) : 0;

    const dateTimeStr = rawDate.trim() || (eventDate && eventTime ? `${eventDate} - ${eventTime}` : eventDate || 'Tarih Belirtilmedi');

    if (!title || !dateTimeStr) {
      return { error: "Etkinlik adı ve tarihi zorunludur." };
    }

    await requireAuth(['SUPERADMIN', 'ADMIN']);

    await adminDb.collection('events').add({
      title: title.trim(),
      date: dateTimeStr,
      location: location.trim(),
      description: description.trim(),
      type: type.trim(),
      isTicketed: Boolean(isTicketed),
      ticketQuota: ticketQuota,
      reservedCount: 0,
      createdAt: new Date().toISOString()
    });

    revalidatePath('/etkinlikler');
    revalidatePath('/members');
    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "ADD_EVENT");
  }
}

export async function deleteEvent(formData: FormData) {
  const eventId = formData.get('eventId') as string;
  if (!eventId) return;

  try {
    await requireAuth(['SUPERADMIN', 'ADMIN']);
    
    // Etkinliğe ait rezervasyonları da temizle
    const resSnap = await adminDb.collection('eventReservations').where('eventId', '==', eventId).get();
    const batch = adminDb.batch();
    resSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit().catch(() => {});

    await adminDb.collection('events').doc(eventId).delete();
    revalidatePath('/etkinlikler');
    revalidatePath('/members');
    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "DELETE_EVENT");
  }
}

export async function joinEvent(formData: FormData) {
  const eventId = formData.get('eventId') as string;
  const eventTitle = formData.get('eventTitle') as string;
  const note = formData.get('note') as string;

  if (!eventId) return { error: "Etkinlik ID bulunamadı." };

  try {
    const { session, user, uid } = await requireAuth(['MEMBER', 'AKTOR', 'EDITOR', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN']);
    const userName = [user.name, user.surname].filter(Boolean).join(' ') || session.user?.name || 'Kulüp Üyesi';

    const existingReq = await adminDb.collection('eventRequests')
      .where('eventId', '==', eventId)
      .where('userId', '==', uid)
      .limit(1)
      .get();

    if (!existingReq.empty) {
      return { error: "Bu etkinliğe zaten katılım bildirdiniz." };
    }

    await adminDb.collection('eventRequests').add({
      eventId,
      eventTitle: eventTitle || 'Etkinlik',
      userId: uid,
      userName,
      userEmail: user.email,
      note: note || '',
      status: 'APPROVED',
      createdAt: new Date().toISOString()
    });

    revalidatePath('/members');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "JOIN_EVENT");
  }
}

/**
 * Biletli Etkinlik için Üye Bilet Rezervasyonu
 * Sadece giriş yapmış kulüp üyeleri kendilerine bilet ayırtabilir.
 */
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

    // Kontenjan Kontrolü
    const currentReserved = eventData.reservedCount || 0;
    const quota = eventData.ticketQuota || 0;

    if (quota > 0 && currentReserved >= quota) {
      return { error: "Üzgünüz, bu etkinlik için tüm kontenjan / biletler dolmuştur." };
    }

    // Daha önce bilet ayırtmış mı kontrol et
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

    // Özel bilet referans kodu üret (Örn: ETK-FSM-7D4E)
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

    // Kontenjan sayacını artır
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

/**
 * Biletli Etkinlik Rezervasyonunu İptal Etme
 */
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

    // Yalnızca biletin sahibi veya ADMIN silebilir
    if (resData.userId !== uid && user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') {
      return { error: "Sadece kendi biletinizi iptal edebilirsiniz." };
    }

    if (resData.status !== 'ACTIVE') {
      return { error: "Bu rezervasyon zaten aktif değil." };
    }

    // Rezervasyonu iptal et
    await resRef.update({
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString()
    });

    // Etkinliğin kontenjan sayacını düşür
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

/**
 * Etkinliğe bilet ayırtmış üyeleri listeleme (Yönetim için)
 */
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

export async function startPulseCheck(rehearsalId: string) {
  try {
    const { uid } = await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    const expiresAt = Date.now() + 60000; // 60 saniye

    await adminDb.collection('rehearsals').doc(rehearsalId).update({
      pulseActive: true,
      pulseExpiresAt: expiresAt,
      pulseStartedBy: uid,
      pulseResponses: []
    });

    return { success: true, expiresAt };
  } catch (error) {
    return handleServerError(error, "START_PULSE_CHECK");
  }
}

export async function respondToPulse(rehearsalId: string) {
  try {
    const { uid } = await requireAuth(['AKTOR', 'PLAYER', 'MEMBER', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN']);
    const rehearsalRef = adminDb.collection('rehearsals').doc(rehearsalId);
    const rehearsalSnap = await rehearsalRef.get();

    if (!rehearsalSnap.exists) throw new Error("Prova bulunamadı.");
    const data = rehearsalSnap.data()!;

    if (!data.pulseActive || Date.now() > data.pulseExpiresAt) {
      throw new Error("Yoklama süresi doldu.");
    }

    const currentResponses: any[] = data.pulseResponses || [];
    const hasAlreadyResponded = currentResponses.some(r => typeof r === 'string' ? r === uid : r.userId === uid);

    if (!hasAlreadyResponded) {
      const istanbulTime = new Date().toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      currentResponses.push({ userId: uid, timeString: istanbulTime });
      await rehearsalRef.update({ pulseResponses: currentResponses });
    }

    return { success: true };
  } catch (error) {
    return handleServerError(error, "RESPOND_TO_PULSE");
  }
}

export async function addManualAttendance(rehearsalId: string, userId: string, status: string, note: string) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    const ref = adminDb.collection('rehearsals').doc(rehearsalId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Prova kaydı bulunamadı.");

    const currentAttendance = snap.data()?.attendance || {};
    currentAttendance[userId] = status;

    let notes = snap.data()?.attendanceNotes || '';
    if (note) {
      notes += `\n[Manuel ${status}] ${userId}: ${note}`;
    }

    await ref.update({
      attendance: currentAttendance,
      attendanceNotes: notes
    });

    revalidatePath('/members/rehearsals');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "ADD_MANUAL_ATTENDANCE");
  }
}

export async function finalizeAttendance(rehearsalId: string, attendanceData: any, attendanceNotes: string) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    await adminDb.collection('rehearsals').doc(rehearsalId).update({
      attendance: attendanceData,
      attendanceNotes: attendanceNotes || '',
      pulseActive: false
    });

    revalidatePath('/members/rehearsals');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "FINALIZE_ATTENDANCE");
  }
}

export async function startInstantAttendance(formData?: FormData) {
  try {
    const { uid } = await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    const istanbulDateStr = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });
    const istanbulTimeStr = new Date().toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });
    const expiresAt = Date.now() + 60000;

    const docRef = await adminDb.collection('rehearsals').add({
      title: `Anlık Yoklama (${istanbulDateStr} ${istanbulTimeStr})`,
      date: `${new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })} - ${istanbulTimeStr} (Anlık)`,
      location: 'Haliç Yerleşkesi',
      notes: 'Anlık başlatılan nabız yoklaması.',
      pulseActive: true,
      pulseExpiresAt: expiresAt,
      pulseStartedBy: uid,
      pulseResponses: [],
      createdAt: new Date().toISOString()
    });

    revalidatePath('/members/rehearsals');
    return { success: true, rehearsalId: docRef.id };
  } catch (error) {
    return handleServerError(error, "START_INSTANT_ATTENDANCE");
  }
}

export async function activateRehearsalPulse(rehearsalId: string) {
  try {
    const { uid } = await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    const expiresAt = Date.now() + 60000;

    await adminDb.collection('rehearsals').doc(rehearsalId).update({
      pulseActive: true,
      pulseExpiresAt: expiresAt,
      pulseStartedBy: uid
    });

    revalidatePath('/members/rehearsals');
    return { success: true, expiresAt };
  } catch (error) {
    return handleServerError(error, "ACTIVATE_REHEARSAL_PULSE");
  }
}

export async function saveFCMToken(token: string) {
  try {
    const { uid } = await requireAuth(['MEMBER', 'AKTOR', 'PLAYER', 'EDITOR', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN']);
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      const currentTokens: string[] = userSnap.data()?.fcmTokens || [];
      if (!currentTokens.includes(token)) {
        currentTokens.push(token);
        await userRef.update({ fcmTokens: currentTokens });
      }
    }
    return { success: true };
  } catch (error) {
    return handleServerError(error, "SAVE_FCM_TOKEN");
  }
}

export async function nudgePlayers(targetUserIds?: string[]) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    let usersQuery = adminDb.collection('users').where('role', 'in', ['AKTOR', 'PLAYER']);
    const snapshot = await usersQuery.get();

    const tokens: string[] = [];
    snapshot.forEach(doc => {
      if (!targetUserIds || targetUserIds.includes(doc.id)) {
        const userTokens: string[] = doc.data().fcmTokens || [];
        tokens.push(...userTokens);
      }
    });

    const uniqueTokens = Array.from(new Set(tokens));
    if (uniqueTokens.length === 0) {
      return { success: false, message: "Kayıtlı aktif bildirim cihazı bulunamadı." };
    }

    const payload = {
      notification: {
        title: "FSM Tiyatro Bildirimi",
        body: "Yeni bir prova duyurusu veya yoklama başlatıldı. Lütfen panonuzu kontrol edin."
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
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const tokens: string[] = userDoc.data()?.fcmTokens || [];

    if (tokens.length === 0) return { error: "Cihazınızda kayıtlı bildirim belirteci yok." };

    const payload = {
      notification: {
        title: "FSM Tiyatro Test Bildirimi",
        body: "Bildirim sistemi başarıyla çalışıyor."
      },
      tokens: tokens
    };

    const response = await adminMessaging.sendEachForMulticast(payload);
    return { success: true, sentCount: response.successCount };
  } catch (error) {
    return handleServerError(error, "TEST_PUSH_TO_SELF");
  }
}
