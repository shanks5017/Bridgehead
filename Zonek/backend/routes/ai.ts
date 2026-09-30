import express from 'express';
import { chat, generateIdeas, match, geocode, reverseGeocode } from '../controllers/aiController';
// import { authMiddleware } from '../middleware/auth'; // Optional: Add later if needed for all endpoints

const router = express.Router();

// Public Routes (or protect as needed)
router.post('/chat', chat);
router.post('/ideas', generateIdeas);
router.post('/match', match);
router.post('/geocode', geocode);
router.post('/reverse-geocode', reverseGeocode);

export default router;
