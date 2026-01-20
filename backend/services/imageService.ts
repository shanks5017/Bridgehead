import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'profile-pictures');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Use the backend URL for serving images (frontend runs on different port)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

// Image size presets for responsive delivery
const IMAGE_SIZES = {
    original: { width: 1080, height: 1080, quality: 85, suffix: 'original' },
    thumbnail: { width: 400, height: 400, quality: 80, suffix: 'thumb' },
    icon: { width: 128, height: 128, quality: 75, suffix: 'icon' }
};

/**
 * Validates file type and size
 */
export const validateImage = (file: Express.Multer.File): void => {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`);
    }

    // Additional security: Check magic numbers (file signature)
    const magicNumbers = file.buffer.slice(0, 4);
    const isValidJPEG = magicNumbers[0] === 0xFF && magicNumbers[1] === 0xD8;
    const isValidPNG = magicNumbers[0] === 0x89 && magicNumbers[1] === 0x50;
    const isValidWebP = magicNumbers[0] === 0x52 && magicNumbers[1] === 0x49;

    if (!isValidJPEG && !isValidPNG && !isValidWebP) {
        throw new Error('File content does not match declared type.');
    }
};

/**
 * Ensures upload directory exists
 */
export const ensureUploadDir = async (): Promise<void> => {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
};

/**
 * Process and save image in multiple sizes
 * @returns Object with URLs for original, thumbnail, and icon
 */
export const processAndSaveImage = async (
    file: Express.Multer.File,
    userId: string,
    type: 'profile' | 'original' = 'profile'
): Promise<{ original: string; thumbnail: string; icon: string }> => {
    try {
        // Validate file
        validateImage(file);

        // Ensure directory exists
        await ensureUploadDir();

        // Generate base filename
        const timestamp = Date.now();
        const uniqueId = uuidv4().split('-')[0]; // Short UUID
        const baseFilename = `${userId}_${type}_${timestamp}_${uniqueId}`;

        const urls: any = {};

        // Process each size
        for (const [sizeName, config] of Object.entries(IMAGE_SIZES)) {
            const filename = `${baseFilename}_${config.suffix}.webp`;
            const filepath = path.join(UPLOAD_DIR, filename);

            // Process with sharp: resize + compress + convert to WebP
            await sharp(file.buffer)
                .resize(config.width, config.height, {
                    fit: 'cover', // Crop to fill dimensions
                    position: 'center'
                })
                .webp({ quality: config.quality })
                .toFile(filepath);

            // Generate public URL with full backend path
            urls[sizeName] = `${BACKEND_URL}/uploads/profile-pictures/${filename}`;
        }

        return urls;
    } catch (error: any) {
        console.error('Image processing error:', error);
        throw new Error(`Failed to process image: ${error.message}`);
    }
};

/**
 * Delete old profile pictures
 */
export const deleteOldImages = async (imageUrl: string): Promise<void> => {
    try {
        if (!imageUrl || imageUrl.startsWith('data:image')) {
            return; // Base64 or empty, nothing to delete
        }

        // Extract filename from URL
        const filename = path.basename(imageUrl);

        // Delete all variants (original, thumb, icon)
        const baseFilename = filename.replace(/_\w+\.webp$/, '');

        for (const config of Object.values(IMAGE_SIZES)) {
            const variantFilename = `${baseFilename}_${config.suffix}.webp`;
            const filepath = path.join(UPLOAD_DIR, variantFilename);

            try {
                await fs.unlink(filepath);
            } catch (error) {
                // File might not exist, ignore
            }
        }
    } catch (error) {
        console.error('Error deleting old images:', error);
        // Don't throw - deletion failure shouldn't block upload
    }
};

/**
 * Clean up orphaned images (images without corresponding users)
 * Run this periodically or as a cron job
 */
export const cleanupOrphanedImages = async (activeUserIds: string[]): Promise<number> => {
    try {
        const files = await fs.readdir(UPLOAD_DIR);
        let deletedCount = 0;

        for (const file of files) {
            // Extract userId from filename pattern: userId_type_timestamp_uuid_suffix.webp
            const userId = file.split('_')[0];

            if (!activeUserIds.includes(userId)) {
                await fs.unlink(path.join(UPLOAD_DIR, file));
                deletedCount++;
            }
        }

        return deletedCount;
    } catch (error) {
        console.error('Cleanup error:', error);
        return 0;
    }
};
