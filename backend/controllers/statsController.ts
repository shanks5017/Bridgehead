import { Request, Response } from 'express';
import { DemandPost } from '../models/DemandPost';
import { RentalPost } from '../models/RentalPost';

export const getUserStats = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        const [demandCount, rentalCount] = await Promise.all([
            DemandPost.countDocuments({ createdBy: userId }),
            RentalPost.countDocuments({ createdBy: userId })
        ]);

        // CommunityPost model is currently missing in the backend. 
        const communityCount = 0;

        res.status(200).json({
            demandPosts: demandCount,
            rentalListings: rentalCount,
            communityContributions: communityCount,
            totalViews: 0, // Placeholder
            reputationScore: (demandCount * 10) + (rentalCount * 20)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user stats', error });
    }
};

export const getTrendingStats = async (req: Request, res: Response) => {
    try {
        // 1. Trending Hashtags (Mock logic using aggregation or just returning high-value cats)
        // Real implementation: Aggregate #tags from description content

        const trendingTags = [
            { tag: '#BridgeHead', posts: 1240 },
            { tag: '#LocalBusiness', posts: 856 },
            { tag: '#Startup', posts: 654 },
            { tag: '#Community', posts: 523 },
            { tag: '#Growth', posts: 231 }
        ];

        // 2. Suggested Shops (Mock for now, could be top rated rentals or demands)
        const suggestedShops = [
            { name: 'Urban Coffee House', category: 'Food & Beverages' },
            { name: 'TechHub Repair', category: 'Services' },
            { name: 'Green Grocers', category: 'Retail' }
        ];

        res.status(200).json({
            trending: trendingTags,
            suggestedShops: suggestedShops
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trending stats', error });
    }
};
