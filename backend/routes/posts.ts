import express from 'express';
import {
  getDemandPosts,
  createDemandPost,
  getRentalPosts,
  createRentalPost,
  upvoteDemandPost
} from '../controllers/postController';
import { auth } from '../middleware/auth';
import { uploadImages, uploadToGridFS, handleGridFSUploadError } from '../middleware/gridfs-native'; // Native GridFS implementation
import { validateDemand } from '../middleware/validation';
import { parseFormDataJson } from '../middleware/parseFormData';

const router = express.Router();

// Demand Routes
router.get('/demands', getDemandPosts);
router.post('/demands',
  auth,
  uploadImages,       // Multer with memory storage
  uploadToGridFS,     // Custom native GridFS upload
  handleGridFSUploadError,
  parseFormDataJson,
  validateDemand,
  createDemandPost
);
router.put('/demands/:id/upvote', auth, upvoteDemandPost);

// Rental Routes
router.get('/rentals', getRentalPosts);
router.post('/rentals', auth, createRentalPost);

export default router;