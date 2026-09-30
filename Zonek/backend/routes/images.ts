import express, { Request, Response } from 'express';
import supabase from '../lib/supabase';
import { auth } from '../middleware/auth';
import { extractStoragePath, deleteFromStorage } from '../lib/storage';

const router = express.Router();

const POST_IMAGES_BUCKET = 'post-images';
const PROFILE_IMAGES_BUCKET = 'profile-images';

/**
 * @route   DELETE /api/images/post/:path(*)
 * @desc    Delete a post image from Supabase Storage
 * @access  Private
 */
router.delete('/post/:path(*)', auth, async (req: Request, res: Response) => {
  try {
    const filePath = req.params.path;
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'File path is required' });
    }

    await deleteFromStorage(POST_IMAGES_BUCKET, filePath);

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting post image:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting image' });
  }
});

/**
 * @route   DELETE /api/images/profile/:path(*)
 * @desc    Delete a profile image from Supabase Storage
 * @access  Private
 */
router.delete('/profile/:path(*)', auth, async (req: Request, res: Response) => {
  try {
    const filePath = req.params.path;
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'File path is required' });
    }

    await deleteFromStorage(PROFILE_IMAGES_BUCKET, filePath);

    res.json({ success: true, message: 'Profile image deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting profile image:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting profile image' });
  }
});

export default router;
