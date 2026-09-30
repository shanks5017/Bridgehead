/**
 * Upload middleware for profile images.
 * Uses multer memoryStorage — files uploaded to Supabase Storage by profileImageService.
 * This replaces the old uploadMiddleware.ts that referenced GridFS.
 */
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

/** Rate limiter for upload endpoints */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many upload attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
