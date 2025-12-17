import multer from 'multer';
import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';

// Use memory storage (files stored in memory temporarily before uploading to GridFS)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'));
    }
};

// Configure multer with memory storage
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5 // Maximum 5 files
    }
});

// Middleware for handling multiple image uploads (stores in memory)
export const uploadImages = upload.array('images', 5);

// Middleware to upload files from memory to GridFS
export const uploadToGridFS = async (req: any, res: any, next: any) => {
    try {
        // If no files uploaded, continue to next middleware
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            req.gridfsFiles = [];
            return next();
        }

        // Get MongoDB database instance
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('MongoDB connection not established');
        }

        // Create GridFS bucket
        const bucket = new GridFSBucket(db, {
            bucketName: 'images' // Collection will be 'images.files' and 'images.chunks'
        });

        // Upload each file to GridFS
        const uploadPromises = req.files.map((file: Express.Multer.File) => {
            return new Promise((resolve, reject) => {
                // Generate unique filename
                const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;

                // Create upload stream
                const uploadStream = bucket.openUploadStream(filename, {
                    contentType: file.mimetype,
                    metadata: {
                        originalName: file.originalname,
                        mimetype: file.mimetype,
                        uploadDate: new Date()
                    }
                });

                // Handle errors
                uploadStream.on('error', (error) => {
                    console.error('GridFS upload stream error:', error);
                    reject(error);
                });

                // Handle successful upload
                uploadStream.on('finish', () => {
                    console.log(`File uploaded to GridFS: ${filename} (ID: ${uploadStream.id})`);
                    resolve({
                        id: uploadStream.id.toString(),
                        filename: filename
                    });
                });

                // Write file buffer to GridFS
                uploadStream.end(file.buffer);
            });
        });

        // Wait for all uploads to complete
        const uploadedFiles = await Promise.all(uploadPromises);

        // Attach uploaded file info to request for use in next middleware
        req.gridfsFiles = uploadedFiles;

        console.log(`Successfully uploaded ${uploadedFiles.length} files to GridFS`);
        next();
    } catch (error) {
        console.error('GridFS upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading images to database'
        });
    }
};

// Error handling middleware
export const handleGridFSUploadError = (err: any, req: any, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB per image.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 5 images.'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    next();
};
