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
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_banners: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          message: string
          starts_at: string | null
          target_audience: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message: string
          starts_at?: string | null
          target_audience?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message?: string
          starts_at?: string | null
          target_audience?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_communications: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          scheduled_for: string | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          target_audience: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_audience?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_audience?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_company_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          company_id: string
          created_at: string
          id: string
          performed_by: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          company_id: string
          created_at?: string
          id?: string
          performed_by: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          company_id?: string
          created_at?: string
          id?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_company_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      admin_invoices: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          status: string | null
          subscription_id: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_id?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "company_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_plans: {
        Row: {
          billing_cycle: string
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_staff: number | null
          max_students: number | null
          name: string
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_staff?: number | null
          max_students?: number | null
          name: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_staff?: number | null
          max_students?: number | null
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          allow_registration: boolean | null
          api_enabled: boolean | null
          bank_name: string | null
          billing_address: string | null
          billing_email: string | null
          billing_name: string | null
          created_at: string
          default_language: string | null
          from_email: string | null
          from_name: string | null
          iban: string | null
          id: string
          lockout_attempts: number | null
          lockout_enabled: boolean | null
          maintenance_mode: boolean | null
          mbway_phone: string | null
          nif: string | null
          notify_new_companies: boolean | null
          notify_new_suggestions: boolean | null
          notify_pending_payments: boolean | null
          notify_system_errors: boolean | null
          platform_description: string | null
          platform_name: string | null
          platform_url: string | null
          rate_limit: number | null
          require_2fa: boolean | null
          session_expiry: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_user: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          allow_registration?: boolean | null
          api_enabled?: boolean | null
          bank_name?: string | null
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          created_at?: string
          default_language?: string | null
          from_email?: string | null
          from_name?: string | null
          iban?: string | null
          id?: string
          lockout_attempts?: number | null
          lockout_enabled?: boolean | null
          maintenance_mode?: boolean | null
          mbway_phone?: string | null
          nif?: string | null
          notify_new_companies?: boolean | null
          notify_new_suggestions?: boolean | null
          notify_pending_payments?: boolean | null
          notify_system_errors?: boolean | null
          platform_description?: string | null
          platform_name?: string | null
          platform_url?: string | null
          rate_limit?: number | null
          require_2fa?: boolean | null
          session_expiry?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          allow_registration?: boolean | null
          api_enabled?: boolean | null
          bank_name?: string | null
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          created_at?: string
          default_language?: string | null
          from_email?: string | null
          from_name?: string | null
          iban?: string | null
          id?: string
          lockout_attempts?: number | null
          lockout_enabled?: boolean | null
          maintenance_mode?: boolean | null
          mbway_phone?: string | null
          nif?: string | null
          notify_new_companies?: boolean | null
          notify_new_suggestions?: boolean | null
          notify_pending_payments?: boolean | null
          notify_system_errors?: boolean | null
          platform_description?: string | null
          platform_name?: string | null
          platform_url?: string | null
          rate_limit?: number | null
          require_2fa?: boolean | null
          session_expiry?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      class_enrollments: {
        Row: {
          attended_at: string | null
          class_schedule_id: string
          created_at: string
          enrolled_at: string
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          attended_at?: string | null
          class_schedule_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          attended_at?: string | null
          class_schedule_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_schedule_id_fkey"
            columns: ["class_schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          class_id: string
          created_at: string
          end_time: string
          id: string
          instructor_id: string | null
          notes: string | null
          scheduled_date: string
          start_time: string
          status: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          end_time: string
          id?: string
          instructor_id?: string | null
          notes?: string | null
          scheduled_date: string
          start_time: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          end_time?: string
          id?: string
          instructor_id?: string | null
          notes?: string | null
          scheduled_date?: string
          start_time?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number
          color: string | null
          company_id: string
          created_at: string
          default_days_of_week: number[] | null
          default_end_time: string | null
          default_instructor_id: string | null
          default_start_time: string | null
          description: string | null
          duration_minutes: number
          has_fixed_schedule: boolean | null
          id: string
          is_active: boolean | null
          name: string
          room_id: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number
          color?: string | null
          company_id: string
          created_at?: string
          default_days_of_week?: number[] | null
          default_end_time?: string | null
          default_instructor_id?: string | null
          default_start_time?: string | null
          description?: string | null
          duration_minutes?: number
          has_fixed_schedule?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          room_id?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number
          color?: string | null
          company_id?: string
          created_at?: string
          default_days_of_week?: number[] | null
          default_end_time?: string | null
          default_instructor_id?: string | null
          default_start_time?: string | null
          description?: string | null
          duration_minutes?: number
          has_fixed_schedule?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          room_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_default_instructor_id_fkey"
            columns: ["default_instructor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          anamnesis_filled_by: string | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          created_at: string
          created_by: string
          has_active_subscription: boolean | null
          id: string
          is_blocked: boolean | null
          mbway_phone: string | null
          name: string | null
          registration_code: string | null
          regulations_text: string | null
          require_student_approval: boolean | null
          terms_text: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          anamnesis_filled_by?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          created_at?: string
          created_by: string
          has_active_subscription?: boolean | null
          id?: string
          is_blocked?: boolean | null
          mbway_phone?: string | null
          name?: string | null
          registration_code?: string | null
          regulations_text?: string | null
          require_student_approval?: boolean | null
          terms_text?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          anamnesis_filled_by?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          created_at?: string
          created_by?: string
          has_active_subscription?: boolean | null
          id?: string
          is_blocked?: boolean | null
          mbway_phone?: string | null
          name?: string | null
          registration_code?: string | null
          regulations_text?: string | null
          require_student_approval?: boolean | null
          terms_text?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_subscriptions: {
        Row: {
          cancelled_at: string | null
          company_id: string
          coupon_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          company_id: string
          coupon_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          company_id?: string
          coupon_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "admin_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "admin_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          brand: string | null
          category_id: string | null
          company_id: string
          created_at: string
          current_value: number | null
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_value: number | null
          serial_number: string | null
          status: string
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          company_id: string
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          company_id?: string
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_categories: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_maintenance: {
        Row: {
          company_id: string
          cost: number | null
          created_at: string
          description: string | null
          equipment_id: string
          id: string
          maintenance_type: string
          next_maintenance_date: string | null
          notes: string | null
          performed_at: string
          performed_by: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          cost?: number | null
          created_at?: string
          description?: string | null
          equipment_id: string
          id?: string
          maintenance_type: string
          next_maintenance_date?: string | null
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          cost?: number | null
          created_at?: string
          description?: string | null
          equipment_id?: string
          id?: string
          maintenance_type?: string
          next_maintenance_date?: string | null
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string | null
          id: string
          is_public: boolean | null
          location: string | null
          max_participants: number | null
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          max_participants?: number | null
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          max_participants?: number | null
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_suggestions: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          category: string | null
          company_id: string
          created_at: string
          description: string
          id: string
          is_public: boolean | null
          status: string
          submitted_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          company_id: string
          created_at?: string
          description: string
          id?: string
          is_public?: boolean | null
          status?: string
          submitted_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean | null
          status?: string
          submitted_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_suggestions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category_id: string | null
          company_id: string
          created_at: string
          description: string
          due_date: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          staff_id: string | null
          status: string
          student_id: string | null
          subscription_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          company_id: string
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          staff_id?: string | null
          status?: string
          student_id?: string | null
          subscription_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          company_id?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          staff_id?: string | null
          status?: string
          student_id?: string | null
          subscription_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "student_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          new_quantity: number
          previous_quantity: number
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          total_amount: number | null
          unit_price: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          new_quantity: number
          previous_quantity: number
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          total_amount?: number | null
          unit_price?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          new_quantity?: number
          previous_quantity?: number
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          total_amount?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          read_at: string | null
          receiver_id: string
          receiver_type: string
          sender_id: string
          sender_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          receiver_id: string
          receiver_type: string
          sender_id: string
          sender_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          receiver_id?: string
          receiver_type?: string
          sender_id?: string
          sender_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_meal_plans: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_meal_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plan_days: {
        Row: {
          calories_target: number | null
          carbs_target: number | null
          created_at: string
          day_of_week: number
          fat_target: number | null
          id: string
          notes: string | null
          plan_id: string
          protein_target: number | null
          updated_at: string
        }
        Insert: {
          calories_target?: number | null
          carbs_target?: number | null
          created_at?: string
          day_of_week: number
          fat_target?: number | null
          id?: string
          notes?: string | null
          plan_id: string
          protein_target?: number | null
          updated_at?: string
        }
        Update: {
          calories_target?: number | null
          carbs_target?: number | null
          created_at?: string
          day_of_week?: number
          fat_target?: number | null
          id?: string
          notes?: string | null
          plan_id?: string
          protein_target?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plan_meals: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string
          day_id: string
          description: string | null
          fat: number | null
          foods: string | null
          id: string
          meal_time: string | null
          meal_type: string
          protein: number | null
          sort_order: number | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          day_id: string
          description?: string | null
          fat?: number | null
          foods?: string | null
          id?: string
          meal_time?: string | null
          meal_type: string
          protein?: number | null
          sort_order?: number | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          day_id?: string
          description?: string | null
          fat?: number | null
          foods?: string | null
          id?: string
          meal_time?: string | null
          meal_type?: string
          protein?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plan_meals_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_requests: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          id: string
          new_password: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string | null
          user_type: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          id?: string
          new_password?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
          user_type: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          new_password?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          proof_file_name: string
          proof_file_path: string
          proof_file_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          subscription_id: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          proof_file_name: string
          proof_file_path: string
          proof_file_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id: string
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          proof_file_name?: string
          proof_file_path?: string
          proof_file_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "student_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          company_id: string
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          min_stock_level: number | null
          name: string
          price: number
          sku: string | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          company_id: string
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock_level?: number | null
          name: string
          price?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          company_id?: string
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock_level?: number | null
          name?: string
          price?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          color: string | null
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
          color?: string | null
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
          color?: string | null
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
      rooms: {
        Row: {
          capacity: number
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          discount_percent: number | null
          id: string
          product_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          product_id: string
          quantity?: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          company_id: string
          created_at: string
          discount_amount: number | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          sale_number: string | null
          sold_by: string | null
          student_id: string | null
          subtotal: number
          total_amount: number
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          discount_amount?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          sale_number?: string | null
          sold_by?: string | null
          student_id?: string | null
          subtotal?: number
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          discount_amount?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          sale_number?: string | null
          sold_by?: string | null
          student_id?: string | null
          subtotal?: number
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      signed_documents: {
        Row: {
          company_id: string
          created_at: string
          document_content: string
          document_type: string
          id: string
          ip_address: string | null
          signed_at: string
          student_id: string
          user_agent: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          document_content: string
          document_type: string
          id?: string
          ip_address?: string | null
          signed_at?: string
          student_id: string
          user_agent?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          document_content?: string
          document_type?: string
          id?: string
          ip_address?: string | null
          signed_at?: string
          student_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signed_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          address: string | null
          citizen_card: string | null
          city: string | null
          company_id: string
          contract_type: string | null
          country: string | null
          created_at: string
          email: string
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          password_changed: boolean | null
          phone: string | null
          position: string | null
          postal_code: string | null
          role_id: string | null
          updated_at: string
          user_id: string | null
          weekly_hours: number | null
        }
        Insert: {
          address?: string | null
          citizen_card?: string | null
          city?: string | null
          company_id: string
          contract_type?: string | null
          country?: string | null
          created_at?: string
          email: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          password_changed?: boolean | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          role_id?: string | null
          updated_at?: string
          user_id?: string | null
          weekly_hours?: number | null
        }
        Update: {
          address?: string | null
          citizen_card?: string | null
          city?: string | null
          company_id?: string
          contract_type?: string | null
          country?: string | null
          created_at?: string
          email?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          password_changed?: boolean | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          role_id?: string | null
          updated_at?: string
          user_id?: string | null
          weekly_hours?: number | null
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
      staff_absences: {
        Row: {
          absence_type: string
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          end_date: string
          id: string
          notes: string | null
          reason: string | null
          staff_id: string
          start_date: string
          status: string | null
          total_days: number
          updated_at: string
        }
        Insert: {
          absence_type: string
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          end_date: string
          id?: string
          notes?: string | null
          reason?: string | null
          staff_id: string
          start_date: string
          status?: string | null
          total_days: number
          updated_at?: string
        }
        Update: {
          absence_type?: string
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          end_date?: string
          id?: string
          notes?: string | null
          reason?: string | null
          staff_id?: string
          start_date?: string
          status?: string | null
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_absences_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_absences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_absences_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_classes: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          class_id: string
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          class_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          class_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_classes_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_documents: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          document_type: string
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          staff_id: string
          uploaded_by: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          document_type: string
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          staff_id: string
          uploaded_by: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          staff_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_evaluations: {
        Row: {
          areas_to_improve: string | null
          communication_score: number | null
          company_id: string
          created_at: string
          evaluation_date: string
          evaluation_period: string | null
          evaluator_id: string | null
          feedback: string | null
          goals: string | null
          id: string
          initiative_score: number | null
          overall_score: number | null
          punctuality_score: number | null
          staff_id: string
          status: string | null
          strengths: string | null
          teamwork_score: number | null
          technical_score: number | null
          updated_at: string
        }
        Insert: {
          areas_to_improve?: string | null
          communication_score?: number | null
          company_id: string
          created_at?: string
          evaluation_date?: string
          evaluation_period?: string | null
          evaluator_id?: string | null
          feedback?: string | null
          goals?: string | null
          id?: string
          initiative_score?: number | null
          overall_score?: number | null
          punctuality_score?: number | null
          staff_id: string
          status?: string | null
          strengths?: string | null
          teamwork_score?: number | null
          technical_score?: number | null
          updated_at?: string
        }
        Update: {
          areas_to_improve?: string | null
          communication_score?: number | null
          company_id?: string
          created_at?: string
          evaluation_date?: string
          evaluation_period?: string | null
          evaluator_id?: string | null
          feedback?: string | null
          goals?: string | null
          id?: string
          initiative_score?: number | null
          overall_score?: number | null
          punctuality_score?: number | null
          staff_id?: string
          status?: string | null
          strengths?: string | null
          teamwork_score?: number | null
          technical_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_evaluations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_evaluations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_leave_balances: {
        Row: {
          company_id: string
          created_at: string
          id: string
          personal_days_entitled: number | null
          personal_days_used: number | null
          sick_days_used: number | null
          staff_id: string
          updated_at: string
          vacation_days_entitled: number | null
          vacation_days_used: number | null
          year: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          personal_days_entitled?: number | null
          personal_days_used?: number | null
          sick_days_used?: number | null
          staff_id: string
          updated_at?: string
          vacation_days_entitled?: number | null
          vacation_days_used?: number | null
          year: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          personal_days_entitled?: number | null
          personal_days_used?: number | null
          sick_days_used?: number | null
          staff_id?: string
          updated_at?: string
          vacation_days_entitled?: number | null
          vacation_days_used?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_leave_balances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_leave_balances_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_payment_config: {
        Row: {
          bank_iban: string | null
          bank_name: string | null
          base_salary: number | null
          commission_percentage: number | null
          created_at: string
          daily_rate: number | null
          hourly_rate: number | null
          id: string
          nif: string | null
          niss: string | null
          payment_type: string
          per_class_rate: number | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          bank_iban?: string | null
          bank_name?: string | null
          base_salary?: number | null
          commission_percentage?: number | null
          created_at?: string
          daily_rate?: number | null
          hourly_rate?: number | null
          id?: string
          nif?: string | null
          niss?: string | null
          payment_type?: string
          per_class_rate?: number | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          bank_iban?: string | null
          bank_name?: string | null
          base_salary?: number | null
          commission_percentage?: number | null
          created_at?: string
          daily_rate?: number | null
          hourly_rate?: number | null
          id?: string
          nif?: string | null
          niss?: string | null
          payment_type?: string
          per_class_rate?: number | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_payment_config_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_time_records: {
        Row: {
          break_duration_minutes: number | null
          break_end: string | null
          break_start: string | null
          clock_in: string
          clock_out: string | null
          company_id: string
          created_at: string
          id: string
          notes: string | null
          overtime_hours: number | null
          staff_id: string
          status: string | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          break_duration_minutes?: number | null
          break_end?: string | null
          break_start?: string | null
          clock_in: string
          clock_out?: string | null
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          staff_id: string
          status?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          break_duration_minutes?: number | null
          break_end?: string | null
          break_start?: string | null
          clock_in?: string
          clock_out?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          staff_id?: string
          status?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_time_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_trainings: {
        Row: {
          certification_number: string | null
          company_id: string
          completion_date: string | null
          cost: number | null
          created_at: string
          document_id: string | null
          expiry_date: string | null
          hours: number | null
          id: string
          institution: string | null
          notes: string | null
          staff_id: string
          start_date: string | null
          status: string | null
          training_name: string
          updated_at: string
        }
        Insert: {
          certification_number?: string | null
          company_id: string
          completion_date?: string | null
          cost?: number | null
          created_at?: string
          document_id?: string | null
          expiry_date?: string | null
          hours?: number | null
          id?: string
          institution?: string | null
          notes?: string | null
          staff_id: string
          start_date?: string | null
          status?: string | null
          training_name: string
          updated_at?: string
        }
        Update: {
          certification_number?: string | null
          company_id?: string
          completion_date?: string | null
          cost?: number | null
          created_at?: string
          document_id?: string | null
          expiry_date?: string | null
          hours?: number | null
          id?: string
          institution?: string | null
          notes?: string | null
          staff_id?: string
          start_date?: string | null
          status?: string | null
          training_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_trainings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_trainings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "staff_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_trainings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_work_schedules: {
        Row: {
          break_end: string | null
          break_start: string | null
          company_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_working_day: boolean | null
          staff_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          company_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_working_day?: boolean | null
          staff_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          company_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_working_day?: boolean | null
          staff_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_work_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_work_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
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
      student_classes: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          class_id: string
          created_at: string
          id: string
          is_active: boolean | null
          notes: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          class_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          class_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_classes_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_classes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          student_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          student_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          student_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          student_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_group_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_groups: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      student_nutrition_plans: {
        Row: {
          calories_target: number | null
          carbs_target: number | null
          created_at: string
          day_of_week: number | null
          description: string | null
          fat_target: number | null
          id: string
          is_active: boolean | null
          meal_type: string | null
          meals: string | null
          notes: string | null
          protein_target: number | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          calories_target?: number | null
          carbs_target?: number | null
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          fat_target?: number | null
          id?: string
          is_active?: boolean | null
          meal_type?: string | null
          meals?: string | null
          notes?: string | null
          protein_target?: number | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          calories_target?: number | null
          carbs_target?: number | null
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          fat_target?: number | null
          id?: string
          is_active?: boolean | null
          meal_type?: string | null
          meals?: string | null
          notes?: string | null
          protein_target?: number | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_nutrition_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_subscriptions: {
        Row: {
          auto_renewal: boolean | null
          commitment_end_date: string | null
          commitment_months: number | null
          created_at: string
          end_date: string
          id: string
          installment_amount: number | null
          last_payment_date: string | null
          next_payment_date: string | null
          paid_installments: number | null
          payment_status: string | null
          plan_id: string
          start_date: string
          status: string | null
          student_id: string
          total_installments: number | null
          updated_at: string
        }
        Insert: {
          auto_renewal?: boolean | null
          commitment_end_date?: string | null
          commitment_months?: number | null
          created_at?: string
          end_date: string
          id?: string
          installment_amount?: number | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          paid_installments?: number | null
          payment_status?: string | null
          plan_id: string
          start_date?: string
          status?: string | null
          student_id: string
          total_installments?: number | null
          updated_at?: string
        }
        Update: {
          auto_renewal?: boolean | null
          commitment_end_date?: string | null
          commitment_months?: number | null
          created_at?: string
          end_date?: string
          id?: string
          installment_amount?: number | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          paid_installments?: number | null
          payment_status?: string | null
          plan_id?: string
          start_date?: string
          status?: string | null
          student_id?: string
          total_installments?: number | null
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
          block_reason: string | null
          blocked_at: string | null
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
          registration_method: string | null
          status: string | null
          terms_accepted_at: string | null
          terms_document_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          block_reason?: string | null
          blocked_at?: string | null
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
          registration_method?: string | null
          status?: string | null
          terms_accepted_at?: string | null
          terms_document_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          block_reason?: string | null
          blocked_at?: string | null
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
          registration_method?: string | null
          status?: string | null
          terms_accepted_at?: string | null
          terms_document_id?: string | null
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
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          proof_id: string | null
          status: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          proof_id?: string | null
          status?: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          proof_id?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "payment_proofs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "student_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_frequency: string | null
          block_after_days: number | null
          company_id: string
          created_at: string
          default_commitment_months: number | null
          description: string | null
          duration_days: number
          grace_period_days: number | null
          id: string
          is_active: boolean | null
          name: string
          penalty_percentage: number | null
          price: number
          updated_at: string
        }
        Insert: {
          billing_frequency?: string | null
          block_after_days?: number | null
          company_id: string
          created_at?: string
          default_commitment_months?: number | null
          description?: string | null
          duration_days?: number
          grace_period_days?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          penalty_percentage?: number | null
          price?: number
          updated_at?: string
        }
        Update: {
          billing_frequency?: string | null
          block_after_days?: number | null
          company_id?: string
          created_at?: string
          default_commitment_months?: number | null
          description?: string | null
          duration_days?: number
          grace_period_days?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          penalty_percentage?: number | null
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
      suggestion_votes: {
        Row: {
          created_at: string
          id: string
          suggestion_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          suggestion_id: string
          user_id: string
          vote_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          suggestion_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "feature_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_resolved: boolean | null
          message: string
          related_entity_id: string | null
          related_entity_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      training_exercises: {
        Row: {
          created_at: string
          day_of_week: number | null
          exercise_name: string
          id: string
          notes: string | null
          plan_id: string
          reps: string | null
          rest_seconds: number | null
          sets: number | null
          sort_order: number | null
          weight: string | null
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          exercise_name: string
          id?: string
          notes?: string | null
          plan_id: string
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          sort_order?: number | null
          weight?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          exercise_name?: string
          id?: string
          notes?: string | null
          plan_id?: string
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          sort_order?: number | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_exercises_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plan_days: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          is_rest_day: boolean | null
          notes: string | null
          plan_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          is_rest_day?: boolean | null
          notes?: string | null
          plan_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          is_rest_day?: boolean | null
          notes?: string | null
          plan_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plan_exercises: {
        Row: {
          created_at: string
          day_id: string
          exercise_name: string
          id: string
          muscle_group: string | null
          notes: string | null
          reps: string | null
          rest_seconds: number | null
          sets: number | null
          sort_order: number | null
          video_url: string | null
          weight: string | null
        }
        Insert: {
          created_at?: string
          day_id: string
          exercise_name: string
          id?: string
          muscle_group?: string | null
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          sort_order?: number | null
          video_url?: string | null
          weight?: string | null
        }
        Update: {
          created_at?: string
          day_id?: string
          exercise_name?: string
          id?: string
          muscle_group?: string | null
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          sort_order?: number | null
          video_url?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_plan_exercises_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "training_plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          goal: string | null
          id: string
          is_active: boolean | null
          start_date: string | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      create_notification: {
        Args: {
          p_company_id: string
          p_message: string
          p_reference_id?: string
          p_reference_type?: string
          p_title: string
          p_type: string
          p_user_id: string
          p_user_type: string
        }
        Returns: string
      }
      get_company_registration_info: {
        Args: { p_registration_code: string }
        Returns: {
          id: string
          name: string
          registration_code: string
          require_student_approval: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
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
