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
        Relationships: []
      }
      assets: {
        Row: {
          id: string
          creator_id: string
          title: string
          type: 'prompt' | 'agent' | 'app' | 'workflow'
          description: string | null
          content: string | null
          description_sequence: Json
          external_url: string | null
          tags: string[]
          attachments: Json
          status: 'draft' | 'published'
          visibility: 'public' | 'private'
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
          type: 'prompt' | 'agent' | 'app' | 'workflow'
          description?: string | null
          content?: string | null
          description_sequence?: Json
          external_url?: string | null
          tags?: string[]
          attachments?: Json
          status?: 'draft' | 'published'
          visibility?: 'public' | 'private'
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
          type?: 'prompt' | 'agent' | 'app' | 'workflow'
          description?: string | null
          content?: string | null
          description_sequence?: Json
          external_url?: string | null
          tags?: string[]
          attachments?: Json
          status?: 'draft' | 'published'
          visibility?: 'public' | 'private'
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      collections: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          visibility: 'public' | 'private'
          star_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          visibility?: 'public' | 'private'
          star_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          visibility?: 'public' | 'private'
          star_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      collection_assets: {
        Row: {
          id: string
          collection_id: string
          asset_id: string
          position: number
          added_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          asset_id: string
          position?: number
          added_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          asset_id?: string
          position?: number
          added_at?: string
        }
        Relationships: []
      }
      collection_stars: {
        Row: {
          id: string
          collection_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id: string
          collection_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'new_star' | 'new_comment' | 'asset_validated' | 'new_follower'
          actor_id: string | null
          asset_id: string | null
          collection_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'new_star' | 'new_comment' | 'asset_validated' | 'new_follower'
          actor_id?: string | null
          asset_id?: string | null
          collection_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'new_star' | 'new_comment' | 'asset_validated' | 'new_follower'
          actor_id?: string | null
          asset_id?: string | null
          collection_id?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_view_count: {
        Args: { asset_id: string }
        Returns: undefined
      }
      toggle_star: {
        Args: { p_asset_id: string; p_user_id: string }
        Returns: { starred: boolean; star_count: number }
      }
      get_star_status: {
        Args: { p_asset_id: string; p_user_id: string }
        Returns: boolean
      }
      add_comment: {
        Args: { p_asset_id: string; p_user_id: string; p_user_name: string; p_text: string }
        Returns: string
      }
      delete_comment: {
        Args: { p_comment_id: string; p_asset_id: string }
        Returns: undefined
      }
      toggle_collection_star: {
        Args: { p_collection_id: string; p_user_id: string }
        Returns: { starred: boolean; star_count: number }
      }
      toggle_follow: {
        Args: { p_follower_id: string; p_following_id: string }
        Returns: { following: boolean }
      }
      get_follow_counts: {
        Args: { p_user_id: string }
        Returns: { followers: number; following: number }
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_actor_id?: string | null
          p_asset_id?: string | null
          p_collection_id?: string | null
        }
        Returns: string | null
      }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
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
export type CollectionRow = Database['public']['Tables']['collections']['Row']
export type CollectionAssetRow = Database['public']['Tables']['collection_assets']['Row']
export type CollectionStarRow = Database['public']['Tables']['collection_stars']['Row']
export type FollowRow = Database['public']['Tables']['follows']['Row']
export type NotificationRow = Database['public']['Tables']['notifications']['Row']

export type NotificationType = NotificationRow['type']

export interface NotificationWithDetails extends NotificationRow {
  actor?: { id: string; display_name: string; photo_url: string | null } | null
  asset?: { id: string; title: string; type: string } | null
}
