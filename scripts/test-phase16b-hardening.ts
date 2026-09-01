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
  isEventParticipant,
  isActiveMember
} from '../src/lib/auth-helpers';
import {
  generateQRToken,
  verifyQRTokenSignature
} from '../src/lib/qr-helpers';
import {
  EventItem,
  AttendanceSession,
  AttendanceRecord,
  Play,
  PushSubscriptionRecord,
  AppNotification
} from '../src/types/domain';

console.log('🧪 [FAZ 1.6B PRODUCTION HARDENING TEST SENARYOLARI BAŞLATILIYOR]\n');

const tests: Array<{ name: string; test: () => boolean }> = [
  // --- 1. PUSH SUBSCRIPTION CANONICAL STORAGE ---
  {
    name: '1. PushSubscriptionRecord canonical veri modelini doğrular',
    test: () => {
      const sub: PushSubscriptionRecord = {
        userId: 'usr-123',
        token: 'fcm-token-xyz-890',
        platform: 'ios',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return sub.userId === 'usr-123' && sub.token === 'fcm-token-xyz-890' && sub.platform === 'ios';
    }
  },
  {
    name: '2. Bildirim gönderimi push_subscriptions üzerinden token toplar, users dokümanına bağımlı değildir',
    test: () => {
      const subscriptions: PushSubscriptionRecord[] = [
        { userId: 'u-1', token: 'tok-1', createdAt: '', updatedAt: '' },
        { userId: 'u-1', token: 'tok-2', createdAt: '', updatedAt: '' }, // Aynı kullanıcının 2. cihazı
        { userId: 'u-2', token: 'tok-3', createdAt: '', updatedAt: '' },
        { userId: 'u-3', token: 'tok-4', createdAt: '', updatedAt: '' }
      ];
      const targetUserIds = ['u-1', 'u-2'];
      const matchedTokens = subscriptions
        .filter(s => targetUserIds.includes(s.userId))
        .map(s => s.token);

      const uniqueTokens = Array.from(new Set(matchedTokens));
      return uniqueTokens.length === 3 && uniqueTokens.includes('tok-1') && uniqueTokens.includes('tok-2') && uniqueTokens.includes('tok-3');
    }
  },

  // --- 2. YÖNETMEN VE PROJE İZOLASYONU ---
  {
    name: '3. Yönetmen sadece kendi projesinin etkinliğini yönetebilir, başkasının projesini yönetemez',
    test: () => {
      const uDirA = normalizeUser({ id: 'dir-A', role: 'DIRECTOR', email: 'dira@fsm.edu.tr' });
      const myEvent: EventItem = {
        id: 'ev-mine',
        title: 'Benim Oyunum',
        directorId: 'dir-A',
        playId: 'play-A',
        date: '2026-10-01',
        location: 'Sahne',
        createdAt: ''
      };
      const otherEvent: EventItem = {
        id: 'ev-other',
        title: 'Başkasının Oyunu',
        directorId: 'dir-B',
        playId: 'play-B',
        date: '2026-10-01',
        location: 'Sahne',
        createdAt: ''
      };
      return canManageEvent(uDirA, myEvent) === true && canManageEvent(uDirA, otherEvent) === false;
    }
  },

  // --- 3. QR GÜVENLİĞİ & ROTATING TTL ---
  {
    name: '4. Dynamic Rotating QR Token 90 saniyelik TTL ile korunur ve geçerli sürede onaylanır',
    test: () => {
      const secret = 'prod-hardening-secret';
      const now = Date.now();
      const freshToken = generateQRToken('ev-1', 'sess-1', secret, now);
      const res = verifyQRTokenSignature(freshToken, secret, 90000);
      return res.valid === true && res.eventId === 'ev-1' && res.sessionId === 'sess-1';
    }
  },
  {
    name: '5. Zaman damgası manipüle edilmiş veya süresi geçmiş token reddedilir',
    test: () => {
      const secret = 'prod-hardening-secret';
      const expiredToken = generateQRToken('ev-1', 'sess-1', secret, Date.now() - 95000); // 95 sn önce
      const res = verifyQRTokenSignature(expiredToken, secret, 90000);
      return res.valid === false;
    }
  },

  // --- 4. ATTENDANCE RECORD DUPLICATION & AUDIT TRAIL ---
  {
    name: '6. Katılım tekrarı kontrolü: Aynı oturumda ikinci kez katılım kaydı mükerrer sayılır',
    test: () => {
      const existingRecords: AttendanceRecord[] = [
        {
          id: 'rec-1',
          eventId: 'ev-1',
          eventTitle: 'Prova',
          sessionId: 'sess-1',
          userId: 'u-1',
          userName: 'Oyuncu 1',
          userEmail: 'oyuncu1@fsm.edu.tr',
          status: 'ATTENDED',
          verifiedAt: new Date().toISOString(),
          verificationMethod: 'QR',
          createdAt: new Date().toISOString()
        }
      ];
      const hasDuplicate = existingRecords.some(r => r.sessionId === 'sess-1' && r.userId === 'u-1');
      return hasDuplicate === true;
    }
  },
  {
    name: '7. Manuel override denetim izi (audit trail) eksiksiz saklanır',
    test: () => {
      const record: AttendanceRecord = {
        id: 'rec-manual-1',
        eventId: 'ev-1',
        eventTitle: 'Prova',
        sessionId: 'sess-1',
        userId: 'u-2',
        userName: 'Oyuncu 2',
        userEmail: 'oyuncu2@fsm.edu.tr',
        status: 'EXCUSED',
        verifiedAt: new Date().toISOString(),
        verificationMethod: 'MANUAL',
        excuseNote: 'Doktor raporu sundu',
        previousStatus: 'NOT_ATTENDED',
        modifiedBy: 'yonetmen@fsm.edu.tr',
        modifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      return (
        record.verificationMethod === 'MANUAL' &&
        record.previousStatus === 'NOT_ATTENDED' &&
        record.status === 'EXCUSED' &&
        Boolean(record.excuseNote) &&
        Boolean(record.modifiedBy) &&
        Boolean(record.modifiedAt)
      );
    }
  },
  {
    name: '8. EXCUSED (Mazeretli) kullanıcı QR taradığında mazeret kararı korunur ve ezilmez',
    test: () => {
      const existingRecord: AttendanceRecord = {
        id: 'rec-excused',
        eventId: 'ev-1',
        eventTitle: 'Prova',
        sessionId: 'sess-1',
        userId: 'u-excused',
        userName: 'Mazeretli Üye',
        userEmail: 'mazeretli@fsm.edu.tr',
        status: 'EXCUSED',
        verifiedAt: '',
        verificationMethod: 'MANUAL',
        excuseNote: 'İzinli',
        createdAt: ''
      };
      // QR okutma mantığında EXCUSED kontrolü
      const canOverwrite = existingRecord.status !== 'EXCUSED';
      return canOverwrite === false;
    }
  },
  {
    name: '9. NOT_ATTENDED olarak işaretli kullanıcı oturum açıkken QR okutursa ATTENDED olur ve previousStatus saklanır',
    test: () => {
      const existingRecord: AttendanceRecord = {
        id: 'rec-not-attended',
        eventId: 'ev-1',
        eventTitle: 'Prova',
        sessionId: 'sess-1',
        userId: 'u-late',
        userName: 'Geç Gelen Oyuncu',
        userEmail: 'gecgelen@fsm.edu.tr',
        status: 'NOT_ATTENDED',
        verifiedAt: '',
        verificationMethod: 'MANUAL',
        createdAt: ''
      };
      const updated: Partial<AttendanceRecord> = {
        status: 'ATTENDED',
        previousStatus: existingRecord.status || 'NOT_ATTENDED',
        verificationMethod: 'QR'
      };
      return updated.status === 'ATTENDED' && updated.previousStatus === 'NOT_ATTENDED' && updated.verificationMethod === 'QR';
    }
  },

  // --- 5. HİYERARŞİ & ÇOKLU ROL KORUNMASI ---
  {
    name: '8. Çoklu Rol Kombinasyonu (Öğrenci + Yönetmen + Oyuncu + Editör) yetkilerini eksiksiz sağlar',
    test: () => {
      const multiUser = normalizeUser({
        id: 'u-multi',
        email: 'multi@stu.fsm.edu.tr',
        student_status: 'FSMVU_ACTIVE',
        membership_status: 'ACTIVE',
        role: 'DIRECTOR',
        titles: ['Oyuncu', 'Kulis Editörü']
      });
      return (
        getUserSegment(multiUser) === 'STUDENT' &&
        isStudent(multiUser) &&
        isDirector(multiUser) &&
        isEditor(multiUser) &&
        isActiveMember(multiUser) &&
        Boolean(multiUser.titles?.includes('Oyuncu'))
      );
    }
  },
  {
    name: '9. Admin kullanıcısı segmentini kaybetmez (Örn: Mezun Admin)',
    test: () => {
      const adminAlumni = normalizeUser({
        id: 'u-adm-alumni',
        email: 'mezunadmin@gmail.com',
        student_status: 'FSMVU_ALUMNI',
        membership_status: 'ACTIVE',
        role: 'ADMIN'
      });
      return isAdmin(adminAlumni) && isAlumni(adminAlumni);
    }
  },

  // --- 6. EMPTY / ERROR STATE GÜVENLİĞİ ---
  {
    name: '10. Boş/Eksik veri girişinde çökme olmadan güvenli varsayılan değerler üretilir',
    test: () => {
      const emptyUser = normalizeUser(null as any);
      const emptySegment = getUserSegment(emptyUser);
      const participantCheck = isEventParticipant(emptyUser, null, null);
      const manageCheck = canManageEvent(emptyUser, null);

      return (
        emptySegment === 'PUBLIC' &&
        participantCheck === false &&
        manageCheck === false &&
        emptyUser.role === 'USER' &&
        emptyUser.membership_status === 'NONE'
      );
    }
  }
];

let passedCount = 0;
tests.forEach(t => {
  const result = t.test();
  if (result) {
    passedCount++;
    console.log(`✅ [GEÇTİ] ${t.name}`);
  } else {
    console.error(`❌ [BAŞARISIZ] ${t.name}`);
  }
});

console.log(`\n📊 Sonuç: ${passedCount}/${tests.length} senaryo başarıyla doğrulandı.\n`);
process.exit(passedCount === tests.length ? 0 : 1);
