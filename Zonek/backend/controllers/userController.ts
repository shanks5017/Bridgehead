import { Request, Response } from 'express';
import supabase from '../lib/supabase';

/** GET /api/users/:id/profile */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, company_name, role, bio, reputation_score, deals_completed, is_verified_entrepreneur, created_at, profile_picture_url')
      .eq('id', req.params.id)
      .single();

    if (error || !profile) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      id: profile.id,
      name: profile.full_name,
      username: profile.username,
      company: profile.company_name || 'Stealth Mode',
      role: profile.role || 'Entrepreneur',
      bio: profile.bio || 'Building the next big thing.',
      profilePicture: profile.profile_picture_url,
      stats: {
        reputation: profile.reputation_score,
        deals: profile.deals_completed,
      },
      verified: profile.is_verified_entrepreneur,
      joined: profile.created_at,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/** GET /api/users/username/:username */
export const getUserByUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, company_name, role, bio, reputation_score, deals_completed, is_verified_entrepreneur, created_at, profile_picture_url')
      .eq('username', req.params.username.toLowerCase())
      .single();

    if (error || !profile) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      id: profile.id,
      name: profile.full_name,
      username: profile.username,
      company: profile.company_name || '',
      role: profile.role || '',
      bio: profile.bio || '',
      profilePicture: profile.profile_picture_url || '',
      stats: {
        reputation: profile.reputation_score,
        deals: profile.deals_completed,
      },
      verified: profile.is_verified_entrepreneur,
      joined: profile.created_at,
    });
  } catch (error) {
    console.error('Get user by username error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
