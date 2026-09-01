export type UserRole = 
  | 'SUPERADMIN' 
  | 'ADMIN' 
  | 'DIRECTOR' 
  | 'ASST_DIRECTOR' 
  | 'AKTOR' 
  | 'PLAYER' 
  | 'EDITOR' 
  | 'SALES' 
  | 'MEMBER' 
  | 'ALUMNI'
  | 'PENDING' 
  | 'USER';

export interface CastMember {
  roleName: string;
  actorName?: string;
  name?: string;
  userId?: string;
  actorId?: string;
  email?: string;
  photoUrl?: string;
}

export interface CrewMember {
  department: 'Yönetmen' | 'Yrd. Yönetmen' | 'Dramaturgi' | 'Işık Tasarımı' | 'Ses & Müzik' | 'Dekor & Kostüm' | 'Kondüvit' | 'Afiş & Görsel' | 'Organizasyon' | 'Genel Ekip';
  memberName: string;
  userId?: string;
}

export interface ShowDate {
  date: string;
  time: string;
  venue: string;
  ticketUrl?: string;
}

export interface Play {
  id: string;
  slug?: string;
  title: string;
  originalTitle?: string;
  playwright?: string;
  translator?: string;
  director?: string;
  directorId?: string;
  assistantDirector?: string;
  season?: string;
  genre?: string;
  duration?: string;
  stageLocation?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'UPCOMING';
  
  description: string;
  directorNote?: string;
  dramaturgyNote?: string;
  
  cast?: CastMember[];
  crew?: CrewMember[];
  showDates?: ShowDate[];
  
  year?: string;
  imageUrl?: string;
  posterUrl?: string;
  videoUrl?: string;
  galleryUrls?: string;
  pressKitUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AcademicMeta {
  isAcademic?: boolean;
  abstract?: string;
  keywords?: string[];
  journalTitle?: string;
  publisher?: string;
  authorAffiliation?: string;
  pdfUrl?: string;
  doi?: string;
  issn?: string;
  volume?: string;
  issue?: string;
}

export type PostStatus = 'PUBLISHED' | 'PENDING_REVIEW' | 'REJECTED';

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: 'Kulis' | 'Makale' | 'Blog' | 'Haber';
  author?: string;
  authorEmail?: string;
  authorRole?: string;
  imageUrl?: string;
  likes?: string[];
  academicMeta?: AcademicMeta;
  status?: PostStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorPhoto?: string;
  createdAt: string;
}

export type EventType =
  | 'PROVA'
  | 'TEMSIL'
  | 'WORKSHOP'
  | 'TOPLANTI'
  | 'OKUMA'
  | 'Atölye'
  | 'Söyleşi'
  | 'Film Gösterimi'
  | 'Festival'
  | 'Okuma Tiyatrosu'
  | 'Genel Etkinlik'
  | 'Etkinlik'
  | string;

export type ParticipantScope =
  | 'ALL_MEMBERS'
  | 'PROJECT_MEMBERS'
  | 'SELECTED_USERS'
  | 'ROLE_BASED';

export type EventVisibility = 'PUBLIC' | 'PRIVATE';

export interface EventItem {
  id: string;
  title: string;
  type?: EventType;
  visibility?: EventVisibility;
  participantScope?: ParticipantScope;
  instructor?: string | null;
  date: string;
  time?: string;
  location: string;
  description?: string;
  coverImageUrl?: string;
  capacity?: number;
  registrationOpen?: boolean;
  playId?: string | null;
  playTitle?: string | null;
  directorId?: string | null;
  participants?: string[];
  isTicketed?: boolean;
  ticketQuota?: number;
  reservedCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceSessionStatus = 'OPEN' | 'CLOSED';

export interface AttendanceSession {
  id: string;
  eventId: string;
  eventTitle: string;
  playId?: string | null;
  status: AttendanceSessionStatus;
  openedBy: string;
  openedByEmail?: string;
  openedByName?: string;
  openedAt: string;
  closedAt?: string | null;
  expiresAt: number;
  lastNudgeAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Server-only Gizli Anahtar Depolama Modeli (İstemciye asla gönderilmez)
 */
export interface AttendanceSecret {
  sessionId: string;
  eventId: string;
  qrSecret: string;
  createdAt: string;
}

export type AttendanceRecordStatus = 'ATTENDED' | 'EXCUSED' | 'NOT_ATTENDED';
export type VerificationMethod = 'QR' | 'MANUAL';

export interface AttendanceRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: AttendanceRecordStatus;
  verifiedAt: string;
  verificationMethod: VerificationMethod;
  excuseNote?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
  previousStatus?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type NotificationType =
  | 'ATTENDANCE_STARTED'
  | 'ATTENDANCE_NUDGE'
  | 'EVENT_REMINDER'
  | 'POST_REVIEW'
  | 'TEAM_APPLICATION'
  | 'GENERAL';

export interface AppNotification {
  id: string;
  userId: string;
  userEmail?: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  eventId?: string | null;
  sessionId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PushSubscriptionRecord {
  id?: string;
  userId: string;
  userEmail?: string;
  token: string;
  subscription?: any;
  platform?: 'ios' | 'android' | 'web' | string;
  deviceType?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MembershipStatus = 'NONE' | 'PENDING' | 'ACTIVE' | 'ALUMNI';

export type StudentStatus = 'FSMVU_ACTIVE' | 'FSMVU_ALUMNI' | 'EXTERNAL';

export type UserSegment = 'STUDENT' | 'ALUMNI' | 'EXTERNAL' | 'ADMIN' | 'PUBLIC';

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  password?: string;
  role: UserRole;
  membership_status?: MembershipStatus;
  student_status?: StudentStatus;
  original_school_email?: string;
  email_changed_at?: string;
  email_changed_once?: boolean;
  email_updated_by?: string | null;
  titles?: string[];
  displayTitle?: string;
  joinedSeason?: string;
  graduationYear?: string;
  departments?: string[];
  phone?: string;
  formattedPhone?: string;
  rawPhone?: string;
  photoUrl?: string;
  department?: string;
  hobbies?: string;
  pastPlays?: string;
  skills?: string;
  bio?: string;
  assignedPlays?: string[];
  membership_updated_at?: string;
  membership_updated_by?: string | null;
  membership_rejection_reason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'GELDİ' | 'MAZERETLİ' | 'GEÇ' | 'GELMEDİ';

export interface Rehearsal {
  id: string;
  title: string;
  date?: string;
  location?: string;
  notes?: string;
  attendance?: Record<string, AttendanceStatus>;
  attendanceNotes?: string;
  pulseActive?: boolean;
  pulseExpiresAt?: number;
  pulseStartedBy?: string;
  pulseResponses?: Array<string | { userId: string; timeString: string }>;
  createdAt: string;
}

export interface Ticket {
  id: string;
  name: string;
  surname: string;
  identifier: string;
  row?: string | null;
  seatNumber?: string | null;
  reference?: string | null;
  status: 'VALID' | 'USED';
  createdAt: string;
}

export interface OccupiedSeat {
  row: string;
  seatNumber: string;
  ticketHolder?: string;
}

export interface SiteConfig {
  heroImageUrl?: string;
  isTicketQueryActive?: boolean;
  contactEmail?: string;
  pinnedSlides?: string[];
  activeSeason?: string;
}
