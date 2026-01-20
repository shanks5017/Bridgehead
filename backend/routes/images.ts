import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

const router = express.Router();

// Initialize GridFS
// let gfs: Grid.Grid;
// mongoose.connection.once('open', () => {
//     gfs = Grid(mongoose.connection.db, mongoose.mongo);
//     gfs.collection('images'); // Collection name from gridfs-upload.ts
// });

/**
 * @route   GET /api/images/:fileId
 * @desc    Retrieve image from GridFS by file ID using native MongoDB GridFSBucket
 * @access  Public
 */
router.get('/:fileId', async (req: Request, res: Response) => {
    try {
        const { fileId } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file ID'
            });
        }

        // Get MongoDB database instance
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        // Create GridFS bucket
        const bucket = new GridFSBucket(db, { bucketName: 'images' });

        // Find file metadata
        const files = await db.collection('images.files').find({
            _id: new mongoose.Types.ObjectId(fileId)
        }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        const file = files[0];

        // Check if it's an image
        if (!file.contentType || !file.contentType.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                message: 'File is not an image'
            });
        }

        // Set response headers
        res.set('Content-Type', file.contentType);
        res.set('Content-Length', file.length.toString());
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);

        // Cache headers for better performance
        res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
        res.set('ETag', file._id.toString());

        // Create download stream and pipe to response
        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

        downloadStream.on('error', (err) => {
            console.error('Error streaming file:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error retrieving image'
                });
            }
        });

        downloadStream.pipe(res);

    } catch (error) {
        console.error('Error fetching image:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Server error while retrieving image'
            });
        }
    }
});

/**
 * @route   GET /api/images/profile/:fileId
 * @desc    Retrieve profile picture from GridFS by file ID
 * @access  Public (images are public once uploaded)
 */
router.get('/profile/:fileId', async (req: Request, res: Response) => {
    try {
        const { getProfileImageStream } = await import('../services/profileImageService');

        const { stream, contentType, length, filename, fileId } = await getProfileImageStream(req.params.fileId);

        // Set response headers
        res.set('Content-Type', contentType);
        res.set('Content-Length', length.toString());
        res.set('Content-Disposition', `inline; filename="${filename}"`);

        // Cache headers for better performance (1 year - images don't change, they get replaced)
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('ETag', fileId);

        // Stream the image
        stream.on('error', (err: Error) => {
            console.error('Error streaming profile image:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error retrieving profile image'
                });
            }
        });

        stream.pipe(res);

    } catch (error: any) {
        console.error('Error fetching profile image:', error);
        if (!res.headersSent) {
            if (error.message === 'Image not found' || error.message === 'Invalid file ID') {
                res.status(404).json({
                    success: false,
                    message: 'Profile image not found'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Server error while retrieving profile image'
                });
            }
        }
    }
});

/**
 * @route   DELETE /api/images/:fileId
 * @desc    Delete image from GridFS
 * @access  Private (should add authentication)
 */
router.delete('/:fileId', async (req: Request, res: Response) => {
    try {
        const { fileId } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file ID'
            });
        }

        // Get MongoDB database instance
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        // Create GridFS bucket
        const bucket = new GridFSBucket(db, { bucketName: 'images' });

        // Delete file from GridFS
        await bucket.delete(new mongoose.Types.ObjectId(fileId));

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting image'
        });
    }
});

export default router;
