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
  actorName: string;
  userId?: string;
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

export interface EventItem {
  id: string;
  title: string;
  type?: 'Atölye' | 'Söyleşi' | 'Film Gösterimi' | 'Festival' | 'Okuma Tiyatrosu' | 'Genel Etkinlik';
  instructor?: string;
  date: string;
  time?: string;
  location: string;
  description?: string;
  coverImageUrl?: string;
  capacity?: number;
  registrationOpen?: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: UserRole;
  membershipStatus?: 'ACTIVE' | 'ALUMNI' | 'HONORARY';
  joinedSeason?: string;
  graduationYear?: string;
  departments?: string[];
  phone?: string;
  photoUrl?: string;
  department?: string;
  hobbies?: string;
  pastPlays?: string;
  skills?: string;
  bio?: string;
  assignedPlays?: string[];
  createdAt: string;
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
