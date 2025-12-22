import express from 'express';
import { getUserProfile } from '../controllers/userController';
import { auth as protect } from '../middleware/auth';

const router = express.Router();

// Get public profile of any user (requires auth)
router.get('/:id/profile', protect, getUserProfile);

export default router;
