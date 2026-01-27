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
            .select('fullName username companyName role bio reputationScore dealsCompleted isVerifiedEntrepreneur createdAt email profilePicture');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            name: user.fullName,
            username: user.username,
            company: user.companyName || 'Stealth Mode',
            role: user.role || 'Entrepreneur',
            bio: user.bio || 'Building the next big thing.',
            profilePicture: user.profilePicture,
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

// @desc    Get user by username (for profile viewing)
// @route   GET /api/users/username/:username
// @access  Public
export const getUserByUsername = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('fullName username companyName role bio reputationScore dealsCompleted isVerifiedEntrepreneur createdAt profilePicture email');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            name: user.fullName,
            username: user.username,
            email: user.email,
            company: user.companyName || '',
            role: user.role || '',
            bio: user.bio || '',
            profilePicture: user.profilePicture || '',
            stats: {
                reputation: user.reputationScore,
                deals: user.dealsCompleted,
            },
            verified: user.isVerifiedEntrepreneur,
            joined: user.createdAt,
        });
    } catch (error) {
        console.error('Error fetching user by username:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

