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
  | 'PENDING' 
  | 'USER';

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: UserRole;
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

export interface Play {
  id: string;
  title: string;
  description: string;
  year?: string;
  imageUrl?: string;
  videoUrl?: string;
  galleryUrls?: string;
  createdAt: string;
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
  category: 'Kulis' | 'Makale' | 'Blog' | 'Haber' | 'Akademik Bildiri';
  author?: string;
  authorEmail?: string;
  imageUrl?: string;
  likes?: string[];
  academicMeta?: AcademicMeta;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorPhoto?: string;
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

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  createdAt: string;
}

export interface SiteConfig {
  heroImageUrl?: string;
  isTicketQueryActive?: boolean;
  contactEmail?: string;
  pinnedSlides?: string[];
}
