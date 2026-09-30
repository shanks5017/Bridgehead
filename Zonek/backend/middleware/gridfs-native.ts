import multer from 'multer';
import { uploadToStorage } from '../lib/storage';

const BUCKET = 'post-images';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_FILES = 5;

// Use memory storage — files held in buffer until we upload to Supabase Storage
const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
});

/** multer middleware: accepts up to 5 images in the 'images' field */
export const uploadImages = upload.array('images', MAX_FILES);

/**
 * After multer has buffered the files, upload each one to Supabase Storage
 * and attach the resulting public URLs to `req.storageUrls`.
 *
 * The folder path inside the bucket is: `<userId>/<timestamp>-<originalname>`
 */
export const uploadToSupabaseStorage = async (req: any, res: any, next: any): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      req.storageUrls = [];
      return next();
    }

    const userId = req.userId ?? 'anonymous';

    const uploadPromises = (req.files as Express.Multer.File[]).map(async (file) => {
      const timestamp = Date.now();
      const safeName  = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename  = `${timestamp}-${safeName}`;

      return uploadToStorage(BUCKET, userId, file.buffer, file.mimetype, filename);
    });

    req.storageUrls = await Promise.all(uploadPromises);

    next();
  } catch (error: any) {
    console.error('Supabase Storage upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading images to storage' });
  }
};

/** Multer error handler middleware */
export const handleUploadError = (err: any, _req: any, res: any, next: any): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ success: false, message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ success: false, message: `Too many files. Maximum is ${MAX_FILES} images.` });
      return;
    }
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  if (err) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  next();
};
