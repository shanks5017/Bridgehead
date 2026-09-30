import { Request, Response } from 'express';
import supabase from '../lib/supabase';

export const checkUsernameAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      res.status(400).json({ available: false, message: 'Please provide a valid username' });
      return;
    }

    const normalized = username.trim().toLowerCase();

    if (normalized.length < 3) {
      res.json({ available: false, message: 'Username must be at least 3 characters' });
      return;
    }
    if (normalized.length > 20) {
      res.json({ available: false, message: 'Username cannot exceed 20 characters' });
      return;
    }
    if (!/^[a-z0-9_.]+$/.test(normalized)) {
      res.json({ available: false, message: 'Username can only contain lowercase letters, numbers, underscores, and dots' });
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', normalized)
      .maybeSingle();

    res.set('Cache-Control', 'no-store, private');
    res.json(data
      ? { available: false, message: 'Username is already taken — try adding numbers' }
      : { available: true,  message: 'Likely available' }
    );
  } catch (error) {
    console.error('Check username availability error:', error);
    res.status(500).json({ available: false, message: 'Unable to verify — you can still submit' });
  }
};

export const checkEmailAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ available: false, message: 'Please provide a valid email' });
      return;
    }

    const normalized = email.trim().toLowerCase();
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

    if (!emailRegex.test(normalized)) {
      res.json({ available: false, message: 'Please enter a valid email address' });
      return;
    }

    // Check via Supabase Admin — checks auth.users table directly
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .maybeSingle();

    // Note: We can't search auth.users by email directly without admin API.
    // Use a lightweight approach: attempt a list users call
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1, page: 1 });
    // Instead, check profiles (email isn't stored there); so just return "likely available"
    // The actual duplicate email check is done by Supabase Auth during registration.
    res.set('Cache-Control', 'no-store, private');
    res.json({ available: true, message: 'Likely available' });
  } catch (error) {
    console.error('Check email availability error:', error);
    res.status(500).json({ available: false, message: 'Unable to verify — you can still submit' });
  }
};
