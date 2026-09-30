// ============================================================
// ZONEK — TypeScript type definitions for all Supabase tables
// These mirror the SQL schema exactly. Import and use in every
// controller/service instead of using raw `any`.
// ============================================================

export type AuthProvider = 'email' | 'google' | 'microsoft';
export type UserType = 'entrepreneur' | 'community';
export type DemandStatus = 'active' | 'fulfilled' | 'expired';
export type RentalStatus = 'available' | 'rented' | 'expired';
export type PostStatus = 'active' | 'deleted' | 'flagged';
export type InteractionType = 'like' | 'repost';
export type AuthorBadge = 'entrepreneur' | 'investor' | 'expert';

// ---------------------------------------------------------------------------
// PROFILES
// ---------------------------------------------------------------------------
export interface Profile {
  id: string;
  full_name: string;
  username: string;
  user_type: UserType;
  company_name: string;
  role: string;
  bio: string;
  profile_picture_url: string;
  original_picture_url: string;
  reputation_score: number;
  deals_completed: number;
  is_verified_entrepreneur: boolean;
  auth_provider: AuthProvider;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// DEMAND POSTS
// ---------------------------------------------------------------------------
export interface DemandPost {
  id: string;
  title: string;
  category: string;
  description: string;
  /** Raw geography column — only present in plain selects (as WKB hex).
   *  Use the RPC functions or select ST_Y/ST_X to get numeric lat/lng. */
  location?: unknown;
  address: string;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  images: string[];
  upvotes: number;
  phone?: string | null;
  email?: string | null;
  collaboration_open: boolean;
  status: DemandStatus;
  created_by?: string | null;
  hashtags: string[];
  urgency_score?: number | null;
  distance_radius_miles?: number | null;
  demographics: string[];
  created_at: string;
  updated_at: string;
}

/** DemandPost row as returned by the get_nearby_demand_posts() RPC */
export interface NearbyDemandPost extends Omit<DemandPost, 'location'> {
  latitude: number;
  longitude: number;
  distance_m: number;
}

// ---------------------------------------------------------------------------
// RENTAL POSTS
// ---------------------------------------------------------------------------
export interface RentalPost {
  id: string;
  title: string;
  category: string;
  description: string;
  location?: unknown;
  address: string;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  images: string[];
  price: number;
  price_per_sqft_yearly?: number | null;
  square_feet: number;
  lease_type?: string | null;
  amenities: string[];
  zoning_code?: string | null;
  phone?: string | null;
  email?: string | null;
  collaboration_open: boolean;
  status: RentalStatus;
  created_by?: string | null;
  hashtags: string[];
  upvotes: number;
  created_at: string;
  updated_at: string;
}

export interface NearbyRentalPost extends Omit<RentalPost, 'location'> {
  latitude: number;
  longitude: number;
  distance_m: number;
}

// ---------------------------------------------------------------------------
// UPVOTES
// ---------------------------------------------------------------------------
export interface DemandUpvote {
  user_id: string;
  demand_post_id: string;
  created_at: string;
}

export interface RentalUpvote {
  user_id: string;
  rental_post_id: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// DEMAND COMMENTS
// ---------------------------------------------------------------------------
export interface DemandComment {
  id: string;
  demand_post_id: string;
  content: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// RENTAL COMMENTS
// ---------------------------------------------------------------------------
export interface RentalComment {
  id: string;
  rental_post_id: string;
  content: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// COMMUNITY POSTS
// ---------------------------------------------------------------------------
export interface CommunityPost {
  id: string;
  author_id?: string | null;
  author_name: string;
  author_username?: string | null;
  author_avatar?: string | null;
  author_badge?: AuthorBadge | null;
  content: string;
  topic: string;
  hashtags: string[];
  likes_count: number;
  replies_count: number;
  reposts_count: number;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  /** Hydrated by the feed query — not stored in DB */
  is_liked?: boolean;
}

// ---------------------------------------------------------------------------
// COMMUNITY COMMENTS
// ---------------------------------------------------------------------------
export interface CommunityComment {
  id: string;
  post_id: string;
  author_id?: string | null;
  author_name: string;
  author_avatar?: string | null;
  content: string;
  status: PostStatus;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// COMMUNITY INTERACTIONS
// ---------------------------------------------------------------------------
export interface CommunityInteraction {
  id: string;
  post_id: string;
  user_id: string;
  type: InteractionType;
  created_at: string;
}

// ---------------------------------------------------------------------------
// CONVERSATIONS
// ---------------------------------------------------------------------------
export interface LastMessage {
  text: string;
  sender_id: string;
  timestamp: string;
  read: boolean;
}

export interface RoleContext {
  owner_id: string;
  seeker_id: string;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  post_id?: string | null;
  last_message?: LastMessage | null;
  is_active: boolean;
  role_context?: RoleContext | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// MESSAGES
// ---------------------------------------------------------------------------
export interface MessageMedia {
  type: 'image' | 'video';
  url: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text?: string | null;
  media?: MessageMedia[] | null;
  read_by: string[];
  created_at: string;
  updated_at: string;
}
