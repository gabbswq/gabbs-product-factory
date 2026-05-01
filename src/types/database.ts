export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string
          title: string
          slug: string
          summary: string | null
          content: string
          cover_url: string | null
          og_image_url: string | null
          published_at: string
          read_time_minutes: number
          meta: Json | null
          author_id: string
        }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
      article_tags: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: {
      authors: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          website_url: string | null
          twitter: string | null
          linkedin: string | null
        }
        Relationships: []
      }
      public_articles: {
        Row: {
          id: string
          title: string
          slug: string
          summary: string | null
          cover_url: string | null
          og_image_url: string | null
          published_at: string
          read_time_minutes: number
          author_id: string
          author_name: string | null
          author_avatar: string | null
          tags: Json | null
        }
        Relationships: []
      }
      featured_articles: {
        Row: {
          id: string
          title: string
          slug: string
          summary: string | null
          cover_url: string | null
          og_image_url: string | null
          published_at: string
          read_time_minutes: number
          author_id: string
          author_name: string | null
          author_avatar: string | null
          tags: Json | null
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
