import { Request, Response } from 'express';
import User from '../models/User';

// Extend Request to include user property from middleware
interface AuthRequest extends Request {
    user?: any;
}

// @desc    Get user profile (public info for deals)
// @route   GET /api/users/:id/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id)
            .select('fullName companyName role bio reputationScore dealsCompleted isVerifiedEntrepreneur createdAt email');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            name: user.fullName,
            company: user.companyName || 'Stealth Mode',
            role: user.role || 'Entrepreneur',
            bio: user.bio || 'Building the next big thing.',
            stats: {
                reputation: user.reputationScore,
                deals: user.dealsCompleted,
            },
            verified: user.isVerifiedEntrepreneur,
            joined: user.createdAt,
            // Don't expose email unless needed
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
