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
      products: {
        Row: {
          id: string
          stripe_product_id: string | null
          title: string
          slug: string
          description: string | null
          product_type: 'course' | 'membership' | 'roadmap'
          access_type: 'one_time' | 'subscription'
          price_cents: number
          currency: string
          active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
      prices: {
        Row: {
          id: string
          product_id: string
          stripe_price_id: string
          amount_cents: number
          currency: string
          interval: 'day' | 'week' | 'month' | 'year' | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          product_id: string
          price_id: string
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          total_cents: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          product_id: string
          price_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          trial_end: string | null
          created_at: string
          updated_at: string
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
    Functions: {
      can_access_product: {
        Args: { p_product_id: string }
        Returns: boolean
      }
      has_active_subscription: {
        Args: { p_product_id: string }
        Returns: boolean
      }
      has_purchased: {
        Args: { p_product_id: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
