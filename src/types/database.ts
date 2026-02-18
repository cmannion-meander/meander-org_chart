export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          created_at: string;
          department: string;
          email: string;
          employee_id: string;
          id: string;
          location: string;
          manager_employee_id: string | null;
          name: string;
          photo_url: string | null;
          start_date: string | null;
          status: "active" | "leave" | "terminated" | "contractor";
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          department: string;
          email: string;
          employee_id: string;
          id?: string;
          location: string;
          manager_employee_id?: string | null;
          name: string;
          photo_url?: string | null;
          start_date?: string | null;
          status?: "active" | "leave" | "terminated" | "contractor";
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          department?: string;
          email?: string;
          employee_id?: string;
          id?: string;
          location?: string;
          manager_employee_id?: string | null;
          name?: string;
          photo_url?: string | null;
          start_date?: string | null;
          status?: "active" | "leave" | "terminated" | "contractor";
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      import_jobs: {
        Row: {
          created_count: number;
          failed_count: number;
          finished_at: string | null;
          id: string;
          report_json: Json;
          started_at: string | null;
          status: "pending" | "running" | "succeeded" | "failed";
          updated_count: number;
          uploaded_at: string;
          uploaded_by: string;
        };
        Insert: {
          created_count?: number;
          failed_count?: number;
          finished_at?: string | null;
          id?: string;
          report_json?: Json;
          started_at?: string | null;
          status?: "pending" | "running" | "succeeded" | "failed";
          updated_count?: number;
          uploaded_at?: string;
          uploaded_by: string;
        };
        Update: {
          created_count?: number;
          failed_count?: number;
          finished_at?: string | null;
          id?: string;
          report_json?: Json;
          started_at?: string | null;
          status?: "pending" | "running" | "succeeded" | "failed";
          updated_count?: number;
          uploaded_at?: string;
          uploaded_by?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          role: "admin" | "hr_editor" | "viewer";
          updated_at: string;
          user_email: string;
        };
        Insert: {
          created_at?: string;
          role?: "admin" | "hr_editor" | "viewer";
          updated_at?: string;
          user_email: string;
        };
        Update: {
          created_at?: string;
          role?: "admin" | "hr_editor" | "viewer";
          updated_at?: string;
          user_email?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      employee_status: "active" | "leave" | "terminated" | "contractor";
      import_job_status: "pending" | "running" | "succeeded" | "failed";
      role_name: "admin" | "hr_editor" | "viewer";
    };
    CompositeTypes: Record<string, never>;
  };
};
