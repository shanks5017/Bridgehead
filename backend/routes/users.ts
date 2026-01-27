import express from 'express';
import { getUserProfile, getUserByUsername } from '../controllers/userController';
import { auth as protect } from '../middleware/auth';

const router = express.Router();

// Get user by username (public access - for viewing profiles)
router.get('/username/:username', getUserByUsername);

// Get public profile of any user (requires auth)
router.get('/:id/profile', protect, getUserProfile);

export default router;
