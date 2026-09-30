import express from 'express';
import { getUserStats, getTrendingStats } from '../controllers/statsController';

const router = express.Router();

router.get('/user/:userId', getUserStats);
router.get('/trending', getTrendingStats);

export default router;
