/**
 * Trending Hashtags Service
 * Calculates and caches trending hashtags across all post types
 */

import DemandPost from '../models/DemandPost';
import RentalPost from '../models/RentalPost';
import CommunityPost from '../models/CommunityPost';

// Cache configuration
const CACHE_TTL = 20 * 60 * 1000; // 20 minutes in milliseconds
let trendingCache: { data: TrendingHashtag[]; timestamp: number } | null = null;

interface TrendingHashtag {
    tag: string;
    posts: number;
}

/**
 * Calculate time-based weight for a post
 * Recent posts get higher weight to surface trending topics
 */
const calculateTimeWeight = (createdAt: Date): number => {
    const now = new Date();
    const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (ageInHours < 24) {
        return 3; // Posts < 24 hours: 3x weight
    } else if (ageInHours < 168) { // 7 days
        return 2; // Posts < 7 days: 2x weight
    } else {
        return 1; // Older posts: 1x weight
    }
};

/**
 * Aggregate hashtags from all post types with time-based weighting
 */
const aggregateHashtags = async (limit: number = 10): Promise<TrendingHashtag[]> => {
    try {
        // Map to store weighted scores for ranking
        const weightedScoreMap = new Map<string, number>();
        // Map to store actual post counts for display
        const actualCountMap = new Map<string, number>();

        // Helper function to process posts from any collection
        const processPosts = (posts: any[]) => {
            posts.forEach(post => {
                if (post.hashtags && Array.isArray(post.hashtags)) {
                    const weight = calculateTimeWeight(post.createdAt);
                    post.hashtags.forEach((tag: string) => {
                        const normalizedTag = tag.toLowerCase();

                        // Track weighted score for ranking
                        const currentWeightedScore = weightedScoreMap.get(normalizedTag) || 0;
                        weightedScoreMap.set(normalizedTag, currentWeightedScore + weight);

                        // Track actual post count for display
                        const currentActualCount = actualCountMap.get(normalizedTag) || 0;
                        actualCountMap.set(normalizedTag, currentActualCount + 1);
                    });
                }
            });
        };

        // Fetch recent posts from all collections in parallel
        const [demandPosts, rentalPosts, communityPosts] = await Promise.all([
            DemandPost.find({ status: 'active', hashtags: { $exists: true, $ne: [] } })
                .select('hashtags createdAt')
                .sort({ createdAt: -1 })
                .limit(500) // Limit to recent posts for performance
                .lean(),
            RentalPost.find({ status: 'available', hashtags: { $exists: true, $ne: [] } })
                .select('hashtags createdAt')
                .sort({ createdAt: -1 })
                .limit(500)
                .lean(),
            CommunityPost.find({ status: 'active', hashtags: { $exists: true, $ne: [] } })
                .select('hashtags createdAt')
                .sort({ createdAt: -1 })
                .limit(500)
                .lean()
        ]);

        // Process all posts
        processPosts(demandPosts);
        processPosts(rentalPosts);
        processPosts(communityPosts);

        // Convert map to array, sort by weighted score, but display actual count
        const trending = Array.from(weightedScoreMap.entries())
            .map(([tag, weightedScore]) => ({
                tag: `#${tag}`,
                posts: actualCountMap.get(tag) || 0 // Use actual count for display
            }))
            .sort((a, b) => {
                // Sort by weighted score (higher is better)
                const aWeight = weightedScoreMap.get(a.tag.replace('#', '').toLowerCase()) || 0;
                const bWeight = weightedScoreMap.get(b.tag.replace('#', '').toLowerCase()) || 0;
                return bWeight - aWeight;
            })
            .slice(0, limit);

        return trending;
    } catch (error) {
        console.error('Error aggregating hashtags:', error);
        return [];
    }
};

/**
 * Get trending hashtags with caching
 * Returns cached data if available and fresh, otherwise recalculates
 */
export const getTrendingHashtags = async (limit: number = 10): Promise<TrendingHashtag[]> => {
    const now = Date.now();

    // Return cached data if available and fresh
    if (trendingCache && (now - trendingCache.timestamp) < CACHE_TTL) {
        return trendingCache.data.slice(0, limit);
    }

    // Calculate new trending data
    const trending = await aggregateHashtags(limit);

    // Update cache
    trendingCache = {
        data: trending,
        timestamp: now
    };

    return trending;
};

/**
 * Clear the trending cache (useful for testing or manual refresh)
 */
export const clearTrendingCache = (): void => {
    trendingCache = null;
};

/**
 * Get posts by hashtag across all post types
 */
export const getPostsByHashtag = async (hashtag: string, limit: number = 20) => {
    try {
        // Normalize hashtag (remove # if present, lowercase)
        const normalizedTag = hashtag.replace('#', '').toLowerCase();

        // Fetch posts from all collections
        const [demandPosts, rentalPosts, communityPosts] = await Promise.all([
            DemandPost.find({ hashtags: normalizedTag, status: 'active' })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean(),
            RentalPost.find({ hashtags: normalizedTag, status: 'available' })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean(),
            CommunityPost.find({ hashtags: normalizedTag, status: 'active' })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean()
        ]);

        return {
            demandPosts,
            rentalPosts,
            communityPosts
        };
    } catch (error) {
        console.error('Error fetching posts by hashtag:', error);
        return { demandPosts: [], rentalPosts: [], communityPosts: [] };
    }
};
