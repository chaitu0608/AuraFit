export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          handle: string
          display_name: string | null
          avatar_url: string | null
          units: 'kg' | 'lb'
          bio: string | null
          share_workouts: boolean
          auto_post_workout: boolean
          auto_post_pr: boolean
          auto_post_streak: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string
          handle: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      friendships: {
        Row: {
          id: string
          requester: string
          addressee: string
          status: 'pending' | 'accepted' | 'blocked'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['friendships']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['friendships']['Row']>
      }
      exercises: {
        Row: {
          id: string
          slug: string
          name: string
          owner_id: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['exercises']['Row']> & {
          slug: string
          name: string
        }
        Update: Partial<Database['public']['Tables']['exercises']['Row']>
      }
      exercise_meta: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          type: 'machine' | 'dumbbell' | 'free'
          plate_n: number | null
          plate_unit: 'lb' | 'kg' | null
          support_assisted: boolean
        }
        Insert: Omit<Database['public']['Tables']['exercise_meta']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['exercise_meta']['Row']>
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          kind: 'workout' | 'cardio' | 'rest'
          name: string | null
          notes: string | null
          source: 'manual' | 'healthkit'
          healthkit_uuid: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['sessions']['Row']> & {
          user_id: string
          date: string
          kind: 'workout' | 'cardio' | 'rest'
        }
        Update: Partial<Database['public']['Tables']['sessions']['Row']>
      }
      session_exercises: {
        Row: {
          id: string
          session_id: string
          exercise_id: string
          position: number
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['session_exercises']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['session_exercises']['Row']>
      }
      sets: {
        Row: {
          id: string
          session_exercise_id: string
          position: number
          weight_kg: number | null
          reps: number | null
          plates: number | null
          is_assisted: boolean
          drop_of_id: string | null
          rpe: number | null
        }
        Insert: Omit<Database['public']['Tables']['sets']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['sets']['Row']>
      }
      templates: {
        Row: {
          id: string
          user_id: string
          name: string
          is_shared: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['templates']['Row']> & {
          user_id: string
          name: string
        }
        Update: Partial<Database['public']['Tables']['templates']['Row']>
      }
      template_exercises: {
        Row: {
          id: string
          template_id: string
          exercise_id: string
          position: number
          prescribed_sets: number | null
          prescribed_reps: number | null
        }
        Insert: Omit<Database['public']['Tables']['template_exercises']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['template_exercises']['Row']>
      }
      prs: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          weight_kg: number
          reps: number
          est_1rm: number
          set_id: string | null
          achieved_at: string
        }
        Insert: Omit<Database['public']['Tables']['prs']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['prs']['Row']>
      }
      streaks: {
        Row: {
          user_id: string
          current_count: number
          longest_count: number
          last_log_date: string | null
        }
        Insert: Database['public']['Tables']['streaks']['Row']
        Update: Partial<Database['public']['Tables']['streaks']['Row']>
      }
      posts: {
        Row: {
          id: string
          user_id: string
          kind: 'workout' | 'pr' | 'streak' | 'note'
          session_id: string | null
          pr_id: string | null
          body: string | null
          photo_url: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['posts']['Row']> & {
          user_id: string
          kind: 'workout' | 'pr' | 'streak' | 'note'
        }
        Update: Partial<Database['public']['Tables']['posts']['Row']>
      }
      post_reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          kind: 'heart' | 'fire' | 'muscle' | 'clap'
        }
        Insert: Omit<Database['public']['Tables']['post_reactions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['post_reactions']['Row']>
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          body: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['post_comments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['post_comments']['Row']>
      }
      programs: {
        Row: {
          id: string
          owner_id: string
          name: string
          weeks: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['programs']['Row']> & {
          owner_id: string
          name: string
        }
        Update: Partial<Database['public']['Tables']['programs']['Row']>
      }
      program_days: {
        Row: {
          id: string
          program_id: string
          week: number
          dow: number
          template_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['program_days']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['program_days']['Row']>
      }
      program_participants: {
        Row: {
          program_id: string
          user_id: string
          started_at: string
        }
        Insert: Database['public']['Tables']['program_participants']['Row']
        Update: Partial<Database['public']['Tables']['program_participants']['Row']>
      }
      challenges: {
        Row: {
          id: string
          owner_id: string
          name: string
          kind: 'streak' | 'volume' | '1rm' | 'reps'
          exercise_id: string | null
          target: number
          ends_at: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['challenges']['Row']> & {
          owner_id: string
          name: string
          kind: 'streak' | 'volume' | '1rm' | 'reps'
          target: number
          ends_at: string
        }
        Update: Partial<Database['public']['Tables']['challenges']['Row']>
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          user_id: string
          current_value: number
          joined_at: string
        }
        Insert: Database['public']['Tables']['challenge_participants']['Row']
        Update: Partial<Database['public']['Tables']['challenge_participants']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
