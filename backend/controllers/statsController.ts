import { Request, Response } from 'express';
import DemandPost from '../models/DemandPost';
import RentalPost from '../models/RentalPost';
import { getTrendingHashtags } from '../services/trendingService';

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
        // Get limit from query params (default: 10)
        const limit = parseInt(req.query.limit as string) || 10;

        // Get real trending hashtags from service (with caching)
        const trendingTags = await getTrendingHashtags(limit);

        // Suggested Shops (Mock for now, could be top rated rentals or demands)
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
        console.error('Error fetching trending stats:', error);
        res.status(500).json({
            message: 'Error fetching trending stats',
            trending: [], // Fallback to empty array
            suggestedShops: []
        });
    }
};
