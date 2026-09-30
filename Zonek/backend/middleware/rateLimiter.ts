// @ts-nocheck
import { Request, Response, NextFunction } from 'express';

// In-memory store for rate limiting
// For production, consider using Redis
const validationAttempts = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of validationAttempts.entries()) {
        if (now > data.resetAt) {
            validationAttempts.delete(ip);
        }
    }
}, 5 * 60 * 1000);

export const validationRateLimiter = (maxAttempts: number = 5, windowMinutes: number = 1) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Get IP address (considering proxy headers)
        const ip = req.ip || req.connection.remoteAddress || 'unknown';

        const now = Date.now();
        const windowMs = windowMinutes * 60 * 1000;

        // Get or create attempt record for this IP
        let attempts = validationAttempts.get(ip);

        if (!attempts || now > attempts.resetAt) {
            // First attempt or window has expired - create new record
            attempts = {
                count: 1,
                resetAt: now + windowMs
            };
            validationAttempts.set(ip, attempts);
            return next();
        }

        // Check if limit exceeded
        if (attempts.count >= maxAttempts) {
            const resetIn = Math.ceil((attempts.resetAt - now) / 1000);
            return res.status(429).json({
                error: 'Too many validation attempts',
                message: `Please wait ${resetIn} seconds before trying again`,
                resetIn
            });
        }

        // Increment count and continue
        attempts.count++;
        next();
    };
};
