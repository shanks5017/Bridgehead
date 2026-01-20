import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Configure multer for memory storage (we'll process with sharp)
const storage = multer.memoryStorage();

// File filter for additional security
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
};

// Multer configuration
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 2 // Max 2 files (profile + original)
    }
});

// Simple upload rate limiter - 10 uploads per 15 minutes
const uploadAttempts = new Map<string, { count: number; resetAt: number }>();

export const uploadRateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const maxAttempts = 10;
    const windowMs = 15 * 60 * 1000; // 15 minutes

    let attempts = uploadAttempts.get(ip);

    if (!attempts || now > attempts.resetAt) {
        attempts = { count: 1, resetAt: now + windowMs };
        uploadAttempts.set(ip, attempts);
        return next();
    }

    if (attempts.count >= maxAttempts) {
        const resetIn = Math.ceil((attempts.resetAt - now) / 1000);
        return res.status(429).json({
            error: 'Too many upload attempts',
            message: `Please wait ${resetIn} seconds before trying again`
        });
    }

    attempts.count++;
    next();
};
