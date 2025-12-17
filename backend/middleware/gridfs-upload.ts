import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Get MongoDB URI from environment
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bridgehead';

// Create GridFS storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            // Validate file type
            const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

            if (!allowedMimes.includes(file.mimetype)) {
                return reject(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'));
            }

            // Generate unique filename
            const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;

            const fileInfo = {
                filename: filename,
                bucketName: 'images', // GridFS collection name will be 'images.files' and 'images.chunks'
                metadata: {
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    uploadDate: new Date()
                }
            };

            resolve(fileInfo);
        });
    }
});

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'));
    }
};

// Configure multer with GridFS storage
export const gridfsUpload = multer({
    storage: storage as any, // Type assertion needed for multer-gridfs-storage compatibility
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5 // Maximum 5 files
    }
});

// Middleware for handling multiple image uploads
export const uploadToGridFS = gridfsUpload.array('images', 5);

// Error handling middleware for multer errors
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

export default gridfsUpload;
