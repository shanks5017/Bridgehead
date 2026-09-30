/**
 * Trending Hashtags Service
 * Calculates and in-memory-caches trending hashtags across all post types.
 * Uses Supabase queries instead of Mongoose.
 */

import supabase from '../lib/supabase';

// Cache configuration
const CACHE_TTL = 20 * 60 * 1000; // 20 minutes
let trendingCache: { data: TrendingHashtag[]; timestamp: number } | null = null;

export interface TrendingHashtag {
  tag: string;
  posts: number;
}

// ---------------------------------------------------------------------------
// TIME WEIGHTING
// ---------------------------------------------------------------------------

const calculateTimeWeight = (createdAt: string): number => {
  const ageInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (ageInHours < 24)  return 3; // < 24 hours  → 3×
  if (ageInHours < 168) return 2; // < 7 days    → 2×
  return 1;                        // older        → 1×
};

// ---------------------------------------------------------------------------
// AGGREGATION
// ---------------------------------------------------------------------------

const aggregateHashtags = async (limit: number): Promise<TrendingHashtag[]> => {
  // Fetch hashtags + timestamps from all three post types in parallel
  const [demandResult, rentalResult, communityResult] = await Promise.all([
    supabase
      .from('demand_posts')
      .select('hashtags, created_at')
      .eq('status', 'active')
      .not('hashtags', 'eq', '{}')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('rental_posts')
      .select('hashtags, created_at')
      .eq('status', 'available')
      .not('hashtags', 'eq', '{}')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('community_posts')
      .select('hashtags, created_at')
      .eq('status', 'active')
      .not('hashtags', 'eq', '{}')
      .order('created_at', { ascending: false })
      .limit(500),
  ]);

  const weightedScoreMap = new Map<string, number>();
  const actualCountMap   = new Map<string, number>();

  const processPosts = (posts: { hashtags: string[]; created_at: string }[]) => {
    for (const post of posts) {
      if (!post.hashtags?.length) continue;
      const weight = calculateTimeWeight(post.created_at);
      for (const tag of post.hashtags) {
        const norm = tag.toLowerCase();
        weightedScoreMap.set(norm, (weightedScoreMap.get(norm) ?? 0) + weight);
        actualCountMap.set(norm,   (actualCountMap.get(norm)   ?? 0) + 1);
      }
    }
  };

  processPosts((demandResult.data    ?? []) as any);
  processPosts((rentalResult.data    ?? []) as any);
  processPosts((communityResult.data ?? []) as any);

  return Array.from(weightedScoreMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([norm]) => ({
      tag:   `#${norm}`,
      posts: actualCountMap.get(norm) ?? 0,
    }));
};

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/** Returns trending hashtags, using a 20-minute in-memory cache. */
export const getTrendingHashtags = async (limit = 10): Promise<TrendingHashtag[]> => {
  const now = Date.now();
  if (trendingCache && now - trendingCache.timestamp < CACHE_TTL) {
    return trendingCache.data.slice(0, limit);
  }

  const trending = await aggregateHashtags(limit);
  trendingCache = { data: trending, timestamp: now };
  return trending;
};

/** Force-clear the cache (useful for testing). */
export const clearTrendingCache = (): void => {
  trendingCache = null;
};

/** Get posts from all types that match a specific hashtag. */
export const getPostsByHashtag = async (
  hashtag: string,
  limit = 20
): Promise<{
  demandPosts: any[];
  rentalPosts: any[];
  communityPosts: any[];
}> => {
  const normalized = hashtag.replace('#', '').toLowerCase();

  const [demandResult, rentalResult, communityResult] = await Promise.all([
    supabase
      .from('demand_posts')
      .select('*')
      .contains('hashtags', [normalized])
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('rental_posts')
      .select('*')
      .contains('hashtags', [normalized])
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('community_posts')
      .select('*')
      .contains('hashtags', [normalized])
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  return {
    demandPosts:    demandResult.data    ?? [],
    rentalPosts:    rentalResult.data    ?? [],
    communityPosts: communityResult.data ?? [],
  };
};
