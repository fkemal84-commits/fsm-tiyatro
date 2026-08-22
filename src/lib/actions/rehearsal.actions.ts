'use server';

import { adminDb, adminMessaging } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './common';

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
  const title = formData.get('title') as string;
  const eventDate = formData.get('eventDate') as string;
  const eventTime = formData.get('eventTime') as string;
  const location = formData.get('location') as string;
  const description = formData.get('description') as string;

  if (!title || !eventDate || !eventTime || !location) return;

  await requireAuth(['SUPERADMIN', 'ADMIN']);

  const dateTimeStr = `${eventDate} - ${eventTime}`;

  await adminDb.collection('events').add({
    title,
    date: dateTimeStr,
    location,
    description: description || '',
    createdAt: new Date().toISOString()
  });

  revalidatePath('/members');
}

export async function deleteEvent(formData: FormData) {
  const eventId = formData.get('eventId') as string;
  if (!eventId) return;

  await requireAuth(['SUPERADMIN', 'ADMIN']);
  await adminDb.collection('events').doc(eventId).delete();
  revalidatePath('/members');
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
  } catch (error: any) {
    return { error: error.message };
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
  } catch (err: any) {
    return { error: err.message };
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
  } catch (err: any) {
    return { error: err.message };
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
  } catch (err: any) {
    return { error: err.message };
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
  } catch (err: any) {
    return { error: err.message };
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
  } catch (err: any) {
    return { error: err.message };
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
  } catch (err: any) {
    return { error: err.message };
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
  } catch (error: any) {
    return { error: error.message };
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
  } catch (error: any) {
    return { error: error.message };
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
  } catch (err: any) {
    return { error: err.message };
  }
}
