// FIX: Replaced circular import with direct type definitions to resolve import errors.
export type Page =
  | 'landing'
  | 'discover'
  | 'profile'
  | 'profile_self'
  | 'mentee_profile'
  | 'dashboard'
  | 'notifications'
  | 'admin_dashboard'
  | 'library';

export type UserRole = 'mentee' | 'mentor' | 'admin';

export type Theme = 'light' | 'dark';

export type ConnectionStatus = 'none' | 'pending' | 'connected' | 'rejected' | 'acepted' | 'pending_mentor';

export interface Link {
  title: string;
  url: string;
}

export interface BaseUser {
  id: number | string;
  name: string; // Mantenemos esto como "Nombre Completo" para visualización
  first_name?: string; // Nuevo campo
  last_name?: string;  // Nuevo campo
  email: string;
  role: UserRole;
  avatarUrl: string;
  interests: string[];
  availability: Record<string, string[]>;
  title?: string;
  company?: string;
  experience?: 'entry' | 'mid' | 'senior' | 'lead';
  timezone?: string;
  motivations?: string[];
}

export interface Mentor extends BaseUser {
  title: string;
  company: string;
  rating: number;
  reviews: number;
  longBio: string;
  mentorshipGoals: string[]; // Renamed from mentoringTopics
  maxMentees: number;
  activeMenteesCount?: number;
  links?: Link[];
}

export interface Mentee extends BaseUser {
  bio: string;
  mentorshipGoals: string[];
  pronouns?: string;
  neurodivergence?: string;
  isNeurodivergent?: boolean;
}

export interface Attachment {
  name: string;
  url: string;
}

export interface MentorSurvey {
  preparation: 'excellent' | 'good' | 'average' | 'poor';
  engagement: 'excellent' | 'good' | 'average' | 'poor';
  outcome: string;
}

export type SessionStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'needs_confirmation'
  | 'rescheduled'
  | 'termination_requested'
  | 'active';

export interface Session {
  id: number;
  sessionNumber: number;
  date: string;
  time: string;
  duration: number;
  status: SessionStatus;
  topic: string;
  menteeGoals: string;
  attachments?: Attachment[];
  mentorSurvey?: MentorSurvey;
  rating?: number;
  feedback?: string;
  mentor?: Mentor;
  mentee?: Mentee;
  video_link?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type MentorshipStatus = 'active' | 'completed' | 'termination_requested' | 'terminated';

export interface Mentorship {
  id: number;
  mentor: Mentor;
  mentee: Mentee;
  status: MentorshipStatus;
  sessions: Session[];
  startDate: string;
  terminationReason?: string;
}

export interface ConnectionRequest {
  id: number;
  mentor: Mentor;
  mentee: Mentee;
  status: 'pending' | 'accepted' | 'rejected' | 'pending_mentor';
  motivationLetter: string;
  interests?: string[];
  motivations?: string[];
}

export interface SupportTicket {
  id: number;
  user: Mentee | Mentor;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  timestamp: string;
}

// NUEVO: tipo explícito para usuario admin / base
export interface AdminUser {
  id: number | string;
  name: string;
  email: string;
  role: 'admin';
  avatarUrl: string;
  interests: string[];
  company: string;
  title: string;
}

// User ahora es unión de Mentee | Mentor | AdminUser
export type User = Mentee | Mentor | AdminUser;