import { Request, Response } from 'express';
import supabase from '../lib/supabase';
import { getTrendingHashtags } from '../services/trendingService';

/** GET /api/stats/user/:userId */
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const [demandResult, rentalResult, communityResult] = await Promise.all([
      supabase
        .from('demand_posts')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId),
      supabase
        .from('rental_posts')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId),
      supabase
        .from('community_posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', userId)
        .eq('status', 'active'),
    ]);

    const demandCount    = demandResult.count    ?? 0;
    const rentalCount    = rentalResult.count    ?? 0;
    const communityCount = communityResult.count ?? 0;

    res.status(200).json({
      demandPosts:             demandCount,
      rentalListings:          rentalCount,
      communityContributions:  communityCount,
      totalViews:              0, // Placeholder for future analytics
      reputationScore:         demandCount * 10 + rentalCount * 20 + communityCount * 5,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user stats', error });
  }
};

/** GET /api/stats/trending */
export const getTrendingStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const trendingTags = await getTrendingHashtags(limit);

    const suggestedShops = [
      { name: 'Urban Coffee House', category: 'Food & Beverages' },
      { name: 'TechHub Repair',     category: 'Services' },
      { name: 'Green Grocers',      category: 'Retail' },
    ];

    res.status(200).json({
      trending:       trendingTags,
      suggestedShops,
    });
  } catch (error) {
    console.error('Error fetching trending stats:', error);
    res.status(500).json({
      message:       'Error fetching trending stats',
      trending:       [],
      suggestedShops: [],
    });
  }
};
