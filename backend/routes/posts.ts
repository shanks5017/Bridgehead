import express from 'express';
import {
  getDemandPosts,
  createDemandPost,
  getRentalPosts,
  createRentalPost,
  upvoteDemandPost,
  getMyDemandPosts,
  getMyRentalPosts,
  updateDemandPost,
  deleteDemandPost,
  updateRentalPost,
  deleteRentalPost
} from '../controllers/postController';
import { auth } from '../middleware/auth';
import { uploadImages, uploadToGridFS, handleGridFSUploadError } from '../middleware/gridfs-native'; // Native GridFS implementation
import { validateDemand } from '../middleware/validation';
import { parseFormDataJson } from '../middleware/parseFormData';

const router = express.Router();

// Demand Routes
router.get('/demands', getDemandPosts);
router.get('/demands/mine', auth, getMyDemandPosts); // Get user's own posts
router.post('/demands',
  auth,
  uploadImages,       // Multer with memory storage
  uploadToGridFS,     // Custom native GridFS upload
  handleGridFSUploadError,
  parseFormDataJson,
  validateDemand,
  createDemandPost
);
router.put('/demands/:id', auth, updateDemandPost);
router.delete('/demands/:id', auth, deleteDemandPost);
router.put('/demands/:id/upvote', auth, upvoteDemandPost);

// Rental Routes
router.get('/rentals', getRentalPosts);
router.get('/rentals/mine', auth, getMyRentalPosts); // Get user's own posts
router.post('/rentals', auth, createRentalPost);
router.put('/rentals/:id', auth, updateRentalPost);
router.delete('/rentals/:id', auth, deleteRentalPost);

export default router;