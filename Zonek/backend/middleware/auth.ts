import { Request, Response, NextFunction } from 'express';
import supabase from '../lib/supabase';
import { Profile } from '../types/database.types';

// Extend Express Request with typed user and userId
declare global {
  namespace Express {
    interface Request {
      user?: Profile;
      userId?: string;
    }
  }
}

/**
 * Mandatory auth middleware.
 * Verifies the Supabase JWT from the Authorization header,
 * then fetches the user's profile from the `profiles` table.
 */
export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token || token === 'null') {
      res.status(401).json({ message: 'No token, authorization denied' });
      return;
    }

    // Verify JWT with Supabase — this also handles expiry
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      res.status(401).json({ message: 'Token is not valid' });
      return;
    }

    // Fetch the user's full profile from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      res.status(401).json({ message: 'User profile not found' });
      return;
    }

    req.user = profile as Profile;
    req.userId = profile.id;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * Optional auth middleware.
 * Attaches user to req if a valid token is present; proceeds as guest otherwise.
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token && token !== 'null') {
      const { data: { user: authUser } } = await supabase.auth.getUser(token);

      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          req.user = profile as Profile;
          req.userId = profile.id;
        }
      }
    }
    next();
  } catch {
    next(); // Proceed as guest on any error
  }
};

export default { auth, optionalAuth };
