/**
 * Supabase Database Schema Definitions for ZenArc
 * Based on current normalized BoardState
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          color: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          color?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          color?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          key: string;
          title: string;
          background_type: "color" | "image" | "gradient";
          background_value: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          title: string;
          background_type?: "color" | "image" | "gradient";
          background_value?: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          title?: string;
          background_type?: "color" | "image" | "gradient";
          background_value?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      columns: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          color: string;
          position: number;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          color: string;
          position: number;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          color?: string;
          position?: number;
          owner_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          column_id: string;
          project_id: string;
          title: string;
          description: string | null;
          start_date: string | null;
          due_date: string | null;
          start_time: string | null;
          due_time: string | null;
          completed: boolean;
          is_archived: boolean;
          position: number;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          column_id: string;
          project_id: string;
          title: string;
          description?: string | null;
          start_date?: string | null;
          due_date?: string | null;
          start_time?: string | null;
          due_time?: string | null;
          completed?: boolean;
          is_archived?: boolean;
          position: number;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          column_id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          start_date?: string | null;
          due_date?: string | null;
          start_time?: string | null;
          due_time?: string | null;
          completed?: boolean;
          is_archived?: boolean;
          position?: number;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      labels: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          color: string;
          owner_id: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          color: string;
          owner_id: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          color?: string;
          owner_id?: string;
        };
        Relationships: [];
      };
      card_labels: {
        Row: {
          card_id: string;
          label_id: string;
        };
        Insert: {
          card_id: string;
          label_id: string;
        };
        Update: {
          card_id?: string;
          label_id?: string;
        };
        Relationships: [];
      };
      card_assignees: {
        Row: {
          card_id: string;
          profile_id: string;
        };
        Insert: {
          card_id: string;
          profile_id: string;
        };
        Update: {
          card_id?: string;
          profile_id?: string;
        };
        Relationships: [];
      };
      checklist_items: {
        Row: {
          id: string;
          card_id: string;
          text: string;
          checked: boolean;
          position: number;
          owner_id: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          text: string;
          checked?: boolean;
          position: number;
          owner_id: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          text?: string;
          checked?: boolean;
          position?: number;
          owner_id?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          project_id: string;
          card_id: string | null;
          user_id: string;
          type: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          card_id?: string | null;
          user_id: string;
          type: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          card_id?: string | null;
          user_id?: string;
          type?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      color_swatches: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          color_value: string;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          color_value: string;
          category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          color_value?: string;
          category?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      queue_jobs_log: {
        Row: {
          id: string;
          queue_name: string;
          msg_id: number;
          payload: Json;
          status: "completed" | "failed";
          error: string | null;
          processing_time_ms: number | null;
          processed_at: string;
        };
        Insert: {
          id?: string;
          queue_name: string;
          msg_id: number;
          payload: Json;
          status: "completed" | "failed";
          error?: string | null;
          processing_time_ms?: number | null;
          processed_at?: string;
        };
        Update: {
          id?: string;
          queue_name?: string;
          msg_id?: number;
          payload?: Json;
          status?: "completed" | "failed";
          error?: string | null;
          processing_time_ms?: number | null;
          processed_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      pgmq_send: {
        Args: {
          queue_name: string;
          msg: Json;
          delay?: number;
        };
        Returns: number;
      };
      pgmq_read: {
        Args: {
          queue_name: string;
          limit?: number;
          vt?: number;
        };
        Returns: Array<{
          msg_id: number;
          read_ct: number;
          enqueued_at: string;
          msg: Json;
        }>;
      };
      pgmq_delete: {
        Args: {
          queue_name: string;
          msg_id: number;
        };
        Returns: boolean;
      };
      pgmq_archive: {
        Args: {
          queue_name: string;
          msg_id: number;
        };
        Returns: boolean;
      };
      pgmq_purge: {
        Args: {
          queue_name: string;
        };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
