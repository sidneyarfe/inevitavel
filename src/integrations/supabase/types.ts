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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      anchor_habits: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_system: boolean
          name: string
          sort_order: number
          typical_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name: string
          sort_order?: number
          typical_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name?: string
          sort_order?: number
          typical_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          mode: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_executions: {
        Row: {
          completion_type: string
          created_at: string
          duration_seconds: number | null
          execution_date: string
          habit_id: string
          id: string
          status: Database["public"]["Enums"]["execution_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_type?: string
          created_at?: string
          duration_seconds?: number | null
          execution_date?: string
          habit_id: string
          id?: string
          status?: Database["public"]["Enums"]["execution_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_type?: string
          created_at?: string
          duration_seconds?: number | null
          execution_date?: string
          habit_id?: string
          id?: string
          status?: Database["public"]["Enums"]["execution_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_executions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_todos: {
        Row: {
          created_at: string
          id: string
          is_done: boolean
          sort_order: number
          text: string
          todo_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_done?: boolean
          sort_order?: number
          text: string
          todo_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_done?: boolean
          sort_order?: number
          text?: string
          todo_date?: string
          user_id?: string
        }
        Relationships: []
      }
      evening_briefings: {
        Row: {
          all_confirmed: boolean
          briefing_date: string
          checklist_items: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_confirmed?: boolean
          briefing_date?: string
          checklist_items?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_confirmed?: boolean
          briefing_date?: string
          checklist_items?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      friction_audits: {
        Row: {
          created_at: string
          execution_id: string
          id: string
          reason: string
          suggestion: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          execution_id: string
          id?: string
          reason: string
          suggestion?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          execution_id?: string
          id?: string
          reason?: string
          suggestion?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friction_audits_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "daily_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          anchor_id: string | null
          anchor_position: string
          anchor_sort_order: number
          created_at: string
          days_of_week: number[]
          full_duration: number | null
          id: string
          is_active: boolean
          micro_action: string
          name: string
          preferred_time: string | null
          timer_duration: number
          trigger_cue: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anchor_id?: string | null
          anchor_position?: string
          anchor_sort_order?: number
          created_at?: string
          days_of_week?: number[]
          full_duration?: number | null
          id?: string
          is_active?: boolean
          micro_action?: string
          name: string
          preferred_time?: string | null
          timer_duration?: number
          trigger_cue?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anchor_id?: string | null
          anchor_position?: string
          anchor_sort_order?: number
          created_at?: string
          days_of_week?: number[]
          full_duration?: number | null
          id?: string
          is_active?: boolean
          micro_action?: string
          name?: string
          preferred_time?: string | null
          timer_duration?: number
          trigger_cue?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_anchor_id_fkey"
            columns: ["anchor_id"]
            isOneToOne: false
            referencedRelation: "anchor_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          briefing_hour: number
          checklist_template: Json
          created_at: string
          display_name: string | null
          id: string
          notify_advance_minutes: number
          notify_briefing: boolean
          notify_habits: boolean
          sleep_time: string
          timezone: string
          updated_at: string
          user_id: string
          wake_time: string
        }
        Insert: {
          briefing_hour?: number
          checklist_template?: Json
          created_at?: string
          display_name?: string | null
          id?: string
          notify_advance_minutes?: number
          notify_briefing?: boolean
          notify_habits?: boolean
          sleep_time?: string
          timezone?: string
          updated_at?: string
          user_id: string
          wake_time?: string
        }
        Update: {
          briefing_hour?: number
          checklist_template?: Json
          created_at?: string
          display_name?: string | null
          id?: string
          notify_advance_minutes?: number
          notify_briefing?: boolean
          notify_habits?: boolean
          sleep_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          wake_time?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
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
      execution_status: "pending" | "executed" | "failed"
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
  public: {
    Enums: {
      execution_status: ["pending", "executed", "failed"],
    },
  },
} as const
