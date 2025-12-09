export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  models: {
    Tables: {
      availability_blocks: {
        Row: {
          created_at: string
          day_of_week: Database["models"]["Enums"]["day_of_week_enum"] | null
          end_time: string
          id: number
          is_booked: boolean
          is_recurring: boolean
          notes: string | null
          specific_date: string | null
          start_time: string
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: Database["models"]["Enums"]["day_of_week_enum"] | null
          end_time: string
          id?: number
          is_booked?: boolean
          is_recurring?: boolean
          notes?: string | null
          specific_date?: string | null
          start_time: string
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: Database["models"]["Enums"]["day_of_week_enum"] | null
          end_time?: string
          id?: number
          is_booked?: boolean
          is_recurring?: boolean
          notes?: string | null
          specific_date?: string | null
          start_time?: string
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          created_at: string
          id: number
          mentee_id: string
          mentor_id: string
          motivation_letter: string | null
          responded_at: string | null
          response_message: string | null
          status: Database["models"]["Enums"]["connection_status_enum"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          mentee_id: string
          mentor_id: string
          motivation_letter?: string | null
          responded_at?: string | null
          response_message?: string | null
          status?: Database["models"]["Enums"]["connection_status_enum"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          mentee_id?: string
          mentor_id?: string
          motivation_letter?: string | null
          responded_at?: string | null
          response_message?: string | null
          status?: Database["models"]["Enums"]["connection_status_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentee_profiles: {
        Row: {
          bio: string | null
          company: string | null
          created_at: string
          id: number
          interests: Database["models"]["Enums"]["interest_enum"][] | null
          is_neurodivergent: boolean | null
          mentorship_goals:
            | Database["models"]["Enums"]["mentorship_goal_enum"][]
            | null
          neurodivergence_details: string | null
          pronouns: string | null
          role_level: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          company?: string | null
          created_at?: string
          id?: number
          interests?: Database["models"]["Enums"]["interest_enum"][] | null
          is_neurodivergent?: boolean | null
          mentorship_goals?:
            | Database["models"]["Enums"]["mentorship_goal_enum"][]
            | null
          neurodivergence_details?: string | null
          pronouns?: string | null
          role_level?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          company?: string | null
          created_at?: string
          id?: number
          interests?: Database["models"]["Enums"]["interest_enum"][] | null
          is_neurodivergent?: boolean | null
          mentorship_goals?:
            | Database["models"]["Enums"]["mentorship_goal_enum"][]
            | null
          neurodivergence_details?: string | null
          pronouns?: string | null
          role_level?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentee_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_profiles: {
        Row: {
          average_rating: number
          bio: string | null
          company: string | null
          created_at: string
          expertise: Database["models"]["Enums"]["expertise_enum"] | null
          id: number
          interests: Database["models"]["Enums"]["interest_enum"][] | null
          max_mentees: number
          mentorship_goals:
            | Database["models"]["Enums"]["mentorship_goal_enum"][]
            | null
          paper_link: string | null
          title: string | null
          total_reviews: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_rating?: number
          bio?: string | null
          company?: string | null
          created_at?: string
          expertise?: Database["models"]["Enums"]["expertise_enum"] | null
          id?: number
          interests?: Database["models"]["Enums"]["interest_enum"][] | null
          max_mentees?: number
          mentorship_goals?:
            | Database["models"]["Enums"]["mentorship_goal_enum"][]
            | null
          paper_link?: string | null
          title?: string | null
          total_reviews?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_rating?: number
          bio?: string | null
          company?: string | null
          created_at?: string
          expertise?: Database["models"]["Enums"]["expertise_enum"] | null
          id?: number
          interests?: Database["models"]["Enums"]["interest_enum"][] | null
          max_mentees?: number
          mentorship_goals?:
            | Database["models"]["Enums"]["mentorship_goal_enum"][]
            | null
          paper_link?: string | null
          title?: string | null
          total_reviews?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorships: {
        Row: {
          connection_request_id: number | null
          created_at: string
          end_date: string | null
          id: number
          mentee_id: string
          mentor_id: string
          mentorship_goals: string | null
          start_date: string | null
          status: Database["models"]["Enums"]["mentorship_status_enum"]
          termination_reason: string | null
          updated_at: string | null
        }
        Insert: {
          connection_request_id?: number | null
          created_at?: string
          end_date?: string | null
          id?: number
          mentee_id: string
          mentor_id: string
          mentorship_goals?: string | null
          start_date?: string | null
          status?: Database["models"]["Enums"]["mentorship_status_enum"]
          termination_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          connection_request_id?: number | null
          created_at?: string
          end_date?: string | null
          id?: number
          mentee_id?: string
          mentor_id?: string
          mentorship_goals?: string | null
          start_date?: string | null
          status?: Database["models"]["Enums"]["mentorship_status_enum"]
          termination_reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentorships_connection_request_id_fkey"
            columns: ["connection_request_id"]
            isOneToOne: false
            referencedRelation: "connection_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorships_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      papers: {
        Row: {
          id: number
          link: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          id?: number
          link?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          id?: number
          link?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "papers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      private_session_surveys: {
        Row: {
          created_at: string
          engagement: number | null
          id: number
          mentor_id: string
          notes: string | null
          outcome: number | null
          preparation: number | null
          session_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          engagement?: number | null
          id?: number
          mentor_id: string
          notes?: string | null
          outcome?: number | null
          preparation?: number | null
          session_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          engagement?: number | null
          id?: number
          mentor_id?: string
          notes?: string | null
          outcome?: number | null
          preparation?: number | null
          session_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_session_surveys_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_session_surveys_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          rating: number | null
          reviewer_id: string
          session_id: number
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: number
          rating?: number | null
          reviewer_id: string
          session_id: number
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: number
          rating?: number | null
          reviewer_id?: string
          session_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_feedback_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_files: {
        Row: {
          id: number
          name: string | null
          session_id: number
          uploaded_at: string
          url: string
        }
        Insert: {
          id?: number
          name?: string | null
          session_id: number
          uploaded_at?: string
          url: string
        }
        Update: {
          id?: number
          name?: string | null
          session_id?: number
          uploaded_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_files_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          id: number
          mentee_goals: string | null
          mentorship_id: number
          notes: string | null
          scheduled_at: string
          session_number: number | null
          status: Database["models"]["Enums"]["session_status_enum"]
          topic: string | null
          updated_at: string | null
          video_link: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: number
          mentee_goals?: string | null
          mentorship_id: number
          notes?: string | null
          scheduled_at: string
          session_number?: number | null
          status?: Database["models"]["Enums"]["session_status_enum"]
          topic?: string | null
          updated_at?: string | null
          video_link?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: number
          mentee_goals?: string | null
          mentorship_id?: number
          notes?: string | null
          scheduled_at?: string
          session_number?: number | null
          status?: Database["models"]["Enums"]["session_status_enum"]
          topic?: string | null
          updated_at?: string | null
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_mentorship_id_fkey"
            columns: ["mentorship_id"]
            isOneToOne: false
            referencedRelation: "mentorships"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_admin_id: string | null
          closed_at: string | null
          created_at: string
          id: number
          message: string
          priority: string | null
          status: Database["models"]["Enums"]["ticket_status_enum"]
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_admin_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: number
          message: string
          priority?: string | null
          status?: Database["models"]["Enums"]["ticket_status_enum"]
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_admin_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: number
          message?: string
          priority?: string | null
          status?: Database["models"]["Enums"]["ticket_status_enum"]
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_admin_id_fkey"
            columns: ["assigned_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: number
        }
        Insert: {
          id?: number
        }
        Update: {
          id?: number
        }
        Relationships: []
      }
      user_links: {
        Row: {
          created_at: string
          id: number
          label: string | null
          type: Database["models"]["Enums"]["user_link_type_enum"]
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          label?: string | null
          type: Database["models"]["Enums"]["user_link_type_enum"]
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          label?: string | null
          type?: Database["models"]["Enums"]["user_link_type_enum"]
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tags: {
        Row: {
          created_at: string
          id: number
          relevance: number | null
          tag_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          relevance?: number | null
          tag_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          relevance?: number | null
          tag_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          google_refresh_token: string | null
          id: string
          last_name: string
          role: Database["models"]["Enums"]["user_role_enum"]
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name: string
          google_refresh_token?: string | null
          id: string
          last_name: string
          role?: Database["models"]["Enums"]["user_role_enum"]
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          google_refresh_token?: string | null
          id?: string
          last_name?: string
          role?: Database["models"]["Enums"]["user_role_enum"]
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      connection_status_enum: "pending" | "accepted" | "rejected" | "cancelled"
      day_of_week_enum:
        | "sunday"
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
      expertise_enum: "entry" | "mid" | "senior" | "lead"
      interest_enum:
        | "Ciencia de datos"
        | "Aprendizaje automático"
        | "Ciberseguridad"
        | "Computación en la nube"
        | "DevOps"
        | "Diseño UI/UX"
        | "Desarrollo móvil"
        | "Gestión de producto"
        | "Arquitectura de software"
        | "Estadística"
        | "Biotecnología"
        | "Ciencias ambientales"
      mentorship_goal_enum:
        | "Liderazgo"
        | "Comunicación"
        | "Hablar en público"
        | "Gestión del tiempo"
        | "Crecimiento profesional"
        | "Transición de carrera"
        | "Marca personal"
        | "Balance vida-trabajo"
        | "Síndrome del impostor"
        | "Diversidad e inclusión"
        | "Preparación de entrevistas"
      mentorship_status_enum:
        | "active"
        | "completed"
        | "termination_requested"
        | "terminated"
        | "paused"
      session_status_enum:
        | "pending"
        | "needs_confirmation"
        | "confirmed"
        | "rescheduled"
        | "completed"
        | "cancelled"
        | "termination_requested"
      tag_type_enum:
        | "experience"
        | "mentoring_topic"
        | "mentoring_goal"
        | "motivation"
        | "interest"
      ticket_status_enum: "open" | "in_progress" | "resolved" | "closed"
      user_link_type_enum:
        | "portfolio"
        | "linkedin"
        | "github"
        | "twitter"
        | "website"
        | "other"
      user_role_enum: "admin" | "mentor" | "mentee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  models: {
    Enums: {
      connection_status_enum: ["pending", "accepted", "rejected", "cancelled"],
      day_of_week_enum: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
      expertise_enum: ["entry", "mid", "senior", "lead"],
      interest_enum: [
        "Ciencia de datos",
        "Aprendizaje automático",
        "Ciberseguridad",
        "Computación en la nube",
        "DevOps",
        "Diseño UI/UX",
        "Desarrollo móvil",
        "Gestión de producto",
        "Arquitectura de software",
        "Estadística",
        "Biotecnología",
        "Ciencias ambientales",
      ],
      mentorship_goal_enum: [
        "Liderazgo",
        "Comunicación",
        "Hablar en público",
        "Gestión del tiempo",
        "Crecimiento profesional",
        "Transición de carrera",
        "Marca personal",
        "Balance vida-trabajo",
        "Síndrome del impostor",
        "Diversidad e inclusión",
        "Preparación de entrevistas",
      ],
      mentorship_status_enum: [
        "active",
        "completed",
        "termination_requested",
        "terminated",
        "paused",
      ],
      session_status_enum: [
        "pending",
        "needs_confirmation",
        "confirmed",
        "rescheduled",
        "completed",
        "cancelled",
        "termination_requested",
      ],
      tag_type_enum: [
        "experience",
        "mentoring_topic",
        "mentoring_goal",
        "motivation",
        "interest",
      ],
      ticket_status_enum: ["open", "in_progress", "resolved", "closed"],
      user_link_type_enum: [
        "portfolio",
        "linkedin",
        "github",
        "twitter",
        "website",
        "other",
      ],
      user_role_enum: ["admin", "mentor", "mentee"],
    },
  },
} as const