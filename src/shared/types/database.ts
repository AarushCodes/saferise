export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'worker' | 'manager' | 'contractor';
export type ExperienceLevel = '0-1' | '1-3' | '3-5' | '5+';
export type IncidentType = 'near-miss' | 'unsafe-condition';
export type JobStatus = 'active' | 'filled' | 'closed';
export type ApplicationStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected';
export type AlertStatus = 'unresponded' | 'safe' | 'emergency';
export type NotificationType = 'job_posted' | 'application_status' | 'fall_alert' | 'check_in_reminder';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role: UserRole;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      worker_profiles: {
        Row: {
          id: string;
          user_id: string;
          experience: ExperienceLevel;
          is_certified: boolean;
          last_active: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          experience: ExperienceLevel;
          is_certified?: boolean;
          last_active?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          experience?: ExperienceLevel;
          is_certified?: boolean;
          last_active?: string;
          created_at?: string;
        };
      };
      manager_profiles: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          created_at?: string;
        };
      };
      contractor_profiles: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          is_approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          is_approved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          is_approved?: boolean;
          created_at?: string;
        };
      };
      daily_check_ins: {
        Row: {
          id: string;
          worker_id: string;
          wearing_ppe: boolean;
          scaffolding_secure: boolean;
          weather_safe: boolean;
          feeling_alert: boolean;
          photo_url: string;
          location_lat: number | null;
          location_lng: number | null;
          location_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          wearing_ppe: boolean;
          scaffolding_secure: boolean;
          weather_safe: boolean;
          feeling_alert: boolean;
          photo_url: string;
          location_lat?: number | null;
          location_lng?: number | null;
          location_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          wearing_ppe?: boolean;
          scaffolding_secure?: boolean;
          weather_safe?: boolean;
          feeling_alert?: boolean;
          photo_url?: string;
          location_lat?: number | null;
          location_lng?: number | null;
          location_text?: string | null;
          created_at?: string;
        };
      };
      incidents: {
        Row: {
          id: string;
          worker_id: string;
          type: IncidentType;
          photo_url: string;
          voice_note_url: string | null;
          location_lat: number | null;
          location_lng: number | null;
          location_text: string | null;
          is_resolved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          type: IncidentType;
          photo_url: string;
          voice_note_url?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_text?: string | null;
          is_resolved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          type?: IncidentType;
          photo_url?: string;
          voice_note_url?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_text?: string | null;
          is_resolved?: boolean;
          created_at?: string;
        };
      };
      safety_alerts: {
        Row: {
          id: string;
          worker_id: string;
          status: AlertStatus;
          location_lat: number | null;
          location_lng: number | null;
          location_text: string | null;
          response_time: number | null;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          worker_id: string;
          status?: AlertStatus;
          location_lat?: number | null;
          location_lng?: number | null;
          location_text?: string | null;
          response_time?: number | null;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          worker_id?: string;
          status?: AlertStatus;
          location_lat?: number | null;
          location_lng?: number | null;
          location_text?: string | null;
          response_time?: number | null;
          created_at?: string;
          responded_at?: string | null;
        };
      };
      training_lessons: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          video_url: string;
          duration_minutes: number;
          order_num: number;
          questions: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          video_url: string;
          duration_minutes: number;
          order_num: number;
          questions: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          video_url?: string;
          duration_minutes?: number;
          order_num?: number;
          questions?: Json;
          created_at?: string;
        };
      };
      training_progress: {
        Row: {
          id: string;
          worker_id: string;
          lesson_id: string;
          completed: boolean;
          quiz_score: number | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          lesson_id: string;
          completed?: boolean;
          quiz_score?: number | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          lesson_id?: string;
          completed?: boolean;
          quiz_score?: number | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      certifications: {
        Row: {
          id: string;
          worker_id: string;
          certificate_url: string;
          issued_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          certificate_url: string;
          issued_at?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          certificate_url?: string;
          issued_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          posted_by: string;
          title: string;
          description: string;
          pay_per_day: number;
          location_text: string;
          location_lat: number | null;
          location_lng: number | null;
          duration_days: number;
          start_date: string;
          requires_certification: boolean;
          status: JobStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          posted_by: string;
          title: string;
          description: string;
          pay_per_day: number;
          location_text: string;
          location_lat?: number | null;
          location_lng?: number | null;
          duration_days: number;
          start_date: string;
          requires_certification?: boolean;
          status?: JobStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          posted_by?: string;
          title?: string;
          description?: string;
          pay_per_day?: number;
          location_text?: string;
          location_lat?: number | null;
          location_lng?: number | null;
          duration_days?: number;
          start_date?: string;
          requires_certification?: boolean;
          status?: JobStatus;
          created_at?: string;
        };
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          worker_id: string;
          status: ApplicationStatus;
          applied_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          worker_id: string;
          status?: ApplicationStatus;
          applied_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          worker_id?: string;
          status?: ApplicationStatus;
          applied_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          message?: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
      };
      work_shifts: {
        Row: {
          id: string;
          worker_id: string;
          start_time: string;
          end_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          start_time: string;
          end_time?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          start_time?: string;
          end_time?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      experience_level: ExperienceLevel;
      incident_type: IncidentType;
      job_status: JobStatus;
      application_status: ApplicationStatus;
      alert_status: AlertStatus;
      notification_type: NotificationType;
    };
  };
}
