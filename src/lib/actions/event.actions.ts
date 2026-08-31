'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { requireAuth, handleServerError } from './common';
import { canManageEvent, isEventParticipant, isAdmin } from '@/lib/auth-helpers';
import { EventItem, EventType, ParticipantScope } from '@/types/domain';

/**
 * Yeni bir Etkinlik veya Prova oluşturur.
 * (Prova, Temsil, Workshop, Toplantı, Okuma vb. tek bir Event altyapısını paylaşır)
 */
export async function createEvent(formData: FormData) {
  try {
    const title = (formData.get('title') as string)?.trim();
    const rawDate = (formData.get('date') as string) || '';
    const eventDate = (formData.get('eventDate') as string) || '';
    const eventTime = (formData.get('eventTime') as string) || '';
    const location = ((formData.get('location') as string) || 'Haliç Yerleşkesi').trim();
    const description = ((formData.get('description') as string) || '').trim();
    const type = ((formData.get('type') as EventType) || 'PROVA').trim();
    const playId = (formData.get('playId') as string) || null;
    const playTitle = (formData.get('playTitle') as string) || null;
    const notes = ((formData.get('notes') as string) || '').trim();
    const explicitScope = formData.get('participantScope') as ParticipantScope;
    
    // Biletleme alanları
    const isTicketed = formData.get('isTicketed') === 'true' || formData.get('isTicketed') === 'on';
    const ticketQuotaRaw = formData.get('ticketQuota') as string;
    const ticketQuota = isTicketed && ticketQuotaRaw ? Math.max(1, parseInt(ticketQuotaRaw, 10)) : 0;

    // Katılımcı ID'leri
    const participantsRaw = formData.get('participants') as string;
    let participants: string[] = [];
    if (participantsRaw) {
      try {
        const parsed = JSON.parse(participantsRaw);
        if (Array.isArray(parsed)) participants = parsed;
      } catch {
        participants = participantsRaw.split(',').map(p => p.trim()).filter(Boolean);
      }
    }

    const dateTimeStr = rawDate.trim() || (eventDate && eventTime ? `${eventDate} - ${eventTime}` : eventDate || 'Tarih Belirtilmedi');

    if (!title || !dateTimeStr) {
      return { error: "Etkinlik adı ve tarihi zorunludur." };
    }

    const { user, uid } = await requireAuth([
      'SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR'
    ]);

    // Eğer kullanıcı yönetmen ise, sadece kendi projesine etkinlik/prova açabilir
    let responsibleDirectorId = uid;
    if (playId) {
      const playDoc = await adminDb.collection('plays').doc(playId).get();
      if (playDoc.exists) {
        const playData = playDoc.data()!;
        if (!isAdmin(user) && !canManageEvent(user, { playId, directorId: playData.directorId })) {
          return { error: "Yalnızca sorumlu olduğunuz oyuna prova/etkinlik ekleyebilirsiniz." };
        }
        responsibleDirectorId = playData.directorId || uid;
        
        // Eğer katılımcı listesi verilmemişse, oyunun kadrosundan otomatik al
        if (participants.length === 0 && Array.isArray(playData.cast)) {
          participants = playData.cast.map((c: any) => c.actorId || c.userId || c.email).filter(Boolean);
        }
      }
    }

    const participantScope: ParticipantScope = explicitScope || (playId ? 'PROJECT_MEMBERS' : (participants.length > 0 ? 'SELECTED_USERS' : 'ALL_MEMBERS'));

    const newEvent: Omit<EventItem, 'id'> = {
      title,
      type,
      participantScope,
      date: dateTimeStr,
      time: eventTime || undefined,
      location,
      description,
      playId,
      playTitle,
      directorId: responsibleDirectorId,
      participants: Array.from(new Set(participants)),
      isTicketed: Boolean(isTicketed),
      ticketQuota,
      reservedCount: 0,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('events').add(newEvent);

    revalidatePath('/etkinlikler');
    revalidatePath('/members/rehearsals');
    revalidatePath('/members');
    revalidatePath('/tanerabi/dashboard');

    return { success: true, eventId: docRef.id };
  } catch (error) {
    return handleServerError(error, "CREATE_EVENT");
  }
}

/**
 * Etkinliği siler
 */
export async function deleteUnifiedEvent(formData: FormData) {
  try {
    const eventId = formData.get('eventId') as string;
    if (!eventId) return { error: "Etkinlik ID gereklidir." };

    const { user } = await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);

    const eventDoc = await adminDb.collection('events').doc(eventId).get();
    if (!eventDoc.exists) return { error: "Etkinlik bulunamadı." };

    const eventData = eventDoc.data() as EventItem;
    if (!canManageEvent(user, eventData)) {
      return { error: "Bu etkinliği silme yetkiniz bulunmamaktadır." };
    }

    await adminDb.collection('events').doc(eventId).delete();

    // Varsa ilgili attendance_sessions ve eventReservations kayıtlarını da temizle
    const sessionsSnap = await adminDb.collection('attendance_sessions').where('eventId', '==', eventId).get();
    if (!sessionsSnap.empty) {
      const batch = adminDb.batch();
      sessionsSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    revalidatePath('/etkinlikler');
    revalidatePath('/members/rehearsals');
    revalidatePath('/members');
    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "DELETE_EVENT");
  }
}

/**
 * Kullanıcıyla ilişkili olan tüm etkinlik ve provaları getirir.
 * (Kullanıcı yalnızca kadrosunda/katılımcısı olduğu veya yönettiği etkinlikleri görür)
 */
export async function getUserRelatedEvents(userId: string, userEmail: string): Promise<EventItem[]> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : { id: userId, email: userEmail };

    const eventsSnap = await adminDb.collection('events').orderBy('createdAt', 'desc').get();
    const allEvents: EventItem[] = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventItem));

    // Admin ise tüm etkinlikleri görür
    if (isAdmin(userData)) {
      return allEvents;
    }

    // Oyun bilgilerini önbelleğe al
    const playsSnap = await adminDb.collection('plays').get();
    const playsMap = new Map<string, any>();
    playsSnap.docs.forEach(d => playsMap.set(d.id, d.data()));

    // Kullanıcıya göre filtrele
    return allEvents.filter(ev => {
      const play = ev.playId ? playsMap.get(ev.playId) : null;
      return canManageEvent(userData, ev) || isEventParticipant(userData, ev, play);
    });
  } catch (error) {
    console.error("[GET_USER_RELATED_EVENTS] Hata:", error);
    return [];
  }
}

/**
 * Mevcut legacy `rehearsals` koleksiyonundaki kayıtları `events` koleksiyonuna taşıyan idempotent migration
 */
export async function migrateLegacyRehearsalsToEvents(): Promise<{ migratedCount: number; alreadyMigrated: number }> {
  const rehearsalsSnap = await adminDb.collection('rehearsals').get();
  let migratedCount = 0;
  let alreadyMigrated = 0;

  for (const rDoc of rehearsalsSnap.docs) {
    const rData = rDoc.data();
    // Zaten events altında aynı ID veya aynı başlık + tarih var mı?
    const existing = await adminDb.collection('events')
      .where('title', '==', rData.title)
      .where('date', '==', rData.date)
      .limit(1)
      .get();

    if (!existing.empty) {
      alreadyMigrated++;
      continue;
    }

    const playId = rData.playId || null;
    const participants = Array.isArray(rData.participants) ? rData.participants : [];
    const participantScope: ParticipantScope = playId 
      ? 'PROJECT_MEMBERS' 
      : (participants.length > 0 ? 'SELECTED_USERS' : 'ALL_MEMBERS');

    await adminDb.collection('events').doc(rDoc.id).set({
      title: rData.title,
      type: 'PROVA',
      participantScope,
      date: rData.date || 'Tarih Belirtilmedi',
      location: rData.location || 'Haliç Yerleşkesi',
      notes: rData.notes || '',
      description: rData.description || rData.notes || '',
      playId,
      directorId: rData.directorId || rData.pulseStartedBy || null,
      participants,
      createdAt: rData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    migratedCount++;
  }

  return { migratedCount, alreadyMigrated };
}
