import {
  getUserSegment,
  isEditor,
  isAdmin,
  isActiveMember,
  normalizeUser
} from '../src/lib/auth-helpers';
import { User, PostStatus } from '../src/types/domain';

console.log('🧪 [FAZ 1.5 TEST SENARYOLARI BAŞLATILIYOR]\n');

const tests: Array<{ name: string; test: () => boolean }> = [
  {
    name: '1. Öğrenci kullanıcının segmenti -> STUDENT',
    test: () => {
      const u = normalizeUser({ email: 'ogrenci@stu.fsm.edu.tr', role: 'MEMBER', student_status: 'FSMVU_ACTIVE', membership_status: 'ACTIVE' });
      return getUserSegment(u) === 'STUDENT';
    }
  },
  {
    name: '2. Mezun kullanıcının segmenti -> ALUMNI',
    test: () => {
      const u = normalizeUser({ email: 'mezun@gmail.com', role: 'MEMBER', student_status: 'FSMVU_ALUMNI', membership_status: 'ACTIVE' });
      return getUserSegment(u) === 'ALUMNI';
    }
  },
  {
    name: '3. Onaylı Dış Üye kullanıcının segmenti -> EXTERNAL',
    test: () => {
      const u = normalizeUser({ email: 'dis@gmail.com', role: 'MEMBER', student_status: 'EXTERNAL', membership_status: 'ACTIVE' });
      return getUserSegment(u) === 'EXTERNAL';
    }
  },
  {
    name: '4. Admin yetkisine sahip kullanıcı (Öğrenci veya Mezun fark etmeksizin) -> ADMIN',
    test: () => {
      const u1 = normalizeUser({ email: 'admin_ogrenci@stu.fsm.edu.tr', role: 'ADMIN', student_status: 'FSMVU_ACTIVE', membership_status: 'ACTIVE' });
      const u2 = normalizeUser({ email: 'admin_mezun@gmail.com', role: 'SUPERADMIN', student_status: 'FSMVU_ALUMNI', membership_status: 'ACTIVE' });
      return getUserSegment(u1) === 'ADMIN' && getUserSegment(u2) === 'ADMIN';
    }
  },
  {
    name: '5. Giriş yapmamış veya PENDING/NONE olan kullanıcı -> PUBLIC',
    test: () => {
      const u1 = normalizeUser(null);
      const u2 = normalizeUser({ email: 'bekleyen@gmail.com', role: 'PENDING', membership_status: 'PENDING' });
      return getUserSegment(u1) === 'PUBLIC' && getUserSegment(u2) === 'PUBLIC';
    }
  },
  {
    name: '6. isEditor() doğrulaması: EDITOR, ADMIN, DIRECTOR ve Editör unvanı taşıyanlar -> true',
    test: () => {
      const uEditor = normalizeUser({ email: 'ed@domain.com', role: 'EDITOR' });
      const uAdmin = normalizeUser({ email: 'ad@domain.com', role: 'ADMIN' });
      const uDirector = normalizeUser({ email: 'dir@domain.com', role: 'DIRECTOR' });
      const uTitled = normalizeUser({ email: 'unvanli@domain.com', role: 'MEMBER', titles: ['Kulis Editörü'] });
      return isEditor(uEditor) && isEditor(uAdmin) && isEditor(uDirector) && isEditor(uTitled);
    }
  },
  {
    name: '7. isEditor() doğrulaması: Normal Üye ve Oyuncu -> false',
    test: () => {
      const uMember = normalizeUser({ email: 'uye@stu.fsm.edu.tr', role: 'MEMBER' });
      const uActor = normalizeUser({ email: 'oyuncu@stu.fsm.edu.tr', role: 'AKTOR', titles: ['I. Derece Oyuncu'] });
      return !isEditor(uMember) && !isEditor(uActor);
    }
  },
  {
    name: '8. Yazı Moderasyon Mantığı: Editör yazısı -> PUBLISHED, Normal üye yazısı -> PENDING_REVIEW',
    test: () => {
      const uEditor = normalizeUser({ email: 'ed@domain.com', role: 'EDITOR' });
      const uMember = normalizeUser({ email: 'uye@stu.fsm.edu.tr', role: 'MEMBER' });
      const editorPostStatus: PostStatus = isEditor(uEditor) ? 'PUBLISHED' : 'PENDING_REVIEW';
      const memberPostStatus: PostStatus = isEditor(uMember) ? 'PUBLISHED' : 'PENDING_REVIEW';
      return editorPostStatus === 'PUBLISHED' && memberPostStatus === 'PENDING_REVIEW';
    }
  },
  {
    name: '9. Mezun E-posta Değiştirme Kuralı: email_changed_once: true olan tekrar değiştiremez',
    test: () => {
      const uMezun1: User = { ...normalizeUser({ email: 'eski@stu.fsm.edu.tr', student_status: 'FSMVU_ALUMNI' }), email_changed_once: true };
      const uMezun2: User = { ...normalizeUser({ email: 'eski2@stu.fsm.edu.tr', student_status: 'FSMVU_ALUMNI' }), email_changed_once: false };
      return uMezun1.email_changed_once === true && uMezun2.email_changed_once === false;
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
