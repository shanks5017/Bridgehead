import express from 'express';
import { getFeed, createPost, likePost, replyToPost, getComments } from '../controllers/communityController';
import { auth as protect, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Public Routes (some logic might vary if logged in, handled in controller)
router.get('/posts', optionalAuth, getFeed); // Get Main Feed (Supports ?topic=...&cursor=...)
router.get('/posts/:id/comments', getComments); // Get Comments for a post

// Protected Routes
router.post('/posts', protect, createPost); // Create Post
router.put('/posts/:id/like', protect, likePost); // Like Toggle
router.post('/posts/:id/reply', protect, replyToPost); // Add Comment

export default router;
