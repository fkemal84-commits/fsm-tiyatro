import { adminDb } from '@/lib/firebase-admin';
import {
  normalizeUser,
  getUserSegment,
  isAdmin,
  isEditor,
  isDirector,
  isStudent,
  isAlumni,
  isExternalMember,
  canManageEvent,
  isEventParticipant
} from '@/lib/auth-helpers';
import {
  User,
  UserSegment,
  Play,
  EventItem,
  AttendanceSession,
  AttendanceRecord,
  AppNotification,
  Post
} from '@/types/domain';

export interface MemberDashboardData {
  user: User;
  segment: UserSegment;
  roles: string[];
  activePlays: Play[];
  directedPlays: Play[];
  relatedEvents: EventItem[];
  activeAttendanceSessions: AttendanceSession[];
  userAttendanceRecords: AttendanceRecord[];
  unreadNotifications: AppNotification[];
  pendingPostsForReview: Post[];
  flags: {
    isAdmin: boolean;
    isEditor: boolean;
    isDirector: boolean;
    isStudent: boolean;
    isAlumni: boolean;
    isExternalMember: boolean;
  };
}

/**
 * Kullanıcı kimliği veya e-postasına göre kişiselleştirilmiş pano verisi sağlar.
 */
export async function getMemberDashboardData(userIdentifier: string): Promise<MemberDashboardData | null> {
  try {
    if (!userIdentifier) return null;

    // 1. Kullanıcı kaydını bul
    let userDoc = await adminDb.collection('users').doc(userIdentifier).get();
    if (!userDoc.exists) {
      const byEmail = await adminDb.collection('users').where('email', '==', userIdentifier.toLowerCase()).limit(1).get();
      if (!byEmail.empty) {
        userDoc = byEmail.docs[0];
      } else {
        return null;
      }
    }

    const rawUserData = userDoc.data()!;
    const user = normalizeUser({ id: userDoc.id, ...rawUserData });
    const segment = getUserSegment(user);

    const userIsAdmin = isAdmin(user);
    const userIsEditor = isEditor(user);
    const userIsDirector = isDirector(user);
    const userIsStudent = isStudent(user);
    const userIsAlumni = isAlumni(user);
    const userIsExternal = isExternalMember(user);

    // 2. Oyunları getir (Paralel sorgular)
    const playsSnap = await adminDb.collection('plays').get();
    const allPlays: Play[] = playsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Play));

    const activePlays = allPlays.filter(play => {
      if (user.assignedPlays?.includes(play.id)) return true;
      if (Array.isArray(play.cast)) {
        return play.cast.some(c => 
          (c.actorId && c.actorId === user.id) || 
          (c.userId && c.userId === user.id) ||
          (c.email && c.email.toLowerCase() === user.email.toLowerCase())
        );
      }
      return false;
    });

    const directedPlays = allPlays.filter(play => {
      return (
        (play.directorId && play.directorId === user.id) ||
        (play.directorId && play.directorId === user.email.toLowerCase())
      );
    });

    // 3. Etkinlikler ve Provaları filtrele
    const eventsSnap = await adminDb.collection('events').orderBy('createdAt', 'desc').limit(50).get();
    const allEvents: EventItem[] = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem));

    const relatedEvents = allEvents.filter(ev => {
      if (userIsAdmin) return true;
      const play = ev.playId ? allPlays.find(p => p.id === ev.playId) : null;
      return canManageEvent(user, ev) || isEventParticipant(user, ev, play);
    });

    // 4. Aktif Yoklama Oturumları (Kullanıcının ilişkili olduğu açık oturumlar)
    const now = Date.now();
    const sessionsSnap = await adminDb.collection('attendance_sessions')
      .where('status', '==', 'OPEN')
      .get();

    const activeAttendanceSessions = sessionsSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as AttendanceSession))
      .filter(s => s.expiresAt > now)
      .filter(s => {
        if (userIsAdmin) return true;
        const ev = allEvents.find(e => e.id === s.eventId);
        if (!ev) return false;
        const play = ev.playId ? allPlays.find(p => p.id === ev.playId) : null;
        return canManageEvent(user, ev) || isEventParticipant(user, ev, play);
      });

    // 5. Kullanıcının son katılım kayıtları
    const recordsSnap = await adminDb.collection('attendance_records')
      .where('userId', '==', user.id)
      .orderBy('verifiedAt', 'desc')
      .limit(10)
      .get();

    const userAttendanceRecords = recordsSnap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));

    // 6. Okunmamış Bildirimler
    const notifsSnap = await adminDb.collection('notifications')
      .where('userId', '==', user.id)
      .where('isRead', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const unreadNotifications = notifsSnap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));

    // 7. Editör için onay bekleyen yazılar
    let pendingPostsForReview: Post[] = [];
    if (userIsEditor) {
      const postsSnap = await adminDb.collection('posts')
        .where('status', '==', 'PENDING_REVIEW')
        .limit(10)
        .get();
      pendingPostsForReview = postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
    }

    return {
      user,
      segment,
      roles: Array.from(new Set([user.role, ...(user.titles || [])])),
      activePlays,
      directedPlays,
      relatedEvents,
      activeAttendanceSessions,
      userAttendanceRecords,
      unreadNotifications,
      pendingPostsForReview,
      flags: {
        isAdmin: userIsAdmin,
        isEditor: userIsEditor,
        isDirector: userIsDirector,
        isStudent: userIsStudent,
        isAlumni: userIsAlumni,
        isExternalMember: userIsExternal
      }
    };
  } catch (error) {
    console.error("[GET_MEMBER_DASHBOARD_DATA] Hata:", error);
    return null;
  }
}
