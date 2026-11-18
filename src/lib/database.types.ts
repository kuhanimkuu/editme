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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          id: boolean
          min_withdrawal_cents: number
          platform_fee_bps: number
          samples_until_real: number
          show_samples: boolean
        }
        Insert: {
          id?: boolean
          min_withdrawal_cents?: number
          platform_fee_bps?: number
          samples_until_real?: number
          show_samples?: boolean
        }
        Update: {
          id?: boolean
          min_withdrawal_cents?: number
          platform_fee_bps?: number
          samples_until_real?: number
          show_samples?: boolean
        }
        Relationships: []
      }
      editor_profiles: {
        Row: {
          availability: Database["public"]["Enums"]["availability"]
          category: Database["public"]["Enums"]["editor_category"]
          completed_count: number
          created_at: string
          headline: string | null
          hourly_rate_cents: number | null
          is_listed: boolean
          profile_views: number
          rating_avg: number
          rating_count: number
          skills: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: Database["public"]["Enums"]["availability"]
          category: Database["public"]["Enums"]["editor_category"]
          completed_count?: number
          created_at?: string
          headline?: string | null
          hourly_rate_cents?: number | null
          is_listed?: boolean
          profile_views?: number
          rating_avg?: number
          rating_count?: number
          skills?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: Database["public"]["Enums"]["availability"]
          category?: Database["public"]["Enums"]["editor_category"]
          completed_count?: number
          created_at?: string
          headline?: string | null
          hourly_rate_cents?: number | null
          is_listed?: boolean
          profile_views?: number
          rating_avg?: number
          rating_count?: number
          skills?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_path: string | null
          content: string
          created_at: string
          id: string
          project_id: string
          sender_id: string | null
        }
        Insert: {
          attachment_path?: string | null
          content?: string
          created_at?: string
          id?: string
          project_id: string
          sender_id?: string | null
        }
        Update: {
          attachment_path?: string | null
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          project_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          project_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          project_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          category: Database["public"]["Enums"]["editor_category"] | null
          created_at: string
          description: string | null
          editor_id: string
          id: string
          media_path: string | null
          tags: string[]
          thumbnail_path: string | null
          title: string
          video_url: string | null
          view_count: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["editor_category"] | null
          created_at?: string
          description?: string | null
          editor_id: string
          id?: string
          media_path?: string | null
          tags?: string[]
          thumbnail_path?: string | null
          title: string
          video_url?: string | null
          view_count?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["editor_category"] | null
          created_at?: string
          description?: string | null
          editor_id?: string
          id?: string
          media_path?: string | null
          tags?: string[]
          thumbnail_path?: string | null
          title?: string
          video_url?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "editor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_view_log: {
        Row: {
          day: string
          editor_id: string
          viewer_id: string
        }
        Insert: {
          day?: string
          editor_id: string
          viewer_id: string
        }
        Update: {
          day?: string
          editor_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_view_log_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "editor_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_view_log_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          display_name: string
          id: string
          is_admin: boolean
          is_suspended: boolean
          is_verified: boolean
          location: string | null
          primary_role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          display_name: string
          id: string
          is_admin?: boolean
          is_suspended?: boolean
          is_verified?: boolean
          location?: string | null
          primary_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_admin?: boolean
          is_suspended?: boolean
          is_verified?: boolean
          location?: string | null
          primary_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      project_deliveries: {
        Row: {
          created_at: string
          editor_id: string | null
          file_path: string | null
          id: string
          note: string | null
          project_id: string
        }
        Insert: {
          created_at?: string
          editor_id?: string | null
          file_path?: string | null
          id?: string
          note?: string | null
          project_id: string
        }
        Update: {
          created_at?: string
          editor_id?: string | null
          file_path?: string | null
          id?: string
          note?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_deliveries_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deliveries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: number
          kind: string
          note: string | null
          project_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: never
          kind: string
          note?: string | null
          project_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: never
          kind?: string
          note?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_reads: {
        Row: {
          last_read_at: string
          project_id: string
          user_id: string
        }
        Insert: {
          last_read_at?: string
          project_id: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_reads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          accepted_at: string | null
          client_id: string | null
          closed_at: string | null
          completed_at: string | null
          created_at: string
          currency: string
          deadline: string | null
          delivered_at: string | null
          delivery_days: number
          description: string
          editor_id: string | null
          funded_at: string | null
          id: string
          payment_ref: string | null
          plan_id: string | null
          plan_name: string
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          platform_fee_cents: number
          price_cents: number
          progress: number
          revisions_allowed: number | null
          revisions_used: number
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          client_id?: string | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          delivered_at?: string | null
          delivery_days: number
          description?: string
          editor_id?: string | null
          funded_at?: string | null
          id?: string
          payment_ref?: string | null
          plan_id?: string | null
          plan_name: string
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          platform_fee_cents?: number
          price_cents: number
          progress?: number
          revisions_allowed?: number | null
          revisions_used?: number
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          client_id?: string | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          delivered_at?: string | null
          delivery_days?: number
          description?: string
          editor_id?: string | null
          funded_at?: string | null
          id?: string
          payment_ref?: string | null
          plan_id?: string | null
          plan_name?: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          platform_fee_cents?: number
          price_cents?: number
          progress?: number
          revisions_allowed?: number | null
          revisions_used?: number
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "service_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          client_id: string | null
          comment: string | null
          created_at: string
          editor_id: string | null
          project_id: string
          rating: number
        }
        Insert: {
          client_id?: string | null
          comment?: string | null
          created_at?: string
          editor_id?: string | null
          project_id: string
          rating: number
        }
        Update: {
          client_id?: string | null
          comment?: string | null
          created_at?: string
          editor_id?: string | null
          project_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_editors: {
        Row: {
          availability: Database["public"]["Enums"]["availability"]
          avatar_url: string | null
          bio: string | null
          category: Database["public"]["Enums"]["editor_category"]
          created_at: string
          display_name: string
          headline: string | null
          hourly_rate_cents: number | null
          id: string
          is_active: boolean
          portfolio: Json
          skills: string[]
          sort_order: number
          starting_price_cents: number | null
        }
        Insert: {
          availability?: Database["public"]["Enums"]["availability"]
          avatar_url?: string | null
          bio?: string | null
          category: Database["public"]["Enums"]["editor_category"]
          created_at?: string
          display_name: string
          headline?: string | null
          hourly_rate_cents?: number | null
          id?: string
          is_active?: boolean
          portfolio?: Json
          skills?: string[]
          sort_order?: number
          starting_price_cents?: number | null
        }
        Update: {
          availability?: Database["public"]["Enums"]["availability"]
          avatar_url?: string | null
          bio?: string | null
          category?: Database["public"]["Enums"]["editor_category"]
          created_at?: string
          display_name?: string
          headline?: string | null
          hourly_rate_cents?: number | null
          id?: string
          is_active?: boolean
          portfolio?: Json
          skills?: string[]
          sort_order?: number
          starting_price_cents?: number | null
        }
        Relationships: []
      }
      saved_editors: {
        Row: {
          created_at: string
          editor_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          editor_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          editor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_editors_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "editor_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saved_editors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_plans: {
        Row: {
          created_at: string
          delivery_days: number
          description: string | null
          editor_id: string
          features: string[]
          id: string
          is_active: boolean
          name: string
          price_cents: number
          revisions: number | null
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_days: number
          description?: string | null
          editor_id: string
          features?: string[]
          id?: string
          is_active?: boolean
          name: string
          price_cents: number
          revisions?: number | null
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_days?: number
          description?: string | null
          editor_id?: string
          features?: string[]
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          revisions?: number | null
          tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_plans_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "editor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          description: string
          id: string
          project_id: string | null
          provider_ref: string | null
          status: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          description: string
          id?: string
          project_id?: string | null
          provider_ref?: string | null
          status: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string
          id?: string
          project_id?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          type?: Database["public"]["Enums"]["txn_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      editor_cards: {
        Row: {
          availability: Database["public"]["Enums"]["availability"] | null
          avatar_url: string | null
          category: Database["public"]["Enums"]["editor_category"] | null
          completed_count: number | null
          cover_path: string | null
          cover_url: string | null
          cover_video_url: string | null
          display_name: string | null
          headline: string | null
          hourly_rate_cents: number | null
          id: string | null
          is_sample: boolean | null
          is_verified: boolean | null
          rating_avg: number | null
          rating_count: number | null
          skills: string[] | null
          sort_order: number | null
          starting_price_cents: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      account_deletion_blockers: { Args: never; Returns: string[] }
      approve_delivery: { Args: { p_project_id: string }; Returns: undefined }
      client_cancel: {
        Args: { p_note?: string; p_project_id: string }
        Returns: undefined
      }
      create_project: {
        Args: { p_description?: string; p_plan_id: string; p_title: string }
        Returns: string
      }
      editor_respond: {
        Args: { p_accept: boolean; p_note?: string; p_project_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_project_participant: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      leave_review: {
        Args: { p_comment?: string; p_project_id: string; p_rating: number }
        Returns: undefined
      }
      lock_project: {
        Args: { p_project_id: string; p_side: string }
        Returns: {
          accepted_at: string | null
          client_id: string | null
          closed_at: string | null
          completed_at: string | null
          created_at: string
          currency: string
          deadline: string | null
          delivered_at: string | null
          delivery_days: number
          description: string
          editor_id: string | null
          funded_at: string | null
          id: string
          payment_ref: string | null
          plan_id: string | null
          plan_name: string
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          platform_fee_cents: number
          price_cents: number
          progress: number
          revisions_allowed: number | null
          revisions_used: number
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      log_project_event: {
        Args: { p_kind: string; p_note?: string; p_project_id: string }
        Returns: undefined
      }
      mark_escrow_funded: {
        Args: { p_payment_ref: string; p_project_id: string }
        Returns: undefined
      }
      mark_project_read: { Args: { p_project_id: string }; Returns: undefined }
      mfa_ok: { Args: never; Returns: boolean }
      my_analytics: { Args: never; Returns: Json }
      my_conversations: {
        Args: never
        Returns: {
          last_message: string
          last_message_at: string
          other_avatar_url: string
          other_id: string
          other_name: string
          project_id: string
          project_status: Database["public"]["Enums"]["project_status"]
          project_title: string
          unread_count: number
        }[]
      }
      notify: {
        Args: {
          p_body: string
          p_kind: string
          p_project: string
          p_title: string
          p_user: string
        }
        Returns: undefined
      }
      open_dispute: {
        Args: { p_project_id: string; p_reason: string }
        Returns: undefined
      }
      record_profile_view: { Args: { p_editor_id: string }; Returns: undefined }
      refund_escrow: {
        Args: {
          p_project: Database["public"]["Tables"]["projects"]["Row"]
          p_reason: string
        }
        Returns: undefined
      }
      release_escrow: {
        Args: { p_project: Database["public"]["Tables"]["projects"]["Row"] }
        Returns: undefined
      }
      request_revision: {
        Args: { p_note: string; p_project_id: string }
        Returns: undefined
      }
      request_withdrawal: { Args: { p_amount_cents: number }; Returns: string }
      require_member: { Args: never; Returns: string }
      resolve_dispute: {
        Args: { p_note: string; p_pay_editor: boolean; p_project_id: string }
        Returns: undefined
      }
      run_payments_worker: { Args: never; Returns: undefined }
      sample_categories: {
        Args: never
        Returns: Database["public"]["Enums"]["editor_category"][]
      }
      settle_transaction: {
        Args: { p_ok: boolean; p_provider_ref?: string; p_txn_id: string }
        Returns: undefined
      }
      storage_project_id: { Args: { p_name: string }; Returns: string }
      submit_delivery: {
        Args: { p_file_path?: string; p_note?: string; p_project_id: string }
        Returns: string
      }
      update_progress: {
        Args: { p_progress: number; p_project_id: string }
        Returns: undefined
      }
      wallet_summary: {
        Args: never
        Returns: {
          available_cents: number
          in_escrow_cents: number
          incoming_cents: number
          pending_withdrawal_cents: number
          total_earned_cents: number
          total_spent_cents: number
        }[]
      }
    }
    Enums: {
      availability: "available" | "busy" | "offline"
      editor_category:
        | "video_editor"
        | "motion_designer"
        | "animator"
        | "colorist"
        | "vfx_artist"
        | "youtube_editor"
      plan_tier: "basic" | "standard" | "premium"
      project_status:
        | "awaiting_payment"
        | "secured"
        | "in_progress"
        | "review"
        | "completed"
        | "declined"
        | "cancelled"
        | "disputed"
      txn_status:
        | "pending"
        | "in_escrow"
        | "released"
        | "refunded"
        | "completed"
        | "failed"
      txn_type: "escrow" | "payment" | "refund" | "withdrawal"
      user_role: "client" | "editor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      availability: ["available", "busy", "offline"],
      editor_category: [
        "video_editor",
        "motion_designer",
        "animator",
        "colorist",
        "vfx_artist",
        "youtube_editor",
      ],
      plan_tier: ["basic", "standard", "premium"],
      project_status: [
        "awaiting_payment",
        "secured",
        "in_progress",
        "review",
        "completed",
        "declined",
        "cancelled",
        "disputed",
      ],
      txn_status: [
        "pending",
        "in_escrow",
        "released",
        "refunded",
        "completed",
        "failed",
      ],
      txn_type: ["escrow", "payment", "refund", "withdrawal"],
      user_role: ["client", "editor"],
    },
  },
} as const
