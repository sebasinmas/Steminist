import { Database } from "./Database";

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

export type ConnectionStatus = 'none' | 'pending' | 'connected' | 'declined';

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
  avatarUrl: string;
  interests: Database["models"]["Enums"]["interest_enum"][]; // Ajustado para coincidir con la base de datos
  availability: Record<string, string[]>;
  title?: string;
  company?: string;
  expertise?: 'entry' | 'mid' | 'senior' | 'lead';
  timezone?: string;
}

export interface Mentor extends BaseUser {
  title: string;
  company: string;
  role: 'mentor';
  rating: number;
  reviews: number;
  longBio: string;
  mentorshipGoals: Database["models"]["Tables"]["mentor_profiles"]["Row"]["mentorship_goals"]; // Ajustado para coincidir con la base de datos
  maxMentees: number;
  links?: Link[];
}

export interface Mentee extends BaseUser {
  bio: string;
  role: 'mentee';
  mentorshipGoals: Database["models"]["Tables"]["mentee_profiles"]["Row"]["mentorship_goals"]; // Ajustado para coincidir con la base de datos
  pronouns?: string;
  neurodivergence?: string;
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
  | 'termination_requested';

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
}

export type MentorshipStatus = 'active' | 'completed' | 'termination_requested';

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
  status: 'pending' | 'accepted' | 'declined';
  motivationLetter: string;
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