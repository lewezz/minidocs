// Matches the checked-in SQL migration. Update alongside schema changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type DocumentRow = {
  id: string;
  owner_id: string;
  title: string;
  content: Json;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      demo_users: {
        Row: { id: string; handle: string; display_name: string; created_at: string };
        Insert: { id: string; handle: string; display_name: string; created_at?: string };
        Update: { display_name?: string };
        Relationships: [];
      };
      documents: {
        Row: DocumentRow;
        Insert: { id?: string; owner_id: string; title?: string; content?: Json; created_at?: string; updated_at?: string };
        Update: { title?: string; content?: Json };
        Relationships: [{ foreignKeyName: "documents_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "demo_users"; referencedColumns: ["id"] }];
      };
      document_shares: {
        Row: { document_id: string; user_id: string; permission: string; created_at: string };
        Insert: { document_id: string; user_id: string; permission?: string };
        Update: { permission?: string };
        Relationships: [
          { foreignKeyName: "document_shares_document_id_fkey"; columns: ["document_id"]; isOneToOne: false; referencedRelation: "documents"; referencedColumns: ["id"] },
          { foreignKeyName: "document_shares_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "demo_users"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
