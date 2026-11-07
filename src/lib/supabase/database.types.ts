export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type PortfolioVersionRow = {
  id: string;
  version: number;
  state: Database["public"]["Enums"]["portfolio_version_state"];
  content: Json;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

type MediaAssetRow = {
  id: string;
  storage_path: string;
  kind: Database["public"]["Enums"]["portfolio_media_kind"];
  mime_type: string;
  byte_size: number;
  width: number;
  height: number;
  alt_text: string;
  caption: string;
  is_published: boolean;
  created_by: string;
  created_at: string;
};

type ResumeVersionRow = {
  id: string;
  version: number;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  checksum_sha256: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  published_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      portfolio_admins: {
        Row: { singleton: boolean; user_id: string; created_at: string };
        Insert: { singleton?: boolean; user_id: string; created_at?: string };
        Update: { singleton?: boolean; user_id?: string; created_at?: string };
        Relationships: [];
      };
      portfolio_versions: {
        Row: PortfolioVersionRow;
        Insert: {
          id?: string;
          state: Database["public"]["Enums"]["portfolio_version_state"];
          content: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          state?: Database["public"]["Enums"]["portfolio_version_state"];
          content?: Json;
          updated_at?: string;
          published_at?: string | null;
        };
        Relationships: [];
      };
      media_assets: {
        Row: MediaAssetRow;
        Insert: {
          id?: string;
          storage_path: string;
          kind: Database["public"]["Enums"]["portfolio_media_kind"];
          mime_type: string;
          byte_size: number;
          width: number;
          height: number;
          alt_text: string;
          caption?: string;
          is_published?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Omit<MediaAssetRow, "id" | "created_by" | "created_at">>;
        Relationships: [];
      };
      resume_versions: {
        Row: ResumeVersionRow;
        Insert: {
          id?: string;
          storage_path: string;
          original_filename: string;
          mime_type?: string;
          byte_size: number;
          checksum_sha256?: string | null;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
          published_at?: string | null;
        };
        Update: Pick<Partial<ResumeVersionRow>, "is_active" | "published_at">;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_portfolio_admin: { Args: Record<string, never>; Returns: boolean };
      publish_portfolio: {
        Args: { p_draft_id: string; p_expected_updated_at: string };
        Returns: PortfolioVersionRow;
      };
      rollback_portfolio: {
        Args: { p_version_id: string };
        Returns: PortfolioVersionRow;
      };
      activate_resume: {
        Args: { p_resume_id: string };
        Returns: ResumeVersionRow;
      };
    };
    Enums: {
      portfolio_version_state: "draft" | "published" | "archived";
      portfolio_media_kind: "project_cover" | "project_gallery";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type { MediaAssetRow, PortfolioVersionRow, ResumeVersionRow };
