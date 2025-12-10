
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string; // URL or placeholder
  bio?: string;
  phone?: string;
  profilePicture?: string; // base64 string
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
  createdAt: string;
  phone?: string;
  email?: string;
  openToCollaboration: boolean;
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
  createdAt: string;
  phone?: string;
  email?: string;
  openToCollaboration: boolean;
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
}

export interface Message {
  id: string;
  senderId: 'currentUser' | string;
  text: string;
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
}