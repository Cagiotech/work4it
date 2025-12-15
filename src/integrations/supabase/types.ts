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
      companies: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          key: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          key: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          key?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarding_completed: boolean
          role_position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          role_position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          role_position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: Database["public"]["Enums"]["permission_action"]
          created_at: string
          id: string
          module_key: string
          role_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["permission_action"]
          created_at?: string
          id?: string
          module_key: string
          role_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["permission_action"]
          created_at?: string
          id?: string
          module_key?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_module_key_fkey"
            columns: ["module_key"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_admin: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_admin?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_admin?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          company_id: string
          created_at: string
          email: string
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          position: string | null
          role_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          position?: string | null
          role_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          position?: string | null
          role_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_anamnesis: {
        Row: {
          additional_notes: string | null
          alcohol_consumption: string | null
          allergies_description: string | null
          available_days_per_week: number | null
          body_fat_percentage: number | null
          created_at: string
          current_activity_level: string | null
          current_medications: string | null
          doctor_clearance: boolean | null
          doctor_contact: string | null
          doctor_name: string | null
          fitness_goals: string | null
          has_allergies: boolean | null
          has_back_problems: boolean | null
          has_diabetes: boolean | null
          has_heart_condition: boolean | null
          has_hypertension: boolean | null
          has_joint_problems: boolean | null
          has_respiratory_issues: boolean | null
          height_cm: number | null
          id: string
          injuries_history: string | null
          is_smoker: boolean | null
          preferred_training_time: string | null
          previous_exercise_experience: string | null
          previous_surgeries: string | null
          sleep_hours_avg: number | null
          stress_level: string | null
          student_id: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          additional_notes?: string | null
          alcohol_consumption?: string | null
          allergies_description?: string | null
          available_days_per_week?: number | null
          body_fat_percentage?: number | null
          created_at?: string
          current_activity_level?: string | null
          current_medications?: string | null
          doctor_clearance?: boolean | null
          doctor_contact?: string | null
          doctor_name?: string | null
          fitness_goals?: string | null
          has_allergies?: boolean | null
          has_back_problems?: boolean | null
          has_diabetes?: boolean | null
          has_heart_condition?: boolean | null
          has_hypertension?: boolean | null
          has_joint_problems?: boolean | null
          has_respiratory_issues?: boolean | null
          height_cm?: number | null
          id?: string
          injuries_history?: string | null
          is_smoker?: boolean | null
          preferred_training_time?: string | null
          previous_exercise_experience?: string | null
          previous_surgeries?: string | null
          sleep_hours_avg?: number | null
          stress_level?: string | null
          student_id: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          additional_notes?: string | null
          alcohol_consumption?: string | null
          allergies_description?: string | null
          available_days_per_week?: number | null
          body_fat_percentage?: number | null
          created_at?: string
          current_activity_level?: string | null
          current_medications?: string | null
          doctor_clearance?: boolean | null
          doctor_contact?: string | null
          doctor_name?: string | null
          fitness_goals?: string | null
          has_allergies?: boolean | null
          has_back_problems?: boolean | null
          has_diabetes?: boolean | null
          has_heart_condition?: boolean | null
          has_hypertension?: boolean | null
          has_joint_problems?: boolean | null
          has_respiratory_issues?: boolean | null
          height_cm?: number | null
          id?: string
          injuries_history?: string | null
          is_smoker?: boolean | null
          preferred_training_time?: string | null
          previous_exercise_experience?: string | null
          previous_surgeries?: string | null
          sleep_hours_avg?: number | null
          stress_level?: string | null
          student_id?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_anamnesis_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_private: boolean | null
          student_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_private?: boolean | null
          student_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_private?: boolean | null
          student_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_subscriptions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          payment_status: string | null
          plan_id: string
          start_date: string
          status: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          payment_status?: string | null
          plan_id: string
          start_date?: string
          status?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          payment_status?: string | null
          plan_id?: string
          start_date?: string
          status?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subscriptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          birth_date: string | null
          citizen_card: string | null
          city: string | null
          company_id: string
          country: string | null
          created_at: string
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          enrollment_date: string | null
          full_name: string
          gender: string | null
          health_notes: string | null
          id: string
          nationality: string | null
          nif: string | null
          niss: string | null
          password_changed: boolean | null
          personal_trainer_id: string | null
          phone: string | null
          postal_code: string | null
          profile_photo_url: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          citizen_card?: string | null
          city?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          enrollment_date?: string | null
          full_name: string
          gender?: string | null
          health_notes?: string | null
          id?: string
          nationality?: string | null
          nif?: string | null
          niss?: string | null
          password_changed?: boolean | null
          personal_trainer_id?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_photo_url?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          citizen_card?: string | null
          city?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          enrollment_date?: string | null
          full_name?: string
          gender?: string | null
          health_notes?: string | null
          id?: string
          nationality?: string | null
          nif?: string | null
          niss?: string | null
          password_changed?: boolean | null
          personal_trainer_id?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_photo_url?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_personal_trainer_id_fkey"
            columns: ["personal_trainer_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_default_roles_for_company: {
        Args: { p_company_id: string }
        Returns: undefined
      }
    }
    Enums: {
      permission_action:
        | "view"
        | "create"
        | "edit"
        | "delete"
        | "export"
        | "import"
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
      permission_action: [
        "view",
        "create",
        "edit",
        "delete",
        "export",
        "import",
      ],
    },
  },
} as const
