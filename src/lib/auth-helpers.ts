import { User, MembershipStatus, StudentStatus, UserRole } from '@/types/domain';

/**
 * E-posta adresinden öğrenci statüsünü tahmin eder.
 */
export function inferStudentStatusFromEmail(email?: string | null): StudentStatus {
  if (!email) return 'EXTERNAL';
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail.endsWith('@stu.fsm.edu.tr')) {
    return 'FSMVU_ACTIVE';
  }
  return 'EXTERNAL';
}

/**
 * Eski tekil `role` alanından üyelik statüsünü tahmin eder.
 */
export function inferMembershipStatusFromLegacyRole(role?: string | null): MembershipStatus {
  if (!role) return 'NONE';
  const cleanRole = role.trim().toUpperCase();

  if (cleanRole === 'PENDING') {
    return 'PENDING';
  }

  if (cleanRole === 'ALUMNI') {
    return 'ALUMNI';
  }

  const activeRoles = [
    'SUPERADMIN',
    'ADMIN',
    'DIRECTOR',
    'ASST_DIRECTOR',
    'AKTOR',
    'PLAYER',
    'EDITOR',
    'SALES',
    'MEMBER'
  ];

  if (activeRoles.includes(cleanRole)) {
    return 'ACTIVE';
  }

  return 'NONE';
}

/**
 * Eski veya yeni kullanıcı nesnesini normalize ederek garantili
 * `membership_status` ve `student_status` değerleri üretir.
 */
export function normalizeUser<T extends Partial<User>>(user: T | null | undefined): User {
  if (!user) {
    return {
      id: '',
      email: '',
      name: '',
      surname: '',
      role: 'USER' as UserRole,
      membership_status: 'NONE',
      student_status: 'EXTERNAL',
      createdAt: new Date().toISOString()
    };
  }

  const student_status: StudentStatus =
    user.student_status ?? inferStudentStatusFromEmail(user.email);

  const membership_status: MembershipStatus =
    user.membership_status ?? inferMembershipStatusFromLegacyRole(user.role);

  return {
    id: user.id || '',
    name: user.name || '',
    surname: user.surname || '',
    email: (user.email || '').toLowerCase(),
    role: (user.role || 'MEMBER') as UserRole,
    membership_status,
    student_status,
    titles: Array.isArray(user.titles) ? user.titles : [],
    displayTitle: user.displayTitle || '',
    phone: user.phone || '',
    photoUrl: user.photoUrl || '',
    department: user.department || '',
    graduationYear: user.graduationYear || '',
    hobbies: user.hobbies || '',
    pastPlays: user.pastPlays || '',
    skills: user.skills || '',
    bio: user.bio || '',
    assignedPlays: Array.isArray(user.assignedPlays) ? user.assignedPlays : [],
    membership_updated_at: user.membership_updated_at || '',
    membership_updated_by: user.membership_updated_by || null,
    membership_rejection_reason: user.membership_rejection_reason || null,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || ''
  };
}

/**
 * Yetkilendirme Yardımcıları (Authorization Guards)
 */
export function isAdmin(user?: Partial<User> | null): boolean {
  if (!user) return false;
  const role = user.role;
  const titles = Array.isArray(user.titles) ? user.titles : [];
  return (
    role === 'SUPERADMIN' ||
    role === 'ADMIN' ||
    titles.some(t => t.includes('Admin') || t.includes('Yönetici') || t.includes('Başkan'))
  );
}

export function isActiveMember(user?: Partial<User> | null): boolean {
  if (!user) return false;
  const normalized = normalizeUser(user);
  return normalized.membership_status === 'ACTIVE' || isAdmin(user);
}

export function isPendingMember(user?: Partial<User> | null): boolean {
  if (!user) return false;
  const normalized = normalizeUser(user);
  return normalized.membership_status === 'PENDING';
}

export function isStudent(user?: Partial<User> | null): boolean {
  if (!user) return false;
  const normalized = normalizeUser(user);
  return normalized.student_status === 'FSMVU_ACTIVE';
}

export function isAlumni(user?: Partial<User> | null): boolean {
  if (!user) return false;
  const normalized = normalizeUser(user);
  return normalized.student_status === 'FSMVU_ALUMNI' || normalized.membership_status === 'ALUMNI';
}

export function isExternalMember(user?: Partial<User> | null): boolean {
  if (!user) return false;
  const normalized = normalizeUser(user);
  return normalized.student_status === 'EXTERNAL' && normalized.membership_status === 'ACTIVE';
}

export function isEditor(user?: Partial<User> | null): boolean {
  if (!user) return false;
  const role = user.role;
  const titles = Array.isArray(user.titles) ? user.titles : [];
  return (
    role === 'EDITOR' ||
    role === 'DIRECTOR' ||
    isAdmin(user) ||
    titles.some(t => t.includes('Editör') || t.includes('Yazar') || t.includes('Yönetmen'))
  );
}

export function isDirector(user?: Partial<User> | null): boolean {
  if (!user) return false;
  const role = user.role;
  const titles = Array.isArray(user.titles) ? user.titles : [];
  return (
    role === 'DIRECTOR' ||
    role === 'ASST_DIRECTOR' ||
    isAdmin(user) ||
    titles.some(t => t.includes('Yönetmen') || t.includes('Reji'))
  );
}

import { EventItem, Play } from '@/types/domain';

export function canManageEvent(user?: Partial<User> | null, event?: Partial<EventItem> | null): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (!event) return false;
  if (!isDirector(user)) return false;

  const uid = user.id;
  const uEmail = user.email?.toLowerCase();
  
  if (event.directorId && (event.directorId === uid || event.directorId === uEmail)) {
    return true;
  }

  if (event.playId && Array.isArray(user.assignedPlays) && user.assignedPlays.includes(event.playId)) {
    return true;
  }

  return false;
}

export function isEventParticipant(
  user?: Partial<User> | null,
  event?: Partial<EventItem> | null,
  play?: Partial<Play> | null
): boolean {
  if (!user || !event) return false;
  const uid = user.id;
  const uEmail = (user.email || '').toLowerCase();

  // Katılımcı kapsamını belirle
  const scope = event.participantScope || 
    (event.playId ? 'PROJECT_MEMBERS' : (event.participants && event.participants.length > 0 ? 'SELECTED_USERS' : 'PROJECT_MEMBERS'));

  // 1. Sadece Seçili Kullanıcılar (SELECTED_USERS)
  if (scope === 'SELECTED_USERS') {
    if (Array.isArray(event.participants) && event.participants.length > 0) {
      return event.participants.some(p => p === uid || p.toLowerCase() === uEmail);
    }
    return false;
  }

  // 2. Proje / Oyun Kadrosu Üyeleri (PROJECT_MEMBERS)
  if (scope === 'PROJECT_MEMBERS' && event.playId) {
    if (Array.isArray(user.assignedPlays) && user.assignedPlays.includes(event.playId)) {
      return true;
    }
    if (play && Array.isArray(play.cast)) {
      const inCast = play.cast.some(c => 
        ((c.actorId && c.actorId === uid) || (c.userId && c.userId === uid)) || 
        ((c.name && user.name && c.name.toLowerCase().includes(user.name.toLowerCase())) ||
         (c.actorName && user.name && c.actorName.toLowerCase().includes(user.name.toLowerCase())))
      );
      if (inCast) return true;
    }
    // Katılımcı listesinde açıkça eklenmişse de izin ver
    if (Array.isArray(event.participants) && event.participants.length > 0) {
      return event.participants.some(p => p === uid || p.toLowerCase() === uEmail);
    }
    return false;
  }

  // 3. Rol / Unvan Bazlı Kapsam (ROLE_BASED)
  if (scope === 'ROLE_BASED') {
    const targetRoles = Array.isArray(event.participants) ? event.participants : [];
    if (user.role && targetRoles.includes(user.role)) return true;
    if (Array.isArray(user.titles) && user.titles.some(t => targetRoles.includes(t))) return true;
    return false;
  }

  // 4. Tüm Kulüp Üyeleri (Yalnızca açıkça ALL_MEMBERS olarak tanımlandıysa)
  if (scope === 'ALL_MEMBERS') {
    return isActiveMember(user);
  }

  return false;
}

import { UserSegment } from '@/types/domain';

export function getUserSegment(user?: Partial<User> | null): UserSegment {
  if (!user) return 'PUBLIC';
  const normalized = normalizeUser(user);
  if (normalized.membership_status === 'NONE' || normalized.membership_status === 'PENDING') {
    return 'PUBLIC';
  }
  if (isAdmin(user)) {
    return 'ADMIN';
  }
  if (normalized.student_status === 'FSMVU_ACTIVE') {
    return 'STUDENT';
  }
  if (normalized.student_status === 'FSMVU_ALUMNI') {
    return 'ALUMNI';
  }
  return 'EXTERNAL';
}
