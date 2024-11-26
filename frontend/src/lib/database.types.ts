export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      chat: {
        Row: {
          author: string | null
          content: string | null
          created_at: string
          extra: Json | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string
          extra?: Json | null
          id?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string
          extra?: Json | null
          id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course: {
        Row: {
          canvas_id: number | null
          code: string | null
          created_at: string
          description: string | null
          hidden: boolean | null
          id: number
          instructor: string | null
          link: string | null
          name: string
          updated_at: string
        }
        Insert: {
          canvas_id?: number | null
          code?: string | null
          created_at?: string
          description?: string | null
          hidden?: boolean | null
          id?: number
          instructor?: string | null
          link?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          canvas_id?: number | null
          code?: string | null
          created_at?: string
          description?: string | null
          hidden?: boolean | null
          id?: number
          instructor?: string | null
          link?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_material: {
        Row: {
          canvas_id: string | null
          course_id: number
          created_at: string
          id: number
          name: string | null
          type: Database["public"]["Enums"]["COURSE_MATERIAL_TYPE"]
          updated_at: string
          url: string | null
        }
        Insert: {
          canvas_id?: string | null
          course_id: number
          created_at?: string
          id?: number
          name?: string | null
          type: Database["public"]["Enums"]["COURSE_MATERIAL_TYPE"]
          updated_at?: string
          url?: string | null
        }
        Update: {
          canvas_id?: string | null
          course_id?: number
          created_at?: string
          id?: number
          name?: string | null
          type?: Database["public"]["Enums"]["COURSE_MATERIAL_TYPE"]
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_material_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
        ]
      }
      course_membership: {
        Row: {
          course_id: number
          created_at: string
          id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: number
          created_at?: string
          id?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: number
          created_at?: string
          id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_membership_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_membership_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration: {
        Row: {
          created_at: string
          expire_at: string | null
          id: number
          refresh_token: string | null
          token: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expire_at?: string | null
          id?: number
          refresh_token?: string | null
          token: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expire_at?: string | null
          id?: number
          refresh_token?: string | null
          token?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      preference: {
        Row: {
          created_at: string
          id: number
          primary_calendar: string | null
          scheduling_prompt: string | null
          study_type: string | null
          task_extraction_prompt: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          primary_calendar?: string | null
          scheduling_prompt?: string | null
          study_type?: string | null
          task_extraction_prompt?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          primary_calendar?: string | null
          scheduling_prompt?: string | null
          study_type?: string | null
          task_extraction_prompt?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preference_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
        }
        Update: {
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
        }
        Relationships: []
      }
      task: {
        Row: {
          created_at: string
          description: string | null
          due_at: string | null
          end_at: string | null
          id: number
          link: string | null
          name: string
          start_at: string | null
          type: Database["public"]["Enums"]["TASK_TYPE"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_at?: string | null
          end_at?: string | null
          id?: number
          link?: string | null
          name: string
          start_at?: string | null
          type?: Database["public"]["Enums"]["TASK_TYPE"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_at?: string | null
          end_at?: string | null
          id?: number
          link?: string | null
          name?: string
          start_at?: string | null
          type?: Database["public"]["Enums"]["TASK_TYPE"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      COURSE_MATERIAL_TYPE: "PDF" | "IMAGE" | "URL"
      TASK_TYPE: "ASSIGNMENT" | "STUDY" | "SOCIAL" | "CHORE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
