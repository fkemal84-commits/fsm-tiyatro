'use server';

import { adminDb, adminMessaging } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { requireAuth, handleServerError } from './common';
import { canManageEvent, isEventParticipant, isAdmin } from '@/lib/auth-helpers';
import {
  AttendanceSession,
  AttendanceRecord,
  AttendanceRecordStatus,
  EventItem,
  Play,
  AppNotification
} from '@/types/domain';
import { generateQRToken, verifyQRTokenSignature } from '@/lib/qr-helpers';
import crypto from 'crypto';

/**
 * Bir etkinlik için Yoklama Oturumu (AttendanceSession) Başlatır.
 * (Aynı etkinlik için aynı anda yalnızca 1 açık oturum bulunabilir)
 */
export async function openAttendanceSession(eventId: string, durationMinutes = 240) {
  try {
    if (!eventId) return { error: "Etkinlik ID gereklidir." };

    const { user, uid } = await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);

    // Etkinlik bilgisini al
    const eventDoc = await adminDb.collection('events').doc(eventId).get();
    if (!eventDoc.exists) return { error: "Etkinlik bulunamadı." };

    const eventData = eventDoc.data() as EventItem;
    if (!canManageEvent(user, eventData)) {
      return { error: "Bu etkinlik için yoklama başlatma yetkiniz bulunmamaktadır." };
    }

    const now = Date.now();
    const expiresAt = now + Math.max(1, durationMinutes) * 60 * 1000;

    // Aynı etkinlik için açık oturum var mı kontrol et
    const existingSnap = await adminDb.collection('attendance_sessions')
      .where('eventId', '==', eventId)
      .where('status', '==', 'OPEN')
      .get();

    for (const doc of existingSnap.docs) {
      const sData = doc.data() as AttendanceSession;
      if (sData.expiresAt > now) {
        // Zaten süresi dolmamış aktif bir oturum var, onu dön
        const currentToken = generateQRToken(eventId, doc.id, sData.qrSecret);
        return {
          success: true,
          sessionId: doc.id,
          qrSecret: sData.qrSecret,
          token: currentToken,
          expiresAt: sData.expiresAt,
          message: "Mevcut aktif yoklama oturumu gösteriliyor."
        };
      } else {
        // Süresi geçmiş açık kalmış oturumları kapat
        await doc.ref.update({ status: 'CLOSED', closedAt: new Date().toISOString() });
      }
    }

    // Yeni oturum oluştur
    const qrSecret = crypto.randomUUID();
    const sessionData: Omit<AttendanceSession, 'id'> = {
      eventId,
      eventTitle: eventData.title,
      playId: eventData.playId || null,
      status: 'OPEN',
      openedBy: uid,
      openedByEmail: user.email,
      openedByName: [user.name, user.surname].filter(Boolean).join(' ') || user.email,
      openedAt: new Date().toISOString(),
      closedAt: null,
      expiresAt,
      qrSecret,
      lastNudgeAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const sessionRef = await adminDb.collection('attendance_sessions').add(sessionData);
    const token = generateQRToken(eventId, sessionRef.id, qrSecret, now);

    // Katılımcılara bildirim gönder (Attendance oluşmaz, sadece haber verilir)
    await notifyParticipantsAboutAttendance(eventData, sessionRef.id, expiresAt);

    revalidatePath('/members/attendance');
    revalidatePath('/members/rehearsals');
    revalidatePath('/members');

    return {
      success: true,
      sessionId: sessionRef.id,
      qrSecret,
      token,
      expiresAt,
      message: "Yoklama oturumu başarıyla başlatıldı."
    };
  } catch (error) {
    return handleServerError(error, "OPEN_ATTENDANCE_SESSION");
  }
}

/**
 * Yoklama Oturumunu Kapatır
 */
export async function closeAttendanceSession(sessionId: string) {
  try {
    if (!sessionId) return { error: "Oturum ID gereklidir." };

    const { user } = await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);

    const sessionRef = adminDb.collection('attendance_sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) return { error: "Yoklama oturumu bulunamadı." };

    const sessionData = sessionDoc.data() as AttendanceSession;

    // Yetki kontrolü: Admin veya sorumlu yönetmen
    if (!isAdmin(user)) {
      const eventDoc = await adminDb.collection('events').doc(sessionData.eventId).get();
      if (!eventDoc.exists || !canManageEvent(user, eventDoc.data() as EventItem)) {
        return { error: "Bu oturumu kapatma yetkiniz bulunmamaktadır." };
      }
    }

    await sessionRef.update({
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/members/attendance');
    revalidatePath('/members/rehearsals');
    return { success: true, message: "Yoklama oturumu kapatıldı." };
  } catch (error) {
    return handleServerError(error, "CLOSE_ATTENDANCE_SESSION");
  }
}

/**
 * QR Kod Taramasıyla Fiziksel Yoklama Doğrulaması.
 * (Yalnızca authenticated kullanıcı, geçerli oturum, katılımcı kontrolü ve geçerli QR ile çalışır)
 */
export async function verifyAttendanceViaQR(token: string) {
  try {
    if (!token) return { error: "QR doğrulama kodu bulunamadı." };

    const { user, uid } = await requireAuth([
      'MEMBER', 'AKTOR', 'PLAYER', 'EDITOR', 'SALES', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN'
    ]);

    // Token formatını ön kontrol et
    if (!token.startsWith('FSM-ATT:')) {
      return { error: "Geçersiz veya tanınmayan QR kod formatı." };
    }

    const parts = token.split(':');
    if (parts.length !== 5) {
      return { error: "Geçersiz QR kod yapısı." };
    }

    const [, eventId, sessionId] = parts;

    // Oturumu getir
    const sessionDoc = await adminDb.collection('attendance_sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return { error: "Yoklama oturumu bulunamadı." };
    }

    const sessionData = sessionDoc.data() as AttendanceSession;

    // Oturumun bu etkinliğe ait olup olmadığını kontrol et
    if (sessionData.eventId !== eventId) {
      return { error: "Bu QR kod başka bir etkinliğe aittir." };
    }

    // Oturumun açık ve süresinin dolmamış olduğunu kontrol et
    if (sessionData.status !== 'OPEN') {
      return { error: "Bu yoklama oturumu sonlandırılmıştır." };
    }

    if (Date.now() > sessionData.expiresAt) {
      return { error: "Yoklama oturumunun süresi dolmuştur." };
    }

    // QR Token imzasını ve 90sn TTL'ini oturumun qrSecret'ı ile doğrula
    const signatureCheck = verifyQRTokenSignature(token, sessionData.qrSecret, 90000);
    if (!signatureCheck.valid) {
      return { error: signatureCheck.error || "Geçersiz veya süresi dolmuş QR güvenlik imzası." };
    }

    // Etkinlik ve katılımcı kontrolü
    const eventDoc = await adminDb.collection('events').doc(eventId).get();
    if (!eventDoc.exists) return { error: "İlgili etkinlik bulunamadı." };

    const eventData = eventDoc.data() as EventItem;
    let playData: Play | null = null;
    if (eventData.playId) {
      const playDoc = await adminDb.collection('plays').doc(eventData.playId).get();
      if (playDoc.exists) playData = playDoc.data() as Play;
    }

    const isParticipant = isEventParticipant(user, eventData, playData);
    if (!isParticipant) {
      return { error: "Bu etkinliğin / provanın katılımcı kadrosunda yer almıyorsunuz." };
    }

    // Daha önce bu oturum için katılım kaydı var mı kontrol et (Duplicate prevention)
    const existingRecordSnap = await adminDb.collection('attendance_records')
      .where('sessionId', '==', sessionId)
      .where('userId', '==', uid)
      .limit(1)
      .get();

    if (!existingRecordSnap.empty) {
      const existing = existingRecordSnap.docs[0].data() as AttendanceRecord;
      if (existing.status === 'ATTENDED') {
        return { success: true, message: "Yoklamanız zaten doğrulanmış durumdadır." };
      }
    }

    // Katılım kaydını oluştur / güncelle
    const recordData: Omit<AttendanceRecord, 'id'> = {
      eventId,
      eventTitle: eventData.title,
      sessionId,
      userId: uid,
      userName: [user.name, user.surname].filter(Boolean).join(' ') || user.email,
      userEmail: user.email,
      status: 'ATTENDED',
      verifiedAt: new Date().toISOString(),
      verificationMethod: 'QR',
      excuseNote: null,
      modifiedBy: null,
      modifiedAt: null,
      previousStatus: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!existingRecordSnap.empty) {
      await existingRecordSnap.docs[0].ref.update({
        status: 'ATTENDED',
        verificationMethod: 'QR',
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      await adminDb.collection('attendance_records').add(recordData);
    }

    revalidatePath('/members/attendance');
    revalidatePath('/members/rehearsals');

    return {
      success: true,
      message: `🎉 Tebrikler! "${eventData.title}" yoklamanız fiziksel QR ile başarıyla doğrulandı.`
    };
  } catch (error) {
    return handleServerError(error, "VERIFY_ATTENDANCE_QR");
  }
}

/**
 * Yönetici veya Sorumlu Yönetmen tarafından manuel katılım/mazeret düzeltmesi
 */
export async function recordManualAttendance(
  sessionId: string,
  targetUserId: string,
  status: AttendanceRecordStatus,
  excuseNote?: string
) {
  try {
    if (!sessionId || !targetUserId || !status) {
      return { error: "Eksik parametre." };
    }

    const { user } = await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);

    const sessionDoc = await adminDb.collection('attendance_sessions').doc(sessionId).get();
    if (!sessionDoc.exists) return { error: "Yoklama oturumu bulunamadı." };

    const sessionData = sessionDoc.data() as AttendanceSession;

    const eventDoc = await adminDb.collection('events').doc(sessionData.eventId).get();
    if (!eventDoc.exists) return { error: "Etkinlik bulunamadı." };

    const eventData = eventDoc.data() as EventItem;
    if (!canManageEvent(user, eventData)) {
      return { error: "Bu etkinlik için yoklama kaydı düzenleme yetkiniz yoktur." };
    }

    // Hedef kullanıcı bilgilerini al
    const targetUserDoc = await adminDb.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) return { error: "Kullanıcı bulunamadı." };
    const targetUserData = targetUserDoc.data()!;

    const targetUserName = [targetUserData.name, targetUserData.surname].filter(Boolean).join(' ') || targetUserData.email;

    // Mevcut kayıt var mı?
    const recordSnap = await adminDb.collection('attendance_records')
      .where('sessionId', '==', sessionId)
      .where('userId', '==', targetUserId)
      .limit(1)
      .get();

    const now = new Date().toISOString();

    if (!recordSnap.empty) {
      const doc = recordSnap.docs[0];
      const prevData = doc.data() as AttendanceRecord;
      await doc.ref.update({
        status,
        verificationMethod: 'MANUAL',
        excuseNote: excuseNote || prevData.excuseNote || null,
        previousStatus: prevData.status,
        modifiedBy: user.email,
        modifiedAt: now,
        updatedAt: now
      });
    } else {
      await adminDb.collection('attendance_records').add({
        eventId: sessionData.eventId,
        eventTitle: sessionData.eventTitle,
        sessionId,
        userId: targetUserId,
        userName: targetUserName,
        userEmail: targetUserData.email,
        status,
        verifiedAt: now,
        verificationMethod: 'MANUAL',
        excuseNote: excuseNote || null,
        modifiedBy: user.email,
        modifiedAt: now,
        previousStatus: null,
        createdAt: now,
        updatedAt: now
      });
    }

    revalidatePath('/members/attendance');
    revalidatePath('/members/rehearsals');
    return { success: true, message: `Katılım durumu "${status}" olarak güncellendi.` };
  } catch (error) {
    return handleServerError(error, "RECORD_MANUAL_ATTENDANCE");
  }
}

/**
 * Yoklamaya henüz cevap vermemiş (NO RESPONSE) katılımcılara dürtme (Nudge) bildirimi gönderir.
 * Cooldown: 2 dakika spam koruması.
 */
export async function nudgeUnansweredParticipants(sessionId: string) {
  try {
    if (!sessionId) return { error: "Oturum ID gereklidir." };

    const { user } = await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);

    const sessionRef = adminDb.collection('attendance_sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) return { error: "Yoklama oturumu bulunamadı." };

    const sessionData = sessionDoc.data() as AttendanceSession;

    const eventDoc = await adminDb.collection('events').doc(sessionData.eventId).get();
    if (!eventDoc.exists) return { error: "Etkinlik bulunamadı." };

    const eventData = eventDoc.data() as EventItem;
    if (!canManageEvent(user, eventData)) {
      return { error: "Bu etkinlik katılımcılarına dürtme gönderme yetkiniz yoktur." };
    }

    // Cooldown kontrolü: Son dürtmeden bu yana en az 2 dakika geçmeli
    if (sessionData.lastNudgeAt) {
      const lastNudgeTime = new Date(sessionData.lastNudgeAt).getTime();
      const elapsed = Date.now() - lastNudgeTime;
      if (elapsed < 120000) { // 2 dakika
        const waitSeconds = Math.ceil((120000 - elapsed) / 1000);
        return { error: `Lütfen tekrar dürtme göndermeden önce ${waitSeconds} saniye bekleyin.` };
      }
    }

    // Katılımcı ID listesini belirle
    let participantIds: string[] = Array.isArray(eventData.participants) ? eventData.participants : [];
    if (participantIds.length === 0 && eventData.playId) {
      const playDoc = await adminDb.collection('plays').doc(eventData.playId).get();
      if (playDoc.exists && Array.isArray(playDoc.data()?.cast)) {
        participantIds = playDoc.data()!.cast.map((c: any) => c.actorId || c.id).filter(Boolean);
      }
    }

    if (participantIds.length === 0) {
      return { error: "Bu etkinliğin kayıtlı katılımcısı bulunamadı." };
    }

    // Zaten ATTENDED veya EXCUSED olanları çek
    const recordsSnap = await adminDb.collection('attendance_records')
      .where('sessionId', '==', sessionId)
      .get();

    const answeredUserIds = new Set<string>();
    recordsSnap.docs.forEach(doc => {
      const r = doc.data() as AttendanceRecord;
      if (r.status === 'ATTENDED' || r.status === 'EXCUSED') {
        answeredUserIds.add(r.userId);
        if (r.userEmail) answeredUserIds.add(r.userEmail.toLowerCase());
      }
    });

    // Yalnızca cevap vermeyen katılımcıları filtrele
    const unansweredIds = participantIds.filter(id => !answeredUserIds.has(id));

    if (unansweredIds.length === 0) {
      return { success: true, nudgedCount: 0, message: "Tüm katılımcılar zaten yoklamaya katılmış!" };
    }

    // Cevap vermeyenlere in-app notification ve push gönder
    const batch = adminDb.batch();
    const now = new Date().toISOString();

    for (const uid of unansweredIds) {
      const notifRef = adminDb.collection('notifications').doc();
      const notification: Omit<AppNotification, 'id'> = {
        userId: uid,
        type: 'ATTENDANCE_NUDGE',
        title: `⚠️ Yoklama Hatırlatması: ${eventData.title}`,
        body: `Yoklama süresi devam ediyor! Lütfen etkinlik alanındaki QR kodu okutunuz.`,
        link: `/members/attendance?session=${sessionId}`,
        eventId: eventData.id || sessionData.eventId,
        sessionId,
        isRead: false,
        createdAt: now
      };
      batch.set(notifRef, notification);
    }

    await batch.commit();

    // FCM / WebPush multicast (opsiyonel cihaz bildirimleri)
    try {
      const tokensSnap = await adminDb.collection('users')
        .where('__name__', 'in', unansweredIds.slice(0, 10))
        .get();

      const fcmTokens: string[] = [];
      tokensSnap.docs.forEach(d => {
        const uTokens = d.data().fcmTokens || [];
        fcmTokens.push(...uTokens);
      });

      if (fcmTokens.length > 0 && adminMessaging) {
        await adminMessaging.sendEachForMulticast({
          notification: {
            title: `⚠️ Yoklama Hatırlatması: ${eventData.title}`,
            body: `Yoklama devam ediyor! Lütfen etkinlik alanındaki QR kodu tarayınız.`
          },
          tokens: Array.from(new Set(fcmTokens))
        });
      }
    } catch (e) {
      console.warn("[NUDGE] Push gönderim uyarısı:", e);
    }

    await sessionRef.update({
      lastNudgeAt: now,
      updatedAt: now
    });

    return {
      success: true,
      nudgedCount: unansweredIds.length,
      message: `${unansweredIds.length} katılımcıya yoklama dürtmesi gönderildi.`
    };
  } catch (error) {
    return handleServerError(error, "NUDGE_UNANSWERED");
  }
}

/**
 * Katılımcılara yoklama başladığı bilgisini gönderen iç yardımcı fonksiyon.
 * (Kesin kural: Bu bildirim attendance oluşturmaz, sadece bilgilendirir)
 */
async function notifyParticipantsAboutAttendance(eventData: EventItem, sessionId: string, expiresAt: number) {
  try {
    let participantIds: string[] = Array.isArray(eventData.participants) ? eventData.participants : [];
    if (participantIds.length === 0 && eventData.playId) {
      const playDoc = await adminDb.collection('plays').doc(eventData.playId).get();
      if (playDoc.exists && Array.isArray(playDoc.data()?.cast)) {
        participantIds = playDoc.data()!.cast.map((c: any) => c.actorId || c.id).filter(Boolean);
      }
    }

    if (participantIds.length === 0) return;

    const batch = adminDb.batch();
    const now = new Date().toISOString();

    for (const uid of participantIds) {
      const notifRef = adminDb.collection('notifications').doc();
      const notification: Omit<AppNotification, 'id'> = {
        userId: uid,
        type: 'ATTENDANCE_STARTED',
        title: `🎭 Yoklama Başladı: ${eventData.title}`,
        body: `Etkinlik alanındaki QR kodu tarayarak yoklamanızı doğrulayabilirsiniz.`,
        link: `/members/attendance?session=${sessionId}`,
        eventId: eventData.id,
        sessionId,
        isRead: false,
        createdAt: now
      };
      batch.set(notifRef, notification);
    }

    await batch.commit();
  } catch (e) {
    console.warn("[NOTIFY_PARTICIPANTS] Bildirim oluşturma uyarısı:", e);
  }
}
