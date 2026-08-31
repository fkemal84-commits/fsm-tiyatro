import {
  normalizeUser,
  inferStudentStatusFromEmail,
  inferMembershipStatusFromLegacyRole,
  isAdmin,
  isActiveMember,
  isPendingMember,
  isStudent,
  isAlumni,
  isExternalMember
} from '../src/lib/auth-helpers';

console.log('🧪 [FAZ 1 TEST SENARYOLARI BAŞLATILIYOR]\n');

const tests: Array<{ name: string; test: () => boolean }> = [
  {
    name: '1. Yeni FSMVÜ öğrencisi e-postası (@stu.fsm.edu.tr) -> FSMVU_ACTIVE + ACTIVE',
    test: () => {
      const u = normalizeUser({ email: 'ahmet@stu.fsm.edu.tr', role: 'MEMBER' });
      return u.student_status === 'FSMVU_ACTIVE' && u.membership_status === 'ACTIVE' && isStudent(u) && isActiveMember(u);
    }
  },
  {
    name: '2. Yeni Harici (External) kullanıcı e-postası (gmail) -> EXTERNAL + PENDING',
    test: () => {
      const u = normalizeUser({ email: 'misafir@gmail.com', role: 'PENDING' });
      return u.student_status === 'EXTERNAL' && u.membership_status === 'PENDING' && isPendingMember(u) && !isActiveMember(u);
    }
  },
  {
    name: '3. PENDING external kullanıcı login olamaz / aktif üye değildir',
    test: () => {
      const u = normalizeUser({ email: 'bekleyen@gmail.com', role: 'PENDING', membership_status: 'PENDING' });
      return !isActiveMember(u) && isPendingMember(u);
    }
  },
  {
    name: '4. Admin onayından sonra external kullanıcı ACTIVE üye olur',
    test: () => {
      const u = normalizeUser({ email: 'onayli_dis@gmail.com', role: 'MEMBER', membership_status: 'ACTIVE', student_status: 'EXTERNAL' });
      return u.membership_status === 'ACTIVE' && u.student_status === 'EXTERNAL' && isExternalMember(u) && isActiveMember(u);
    }
  },
  {
    name: '5. Eski MEMBER kaydı (status alanları eksik) runtime fallback ile ACTIVE + doğru student_status alır',
    test: () => {
      const u1 = normalizeUser({ email: 'eski_ogrenci@stu.fsm.edu.tr', role: 'MEMBER' });
      const u2 = normalizeUser({ email: 'eski_dis@gmail.com', role: 'MEMBER' });
      return u1.membership_status === 'ACTIVE' && u1.student_status === 'FSMVU_ACTIVE' &&
             u2.membership_status === 'ACTIVE' && u2.student_status === 'EXTERNAL';
    }
  },
  {
    name: '6. Eski PENDING kaydı (status alanları eksik) runtime fallback ile PENDING alır',
    test: () => {
      const u = normalizeUser({ email: 'eski_pending@gmail.com', role: 'PENDING' });
      return u.membership_status === 'PENDING' && isPendingMember(u);
    }
  },
  {
    name: '7. Eski ADMIN kaydı isAdmin() tarafından tanınır ve yetkisi korunur',
    test: () => {
      const u = normalizeUser({ email: 'admin@fsmtiyatro.com', role: 'ADMIN' });
      return isAdmin(u) && isActiveMember(u);
    }
  },
  {
    name: '8. Eksik/bilinmeyen role sahip kullanıcı asla varsayılan olarak ACTIVE yapılmaz (Güvenli Fallback: NONE)',
    test: () => {
      const u = normalizeUser({ email: 'belirsiz@domain.com', role: 'UNKNOWN_ROLE' as any });
      return u.membership_status === 'NONE' && !isActiveMember(u);
    }
  },
  {
    name: '9. Mezun kullanıcı (FSMVU_ALUMNI) isAlumni() tarafından doğru tespit edilir',
    test: () => {
      const u = normalizeUser({ email: 'mezun@gmail.com', student_status: 'FSMVU_ALUMNI', membership_status: 'ACTIVE' });
      return isAlumni(u) && isActiveMember(u);
    }
  },
  {
    name: '10. Üyelikten ayrılan mezun (ALUMNI + FSMVU_ALUMNI) aktif üye değildir',
    test: () => {
      const u = normalizeUser({ email: 'emekli@gmail.com', student_status: 'FSMVU_ALUMNI', membership_status: 'ALUMNI', role: 'ALUMNI' });
      return isAlumni(u) && !isActiveMember(u) && u.membership_status === 'ALUMNI';
    }
  },
  {
    name: '11. Null / undefined user nesnesi güvenli boş kullanıcı döner (Çökmez)',
    test: () => {
      const u = normalizeUser(null);
      return u.membership_status === 'NONE' && u.student_status === 'EXTERNAL' && !isAdmin(u) && !isActiveMember(u);
    }
  },
  {
    name: '12. Özel unvanlı (Başkan/Yönetici) kullanıcılar role MEMBER olsa bile isAdmin() ile tam yetkilidir',
    test: () => {
      const u = normalizeUser({ email: 'baskan@stu.fsm.edu.tr', role: 'MEMBER', titles: ['Kulüp Başkanı', 'Yönetim Kurulu'] });
      return isAdmin(u) && isActiveMember(u);
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
