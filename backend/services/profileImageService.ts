// @ts-nocheck
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';

// Configuration
const BUCKET_NAME = 'profile-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Image size presets - only store thumbnail for display (faster loading)
const IMAGE_SIZES = {
    display: { width: 400, height: 400, quality: 85 },    // Main profile display
    icon: { width: 128, height: 128, quality: 80 }        // Small icon for comments/lists
};

// Backend URL for generating image URLs
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

/**
 * Get GridFS bucket for profile images
 */
const getBucket = (): GridFSBucket => {
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('MongoDB connection not established');
    }
    return new GridFSBucket(db, { bucketName: BUCKET_NAME });
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

    // Security: Check magic numbers (file signature)
    const magicNumbers = file.buffer.slice(0, 4);
    const isValidJPEG = magicNumbers[0] === 0xFF && magicNumbers[1] === 0xD8;
    const isValidPNG = magicNumbers[0] === 0x89 && magicNumbers[1] === 0x50;
    const isValidWebP = magicNumbers[0] === 0x52 && magicNumbers[1] === 0x49;

    if (!isValidJPEG && !isValidPNG && !isValidWebP) {
        throw new Error('File content does not match declared type.');
    }
};

/**
 * Upload a processed image to GridFS
 * Returns the file ID
 */
const uploadToGridFS = async (
    buffer: Buffer,
    filename: string,
    userId: string,
    imageType: 'display' | 'icon'
): Promise<string> => {
    const bucket = getBucket();

    return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: 'image/webp',
            metadata: {
                userId,
                imageType,
                uploadDate: new Date()
            }
        });

        uploadStream.on('error', (error) => {
            console.error('GridFS upload error:', error);
            reject(error);
        });

        uploadStream.on('finish', () => {
            console.log(`Profile image uploaded to GridFS: ${filename} (ID: ${uploadStream.id})`);
            resolve(uploadStream.id.toString());
        });

        uploadStream.end(buffer);
    });
};

/**
 * Delete a profile image from GridFS by file ID
 */
export const deleteProfileImage = async (fileId: string): Promise<void> => {
    try {
        if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
            return; // Invalid or empty ID, nothing to delete
        }

        const bucket = getBucket();
        await bucket.delete(new ObjectId(fileId));
        console.log(`Profile image deleted from GridFS: ${fileId}`);
    } catch (error: any) {
        // File might not exist, log but don't throw
        if (error.message?.includes('File not found')) {
            console.log(`Profile image not found for deletion: ${fileId}`);
        } else {
            console.error('Error deleting profile image:', error);
        }
    }
};

/**
 * Delete profile image by URL (extracts file ID from URL)
 */
export const deleteProfileImageByUrl = async (imageUrl: string): Promise<void> => {
    if (!imageUrl) return;

    // Skip old filesystem URLs or base64
    if (imageUrl.startsWith('data:image') || imageUrl.includes('/uploads/')) {
        return;
    }

    // Extract file ID from URL: /api/images/profile/<fileId>
    const match = imageUrl.match(/\/api\/images\/profile\/([a-f0-9]{24})/);
    if (match && match[1]) {
        await deleteProfileImage(match[1]);
    }
};

/**
 * Process and upload profile image to GridFS
 * Handles both new uploads and updates (deletes old image first)
 * 
 * @param file - The uploaded file buffer
 * @param userId - The user's ID (ensures ownership)
 * @param type - 'profile' for cropped display, 'original' for re-editing
 * @param existingImageUrl - URL of existing image to delete (for updates)
 * @returns Object with display and icon URLs
 */
export const uploadProfileImage = async (
    file: Express.Multer.File,
    userId: string,
    type: 'profile' | 'original' = 'profile',
    existingImageUrl?: string
): Promise<{ display: string; icon: string }> => {
    try {
        // Validate file
        validateImage(file);

        // Delete existing image first (for updates - no duplicates)
        if (existingImageUrl) {
            await deleteProfileImageByUrl(existingImageUrl);
        }

        // Generate unique filename base
        const timestamp = Date.now();
        const uniqueId = uuidv4().split('-')[0];
        const baseFilename = `${userId}_${type}_${timestamp}_${uniqueId}`;

        const urls: { display: string; icon: string } = { display: '', icon: '' };

        // Process and upload display size
        const displayBuffer = await sharp(file.buffer)
            .resize(IMAGE_SIZES.display.width, IMAGE_SIZES.display.height, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: IMAGE_SIZES.display.quality })
            .toBuffer();

        const displayFileId = await uploadToGridFS(
            displayBuffer,
            `${baseFilename}_display.webp`,
            userId,
            'display'
        );
        urls.display = `${BACKEND_URL}/api/images/profile/${displayFileId}`;

        // Process and upload icon size
        const iconBuffer = await sharp(file.buffer)
            .resize(IMAGE_SIZES.icon.width, IMAGE_SIZES.icon.height, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: IMAGE_SIZES.icon.quality })
            .toBuffer();

        const iconFileId = await uploadToGridFS(
            iconBuffer,
            `${baseFilename}_icon.webp`,
            userId,
            'icon'
        );
        urls.icon = `${BACKEND_URL}/api/images/profile/${iconFileId}`;

        console.log(`Profile images uploaded for user ${userId}:`, urls);
        return urls;

    } catch (error: any) {
        console.error('Profile image processing error:', error);
        throw new Error(`Failed to process profile image: ${error.message}`);
    }
};

/**
 * Get profile image stream from GridFS
 * Used by the route handler to serve images
 */
export const getProfileImageStream = async (fileId: string) => {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        throw new Error('Invalid file ID');
    }

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database connection not available');
    }

    const bucket = getBucket();

    // Find file metadata
    const files = await db.collection(`${BUCKET_NAME}.files`).find({
        _id: new ObjectId(fileId)
    }).toArray();

    if (!files || files.length === 0) {
        throw new Error('Image not found');
    }

    const file = files[0];

    return {
        stream: bucket.openDownloadStream(new ObjectId(fileId)),
        contentType: file.contentType || 'image/webp',
        length: file.length,
        filename: file.filename,
        fileId: file._id.toString()
    };
};

/**
 * Delete all profile images for a user (for account deletion)
 */
export const deleteAllUserProfileImages = async (userId: string): Promise<number> => {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not available');
        }

        const bucket = getBucket();

        // Find all files for this user
        const files = await db.collection(`${BUCKET_NAME}.files`).find({
            'metadata.userId': userId
        }).toArray();

        let deletedCount = 0;
        for (const file of files) {
            await bucket.delete(file._id);
            deletedCount++;
        }

        console.log(`Deleted ${deletedCount} profile images for user ${userId}`);
        return deletedCount;
    } catch (error) {
        console.error('Error deleting user profile images:', error);
        return 0;
    }
};
