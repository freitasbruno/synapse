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
      users: {
        Row: {
          id: string
          auth_id: string
          display_name: string
          email: string
          photo_url: string | null
          role: 'member' | 'manager'
          bio: string | null
          technical_focus: string | null
          profile_complete: boolean
          contributions_count: number
          created_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          display_name: string
          email: string
          photo_url?: string | null
          role?: 'member' | 'manager'
          bio?: string | null
          technical_focus?: string | null
          profile_complete?: boolean
          contributions_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          auth_id?: string
          display_name?: string
          email?: string
          photo_url?: string | null
          role?: 'member' | 'manager'
          bio?: string | null
          technical_focus?: string | null
          profile_complete?: boolean
          contributions_count?: number
          created_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          creator_id: string
          title: string
          type: 'prompt' | 'tool' | 'app' | 'workflow'
          description: string | null
          content: string | null
          description_sequence: Json
          external_url: string | null
          tags: string[]
          attachments: Json
          status: 'draft' | 'published'
          vote_count: number
          star_count: number
          comment_count: number
          view_count: number
          is_manager_validated: boolean
          validation_score: number
          created_at: string
          updated_at: string
          last_published_at: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          type: 'prompt' | 'tool' | 'app' | 'workflow'
          description?: string | null
          content?: string | null
          description_sequence?: Json
          external_url?: string | null
          tags?: string[]
          attachments?: Json
          status?: 'draft' | 'published'
          vote_count?: number
          star_count?: number
          comment_count?: number
          view_count?: number
          is_manager_validated?: boolean
          validation_score?: number
          created_at?: string
          updated_at?: string
          last_published_at?: string | null
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          type?: 'prompt' | 'tool' | 'app' | 'workflow'
          description?: string | null
          content?: string | null
          description_sequence?: Json
          external_url?: string | null
          tags?: string[]
          attachments?: Json
          status?: 'draft' | 'published'
          vote_count?: number
          star_count?: number
          comment_count?: number
          view_count?: number
          is_manager_validated?: boolean
          validation_score?: number
          created_at?: string
          updated_at?: string
          last_published_at?: string | null
        }
      }
      comments: {
        Row: {
          id: string
          asset_id: string
          user_id: string
          user_name: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          user_id: string
          user_name: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          user_id?: string
          user_name?: string
          text?: string
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          asset_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id: string
          asset_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          user_id?: string
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          type: 'copy_action' | 'ai_refine_trigger'
          asset_id: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: 'copy_action' | 'ai_refine_trigger'
          asset_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'copy_action' | 'ai_refine_trigger'
          asset_id?: string | null
          user_id?: string | null
          created_at?: string
        }
      }
      ai_usage_logs: {
        Row: {
          id: string
          user_id: string
          type: string
          tokens_input: number
          tokens_output: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: string
          tokens_input?: number
          tokens_output?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          tokens_input?: number
          tokens_output?: number
          created_at?: string
        }
      }
      system_stats: {
        Row: {
          id: string
          date: string
          total_refine_calls: number
          total_tokens: number
        }
        Insert: {
          id?: string
          date: string
          total_refine_calls?: number
          total_tokens?: number
        }
        Update: {
          id?: string
          date?: string
          total_refine_calls?: number
          total_tokens?: number
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_view_count: {
        Args: { asset_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
  }
}

// Convenience row types
export type UserRow = Database['public']['Tables']['users']['Row']
export type AssetRow = Database['public']['Tables']['assets']['Row']
export type CommentRow = Database['public']['Tables']['comments']['Row']
export type VoteRow = Database['public']['Tables']['votes']['Row']
export type ActivityLogRow = Database['public']['Tables']['activity_logs']['Row']
export type AiUsageLogRow = Database['public']['Tables']['ai_usage_logs']['Row']
export type SystemStatsRow = Database['public']['Tables']['system_stats']['Row']
