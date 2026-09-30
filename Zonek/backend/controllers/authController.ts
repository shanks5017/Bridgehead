import { Request, Response } from 'express';
import supabase from '../lib/supabase';
import { extractStoragePath, deleteFromStorage } from '../lib/storage';
import { uploadProfileImage } from '../services/profileImageService';
import { Profile } from '../types/database.types';

// ---------------------------------------------------------------------------
// REGISTER
// ---------------------------------------------------------------------------

interface RegisterBody {
  fullName: string;
  email: string;
  username: string;
  password: string;
  userType: 'entrepreneur' | 'community';
}

export const register = async (req: Request<{}, {}, RegisterBody>, res: Response): Promise<void> => {
  try {
    const { fullName, email, username, password, userType } = req.body;

    if (!fullName || !email || !username || !password || !userType) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Check username uniqueness before creating auth user
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (existingProfile) {
      res.status(400).json({ error: 'Username is already taken' });
      return;
    }

    // Create auth user — Supabase Auth handles password hashing
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development; toggle in production
      user_metadata: {
        full_name: fullName,
        username: normalizedUsername,
        user_type: userType,
        auth_provider: 'email',
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        res.status(400).json({ error: 'Email already in use' });
      } else {
        res.status(400).json({ error: authError.message });
      }
      return;
    }

    const newUser = authData.user!;

    // The handle_new_user() trigger in PostgreSQL auto-creates the profile row.
    // Fetch it to return to the client.
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newUser.id)
      .single();

    // Sign in to obtain a session token for the new user
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError || !sessionData.session) {
      res.status(500).json({ error: 'User created but could not obtain session' });
      return;
    }

    res.status(201).json({
      message: 'User created successfully',
      token: sessionData.session.access_token,
      user: profile,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------

interface LoginBody {
  identifier: string; // email OR username
  password: string;
}

export const login = async (req: Request<{}, {}, LoginBody>, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: 'Identifier and password are required' });
      return;
    }

    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Resolve username → email if needed
    let email = normalizedIdentifier;

    if (!normalizedIdentifier.includes('@')) {
      // Looks like a username — look up the corresponding email
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', normalizedIdentifier)
        .maybeSingle();

      if (lookupError || !profile) {
        console.error('Login lookup error:', lookupError, 'Profile:', profile);
        res.status(400).json({ error: 'Invalid credentials' });
        return;
      }

      // Get the email from auth.users via admin API
      const { data: { user: authUser }, error: adminError } = await supabase.auth.admin.getUserById(profile.id);

      if (adminError || !authUser?.email) {
        res.status(400).json({ error: 'Invalid credentials' });
        return;
      }

      email = authUser.email;
    }

    // Sign in with Supabase Auth
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !sessionData.session) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    // Fetch profile for the response
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionData.user.id)
      .single();

    res.json({
      message: 'Sign in successful',
      token: sessionData.session.access_token,
      user: profile,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// ---------------------------------------------------------------------------
// GET CURRENT USER
// ---------------------------------------------------------------------------

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user is populated by the auth middleware
    res.json(req.user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// FORGOT PASSWORD
// ---------------------------------------------------------------------------

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      res.status(500).json({ message: 'Failed to send reset email' });
      return;
    }

    // Always return success to prevent email enumeration attacks
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// RESET PASSWORD
// ---------------------------------------------------------------------------

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password, access_token } = req.body;

    if (!password || !access_token) {
      res.status(400).json({ message: 'Password and access_token are required' });
      return;
    }

    // Verify the access token and update password
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(access_token);

    if (userError || !authUser) {
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
      password,
    });

    if (updateError) {
      res.status(500).json({ message: 'Failed to update password' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// UPDATE PROFILE
// ---------------------------------------------------------------------------

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, bio, companyName, role } = req.body;
    const userId = req.userId!;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const updateFields: Partial<Profile> = {};

    if (fullName !== undefined) updateFields.full_name = fullName;
    if (bio !== undefined) updateFields.bio = bio;
    if (companyName !== undefined) updateFields.company_name = companyName;
    if (role !== undefined) updateFields.role = role;

    // Handle profile picture upload
    if (files?.profilePicture?.[0]) {
      // Delete old profile picture from storage if it exists
      const currentUser = req.user!;
      if (currentUser.profile_picture_url) {
        const oldPath = extractStoragePath(currentUser.profile_picture_url, 'profile-images');
        if (oldPath) await deleteFromStorage('profile-images', oldPath);
      }

      const urls = await uploadProfileImage(files.profilePicture[0], userId, 'profile');
      updateFields.profile_picture_url = urls.display;
    }

    // Handle original profile picture (for re-editing)
    if (files?.originalProfilePicture?.[0]) {
      const currentUser = req.user!;
      if (currentUser.original_picture_url) {
        const oldPath = extractStoragePath(currentUser.original_picture_url, 'profile-images');
        if (oldPath) await deleteFromStorage('profile-images', oldPath);
      }

      const urls = await uploadProfileImage(files.originalProfilePicture[0], userId, 'original');
      updateFields.original_picture_url = urls.display;
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
  }
};
