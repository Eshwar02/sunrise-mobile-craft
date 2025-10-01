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
  public: {
    Tables: {
      bookmarks: {
        Row: {
          book_id: string
          created_at: string
          id: string
          note: string | null
          page_number: number
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          note?: string | null
          page_number: number
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          note?: string | null
          page_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          ai_summary: string | null
          author: string
          content_url: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          genre: string | null
          id: string
          isbn: string | null
          language: string | null
          page_count: number | null
          rating: number | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          author: string
          content_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          page_count?: number | null
          rating?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          author?: string
          content_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          page_count?: number | null
          rating?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      offline_content: {
        Row: {
          book_id: string
          content_data: Json | null
          created_at: string
          downloaded_at: string
          expires_at: string | null
          id: string
          last_accessed_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          content_data?: Json | null
          created_at?: string
          downloaded_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          content_data?: Json | null
          created_at?: string
          downloaded_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          language_preference: string | null
          reading_preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          language_preference?: string | null
          reading_preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          language_preference?: string | null
          reading_preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          book_id: string
          created_at: string
          ended_at: string | null
          id: string
          minutes_spent: number | null
          pages_read: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          minutes_spent?: number | null
          pages_read?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          minutes_spent?: number | null
          pages_read?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_statistics: {
        Row: {
          books_completed: number | null
          created_at: string
          date: string
          id: string
          minutes_read: number | null
          pages_read: number | null
          user_id: string
        }
        Insert: {
          books_completed?: number | null
          created_at?: string
          date?: string
          id?: string
          minutes_read?: number | null
          pages_read?: number | null
          user_id: string
        }
        Update: {
          books_completed?: number | null
          created_at?: string
          date?: string
          id?: string
          minutes_read?: number | null
          pages_read?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_library: {
        Row: {
          added_at: string
          book_id: string
          completed_at: string | null
          current_page: number | null
          downloaded_at: string | null
          id: string
          last_read_at: string | null
          progress: number | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          book_id: string
          completed_at?: string | null
          current_page?: number | null
          downloaded_at?: string | null
          id?: string
          last_read_at?: string | null
          progress?: number | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          book_id?: string
          completed_at?: string | null
          current_page?: number | null
          downloaded_at?: string | null
          id?: string
          last_read_at?: string | null
          progress?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_library_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
