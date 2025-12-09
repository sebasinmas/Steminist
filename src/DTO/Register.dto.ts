/**
 * Este DTO representa los datos necesarios para registrar un usuario como mentee y mentor.
 */

import { Database } from "@/types/Database";

export interface RegisterGenericDTO {
    email: string;
    role: 'mentee' | 'mentor';
    title?: string;
    company?: string;
    bio?: string;
    avatar_url?: string;
    first_name: string;
    last_name: string;
    password: string;
    interests?: Database["models"]["Enums"]["interest_enum"][] | null;
    mentorship_goals?: Database["models"]["Enums"]["mentorship_goal_enum"][] | null;
}

export interface RegisterMenteeDTO extends RegisterGenericDTO {
    role: 'mentee';
    role_level?: string;
    pronouns?: string;
    is_neurodivergent?: boolean;
    neurodivergence_details?: string;
    
}

export interface RegisterMentorDTO extends RegisterGenericDTO {
    role: 'mentor';
    long_bio?: string;
}

export type RegisterDTO = RegisterMenteeDTO | RegisterMentorDTO;