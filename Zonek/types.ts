

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string; // Unique username for login
  avatar?: string; // URL or placeholder
  bio?: string;
  phone?: string;
  profilePicture?: string; // URL to image file (or legacy base64)
  originalProfilePicture?: string; // URL to original image for re-editing
  profilePictureFile?: File; // File object for new upload (frontend only)
  originalProfilePictureFile?: File; // Original file for re-editing (frontend only)
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export enum View {
  HOME,
  FEED,
  DEMAND_FEED,
  POST_DEMAND,
  RENTAL_LISTINGS,
  POST_RENTAL,
  AI_SUGGESTIONS,
  COMMUNITY_FEED,
  DEMAND_DETAIL,
  RENTAL_DETAIL,
  SAVED_POSTS,
  AI_MATCHES,
  COLLABORATION,
  SIGN_IN,
  SIGN_UP,
  PROFILE,
  RESEARCH,
  TESTING,
}

// ── Research Engine Types ─────────────────────────────────────────────────────

export interface ResearchInput {
  businessType: string;
  location: string;
  budget: number;
  spaceReq: string;
  businessFormat: string;
  targetCustomer?: string;
  openToAlternate?: boolean;
}

export interface FeasibilityReport {
  '00_verdict_bar': {
    score: { value: number; tag: string; logic: string };
    label: 'GO' | 'CAUTION' | 'STOP';
    brutal_honesty: string;
    _verdict: string;
  };
  '01_money_reality': {
    avg_rent: { value: number; tag: string; source: string };
    price_range: string;
    budget_runway_months: { value: number; tag: string };
    cheaper_zones: { area: string; est_rent: string; reason: string }[];
    _verdict: string;
  };
  '02_competitor_landscape': {
    density: { radius_1km: number; radius_3km: number; radius_5km: number };
    top_competitors: { name: string; rating: string; price: string; usp: string }[];
    gap_analysis: string;
    _verdict: string;
  };
  '03_demand_signals': {
    zone_type: string;
    addressable_market: { estimate: number; calculation: string; tag: string };
    search_trend: string;
    proximity_flags: { colleges: string; offices: string };
    _verdict: string;
  };
  '04_startup_cost_reality': {
    equipment: { value: number; tag: string };
    deposit: { value: number; tag: string };
    interiors: { value: number; tag: string };
    licensing: { value: number; tag: string };
    total_setup_cost: { value: number; tag: string };
    budget_gap: { value: number; tag: string };
    breakeven_members: number;
    _verdict: string;
  };
  '05_govt_and_civic': {
    civic_impact: string;
    schemes: { name: string; max_amount: string; how_to_apply: string }[];
    licenses: { name: string; cost: string; where: string }[];
    _verdict: string;
  };
  '06_risk_register': { severity: string; title: string; description: string; mitigation: string; cost: string }[];
  '07_final_verdict_and_action_plan': {
    final_verdict: string;
    action_plan: { week: number; task: string; detail: string }[];
    alternatives_if_stop: { business: string; reason: string }[];
    data_confidence_pct: Record<string, string>;
    _verdict: string;
  };
  _firewall?: { violations_corrected: number };
  _fallback?: boolean;
}

export interface SSEEvent {
  stage: string;
  status?: string;
  message?: string;
  url?: string;
  count?: number;
  platforms?: string[];
  topNames?: string[];
}

export interface MatchResult {
  demandId: string;
  rentalId: string;
  reasoning: string;
  confidenceScore: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface DemandPost {
  id: string;
  title: string;
  category: string;
  description: string;
  location: Location;
  images: string[]; // Array of base64 strings
  upvotes: number;
  upvotedBy?: string[];
  createdAt: string;
  phone?: string;
  email?: string;
  openToCollaboration: boolean;
  status?: 'active' | 'solved';
  createdBy?: string; // User ID who created this post
  hashtags?: string[];
}

export interface RentalPost {
  id: string;
  title: string;
  category: string;
  description: string;
  location: Location;
  images: string[]; // Array of base64 strings
  price: number; // Monthly rent
  squareFeet: number;
  upvotes: number;
  upvotedBy?: string[];
  createdAt: string;
  phone?: string;
  email?: string;
  openToCollaboration: boolean;
  status?: 'active' | 'rented';
  createdBy?: string; // User ID who created this post
  hashtags?: string[];
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string; // base64 string
}

export interface CommunityPost {
  id: string;
  author: string;
  username: string;
  avatar: string; // URL or placeholder identifier
  content: string;
  media?: MediaItem[];
  likes: number;
  reposts: number;
  replies: number;
  isLiked: boolean;
  isReposted: boolean;
  createdAt: string;
  topic?: string;
  hashtags?: string[];
}

export interface Message {
  id: string;
  senderId: 'currentUser' | string;
  text: string;
  media?: MediaItem[];
  timestamp: string;
}

export interface Conversation {
  id: string;
  postId: string; // The post this conversation is about
  participant: {
    id: string;
    name: string;
    avatar: string; // URL or placeholder
    postTitle: string;
  };
  messages: Message[];
  lastMessageTimestamp: string;
  unreadCount: number;
  role: 'owner' | 'seeker'; // 'owner' = My Demand, 'seeker' = Opportunity
}