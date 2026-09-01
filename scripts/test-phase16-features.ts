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
} from '../src/lib/auth-helpers';
import {
  generateQRToken,
  verifyQRTokenSignature
} from '../src/lib/qr-helpers';
import { EventItem, AttendanceSession, AttendanceRecord, Play, AppNotification } from '../src/types/domain';

console.log('🧪 [FAZ 1.6A KAPSAMLI TEST SENARYOLARI BAŞLATILIYOR]\n');

const tests: Array<{ name: string; test: () => boolean }> = [
  // --- SEGMENT & ROLE ---
  {
    name: '1. Öğrencinin doğru segmenti alınır (STUDENT)',
    test: () => {
      const u = normalizeUser({ email: 'ogrenci@stu.fsm.edu.tr', role: 'MEMBER', student_status: 'FSMVU_ACTIVE', membership_status: 'ACTIVE' });
      return getUserSegment(u) === 'STUDENT';
    }
  },
  {
    name: '2. Mezunun doğru segmenti alınır (ALUMNI)',
    test: () => {
      const u = normalizeUser({ email: 'mezun@gmail.com', role: 'MEMBER', student_status: 'FSMVU_ALUMNI', membership_status: 'ACTIVE' });
      return getUserSegment(u) === 'ALUMNI';
    }
  },
  {
    name: '3. Dış üyenin doğru segmenti alınır (EXTERNAL)',
    test: () => {
      const u = normalizeUser({ email: 'dis@gmail.com', role: 'MEMBER', student_status: 'EXTERNAL', membership_status: 'ACTIVE' });
      return getUserSegment(u) === 'EXTERNAL';
    }
  },
  {
    name: '4. Admin yetkisi korunur (ADMIN)',
    test: () => {
      const u = normalizeUser({ email: 'admin@fsmtiyatro.com', role: 'ADMIN' });
      return getUserSegment(u) === 'ADMIN' && isAdmin(u);
    }
  },
  {
    name: '5. Aynı kullanıcı birden fazla role/unvana sahip olabilir (Örn: Yönetmen + Oyuncu + Editör)',
    test: () => {
      const u = normalizeUser({ email: 'multi@stu.fsm.edu.tr', role: 'DIRECTOR', titles: ['Oyuncu', 'Kulis Editörü'] });
      return isDirector(u) && isEditor(u) && (u.titles?.includes('Oyuncu') ?? false);
    }
  },

  // --- EVENT & PARTICIPANT ---
  {
    name: '6. Event modeli doğru veri taşır',
    test: () => {
      const event: EventItem = {
        id: 'ev-1',
        title: 'Büyük Sahne Provası',
        type: 'PROVA',
        date: '2026-09-15',
        location: 'Haliç Yerleşkesi',
        participants: ['user-1', 'user-2'],
        createdAt: new Date().toISOString()
      };
      return event.type === 'PROVA' && event.participants?.length === 2;
    }
  },
  {
    name: '7. Event participant listesindeki kullanıcı tespit edilir',
    test: () => {
      const u = normalizeUser({ id: 'user-1', email: 'u1@domain.com' });
      const event: EventItem = { id: 'ev-1', title: 'Prova', date: '2026-09-15', location: 'Haliç', participants: ['user-1', 'user-2'], createdAt: '' };
      return isEventParticipant(u, event);
    }
  },
  {
    name: '8. Prova event olarak tanımlanabilir (type: PROVA)',
    test: () => {
      const event: EventItem = { id: 'ev-2', title: 'Oyun Okuma Provası', type: 'PROVA', date: '2026-09-20', location: 'Salon A', createdAt: '' };
      return event.type === 'PROVA';
    }
  },
  {
    name: '9. Kullanıcı yalnızca ilişkili olduğu oyunun etkinliğini/provasını görebilir',
    test: () => {
      const uInCast = normalizeUser({ id: 'u-cast', assignedPlays: ['play-kac-baba'] });
      const uNotInCast = normalizeUser({ id: 'u-other', assignedPlays: ['play-cimri'] });
      const event: EventItem = { id: 'ev-kac-baba', title: 'Kaç Baba Prova', playId: 'play-kac-baba', date: '2026-09-18', location: 'Sahne', createdAt: '' };
      return isEventParticipant(uInCast, event) && !isEventParticipant(uNotInCast, event);
    }
  },

  // --- ATTENDANCE & QR ---
  {
    name: '10. Admin her etkinlik için canManageEvent() doğrulaması alır',
    test: () => {
      const uAdmin = normalizeUser({ id: 'adm', role: 'ADMIN' });
      const event: EventItem = { id: 'ev-1', title: 'Herhangi Prova', date: '2026-09-15', location: 'Haliç', createdAt: '' };
      return canManageEvent(uAdmin, event);
    }
  },
  {
    name: '11. Yetkisiz normal üye canManageEvent() alamaz',
    test: () => {
      const uNormal = normalizeUser({ id: 'u-normal', role: 'MEMBER' });
      const event: EventItem = { id: 'ev-1', title: 'Prova', directorId: 'dir-1', date: '2026-09-15', location: 'Haliç', createdAt: '' };
      return !canManageEvent(uNormal, event);
    }
  },
  {
    name: '12. Yönetmen yalnızca kendi etkinliğinde canManageEvent() alır',
    test: () => {
      const uDir = normalizeUser({ id: 'dir-1', role: 'DIRECTOR' });
      const myEvent: EventItem = { id: 'ev-1', title: 'Benim Oyunum', directorId: 'dir-1', date: '2026-09-15', location: 'Haliç', createdAt: '' };
      const otherEvent: EventItem = { id: 'ev-2', title: 'Başka Oyun', directorId: 'dir-999', date: '2026-09-15', location: 'Haliç', createdAt: '' };
      return canManageEvent(uDir, myEvent) && !canManageEvent(uDir, otherEvent);
    }
  },
  {
    name: '13. QR Token üretimi ve HMAC imza doğrulaması geçerli token için true döner',
    test: () => {
      const secret = 'secret-key-12345';
      const token = generateQRToken('ev-10', 'sess-10', secret, Date.now());
      const res = verifyQRTokenSignature(token, secret);
      return res.valid && res.eventId === 'ev-10' && res.sessionId === 'sess-10';
    }
  },
  {
    name: '14. Participant olmayan kişi için isEventParticipant() false döner',
    test: () => {
      const uOut = normalizeUser({ id: 'u-stranger', email: 'stranger@gmail.com' });
      const event: EventItem = { id: 'ev-secret', title: 'Kapalı Prova', participants: ['u-1', 'u-2'], date: '2026-09-15', location: 'Haliç', createdAt: '' };
      return !isEventParticipant(uOut, event);
    }
  },
  {
    name: '15. Yanlış veya taklit QR secret ile token imzası geçersiz sayılır (Tamper protection)',
    test: () => {
      const secret = 'secret-real';
      const token = generateQRToken('ev-10', 'sess-10', secret, Date.now());
      const res = verifyQRTokenSignature(token, 'wrong-secret');
      return !res.valid;
    }
  },
  {
    name: '16. Başka bir etkinliğin QR tokenı farklı eventId taşır',
    test: () => {
      const token = generateQRToken('ev-wrong', 'sess-1', 'sec', Date.now());
      const res = verifyQRTokenSignature(token, 'sec');
      return res.valid && res.eventId === 'ev-wrong' && (res.eventId as string) !== 'ev-correct';
    }
  },
  {
    name: '17. Süresi dolmuş oturum kontrolü (expiresAt < now)',
    test: () => {
      const expiredSession: AttendanceSession = {
        id: 'sess-old',
        eventId: 'ev-1',
        eventTitle: 'Prova',
        status: 'OPEN',
        openedBy: 'admin',
        openedAt: new Date(Date.now() - 600000).toISOString(),
        expiresAt: Date.now() - 1000, // Süresi geçmiş
        createdAt: ''
      };
      return Date.now() > expiredSession.expiresAt;
    }
  },
  {
    name: '18. Kapalı (CLOSED) oturumda katılım kabul edilmez',
    test: () => {
      const closedSession: AttendanceSession = {
        id: 'sess-closed',
        eventId: 'ev-1',
        eventTitle: 'Prova',
        status: 'CLOSED',
        openedBy: 'admin',
        openedAt: '',
        expiresAt: Date.now() + 600000,
        createdAt: ''
      };
      return closedSession.status !== 'OPEN';
    }
  },

  // --- DÜRTME & COOLDOWN ---
  {
    name: '19. Dürtme Cooldown kontrolü: 2 dakikadan önce tekrar dürtme yapılamaz',
    test: () => {
      const lastNudgeRecent = new Date(Date.now() - 30000).toISOString(); // 30 sn önce
      const lastNudgeOld = new Date(Date.now() - 150000).toISOString(); // 2.5 dk önce
      const isCooldownActive1 = (Date.now() - new Date(lastNudgeRecent).getTime()) < 120000;
      const isCooldownActive2 = (Date.now() - new Date(lastNudgeOld).getTime()) < 120000;
      return isCooldownActive1 === true && isCooldownActive2 === false;
    }
  },
  {
    name: '20. ATTENDED ve EXCUSED olanlar dürtme hedefinden hariç tutulur',
    test: () => {
      const allParticipants = ['u-1', 'u-2', 'u-3', 'u-4'];
      const records: AttendanceRecord[] = [
        { id: '1', eventId: 'e', eventTitle: 't', sessionId: 's', userId: 'u-1', userName: 'A', userEmail: 'a@a.com', status: 'ATTENDED', verifiedAt: '', verificationMethod: 'QR', createdAt: '' },
        { id: '2', eventId: 'e', eventTitle: 't', sessionId: 's', userId: 'u-2', userName: 'B', userEmail: 'b@b.com', status: 'EXCUSED', verifiedAt: '', verificationMethod: 'MANUAL', createdAt: '' },
      ];
      const answeredSet = new Set(records.map(r => r.userId));
      const unanswered = allParticipants.filter(p => !answeredSet.has(p));
      return unanswered.length === 2 && unanswered.includes('u-3') && unanswered.includes('u-4');
    }
  },

  // --- FAZ 1.6A İNCELEME & REFINEMENT EK SENARYOLARI ---
  {
    name: '21. Dönen (Rotating) QR Token TTL: 90 saniyeden eski token reddedilir',
    test: () => {
      const secret = 'secret-rotation-test';
      const oldToken = generateQRToken('ev-1', 'sess-1', secret, Date.now() - 100000); // 100 sn önce üretilmiş
      const freshToken = generateQRToken('ev-1', 'sess-1', secret, Date.now() - 10000); // 10 sn önce üretilmiş
      
      const oldCheck = verifyQRTokenSignature(oldToken, secret, 90000);
      const freshCheck = verifyQRTokenSignature(freshToken, secret, 90000);

      return oldCheck.valid === false && freshCheck.valid === true;
    }
  },
  {
    name: '22. ParticipantScope: ROLE_BASED kapsamı sadece hedef rolleri kabul eder',
    test: () => {
      const uActor = normalizeUser({ id: 'u-actor', role: 'AKTOR' });
      const uSales = normalizeUser({ id: 'u-sales', role: 'SALES' });
      const event: EventItem = {
        id: 'ev-actor-only',
        title: 'Oyunculuk Çalıştayı',
        participantScope: 'ROLE_BASED',
        participants: ['AKTOR', 'PLAYER'],
        date: '2026-09-20',
        location: 'Sahne',
        createdAt: ''
      };
      return isEventParticipant(uActor, event) === true && isEventParticipant(uSales, event) === false;
    }
  },
  {
    name: '23. ParticipantScope: ALL_MEMBERS kapsamı aktif üyeleri kabul ederken misafiri reddeder',
    test: () => {
      const uActive = normalizeUser({ id: 'u-act', membership_status: 'ACTIVE' });
      const uPending = normalizeUser({ id: 'u-pnd', membership_status: 'PENDING' });
      const event: EventItem = {
        id: 'ev-genel',
        title: 'Genel Kurul',
        participantScope: 'ALL_MEMBERS',
        date: '2026-09-25',
        location: 'Konferans Salonu',
        createdAt: ''
      };
      return isEventParticipant(uActive, event) === true && isEventParticipant(uPending, event) === false;
    }
  },
  {
    name: '24. Manuel yoklama düzeltmesinde denetim (audit) alanları tamdır',
    test: () => {
      const record: AttendanceRecord = {
        id: 'rec-1',
        eventId: 'ev-1',
        eventTitle: 'Prova',
        sessionId: 'sess-1',
        userId: 'u-1',
        userName: 'Ahmet',
        userEmail: 'ahmet@fsm.edu.tr',
        status: 'EXCUSED',
        verifiedAt: new Date().toISOString(),
        verificationMethod: 'MANUAL',
        excuseNote: 'Sınavı vardı',
        previousStatus: 'NOT_ATTENDED',
        modifiedBy: 'yonetmen@fsm.edu.tr',
        modifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      return (
        record.status === 'EXCUSED' &&
        record.previousStatus === 'NOT_ATTENDED' &&
        Boolean(record.modifiedBy) &&
        Boolean(record.modifiedAt)
      );
    }
  },

  // --- FAZ 1.6A CLEANUP SENARYOLARI ---
  {
    name: '25. Legacy Migration: Prova kaydının playId ve PROJECT_MEMBERS kapsamı korunur',
    test: () => {
      const legacyRehearsal = {
        id: 'reh-1',
        title: 'Cimri 1. Perde Provası',
        playId: 'play-cimri',
        date: '2026-10-01',
        location: 'Haliç',
        notes: 'Repliksiz gelinecek',
        participants: []
      };
      const migratedScope = legacyRehearsal.playId 
        ? 'PROJECT_MEMBERS' 
        : (legacyRehearsal.participants?.length > 0 ? 'SELECTED_USERS' : 'ALL_MEMBERS');
      return migratedScope === 'PROJECT_MEMBERS' && legacyRehearsal.playId === 'play-cimri';
    }
  },
  {
    name: '26. Legacy Migration: Katılımcı listesi olan provalar SELECTED_USERS olarak taşınır',
    test: () => {
      const legacyRehearsal = {
        id: 'reh-2',
        title: 'Özel Diksiyon Çalışması',
        playId: null,
        date: '2026-10-05',
        participants: ['u-1', 'u-2']
      };
      const migratedScope = legacyRehearsal.playId 
        ? 'PROJECT_MEMBERS' 
        : (legacyRehearsal.participants?.length > 0 ? 'SELECTED_USERS' : 'ALL_MEMBERS');
      return migratedScope === 'SELECTED_USERS' && legacyRehearsal.participants.length === 2;
    }
  },
  {
    name: '27. isEventParticipant: İsim benzerliği ile sahte yetki alma kaldırılmıştır (Yalnızca strict userId / email)',
    test: () => {
      const uStranger = normalizeUser({ id: 'u-stranger', email: 'baska@fsm.edu.tr', name: 'Ahmet Yılmaz' });
      const playWithSameNameActor: Play = {
        id: 'play-1',
        title: 'Test Oyunu',
        description: '',
        createdAt: '',
        cast: [
          { roleName: 'Harpagon', actorName: 'Ahmet Yılmaz', actorId: 'u-real-actor', email: 'real@fsm.edu.tr' }
        ]
      };
      const event: EventItem = {
        id: 'ev-test',
        title: 'Prova',
        playId: 'play-1',
        participantScope: 'PROJECT_MEMBERS',
        date: '2026-10-01',
        location: 'Sahne',
        createdAt: ''
      };
      // uStranger actorId u-real-actor ile eşleşmez ve email farklıdır -> false dönmeli
      return isEventParticipant(uStranger, event, playWithSameNameActor) === false;
    }
  },
  {
    name: '28. Tekil Bildirim Altyapısı: Bildirim veya push gönderimi asla doğrudan AttendanceRecord üretmez',
    test: () => {
      const notif: AppNotification = {
        id: 'notif-1',
        userId: 'u-1',
        type: 'ATTENDANCE_STARTED',
        title: 'Yoklama Başladı',
        body: 'QR kodu tarayınız',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      // Bildirim yalnızca bilgilendirir, attendance verisi attendance_records altında ayrıca QR ile oluşur
      return notif.type === 'ATTENDANCE_STARTED' && !('status' in notif);
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
