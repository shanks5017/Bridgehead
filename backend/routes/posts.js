import express from 'express';
import {
  getDemandPosts,
  createDemandPost,
  getRentalPosts,
  createRentalPost,
  upvoteDemandPost
} from '../controllers/postController.js';

const router = express.Router();

// Demand Routes
router.get('/demands', getDemandPosts);
router.post('/demands', createDemandPost);
router.put('/demands/:id/upvote', upvoteDemandPost);

// Rental Routes
router.get('/rentals', getRentalPosts);
router.post('/rentals', createRentalPost);

export default router;