/**
 * Upload Routes
 * Handles file upload endpoints (images, etc.)
 */
import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer storage for image uploads
const imageStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(os.tmpdir(), 'claude-ui-uploads', String(req.user?.id || 'anonymous'));
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedName);
    }
});

// File filter for images only
const imageFileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed.'));
    }
};

// Multer instance for image uploads
const imageUpload = multer({
    storage: imageStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5
    }
});

/**
 * POST /api/projects/:projectName/upload-images
 * Upload images for a project, returns base64 encoded data
 */
router.post('/:projectName/upload-images', authenticateToken, (req, res) => {
    imageUpload.array('images', 5)(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No image files provided' });
        }

        try {
            // Process uploaded images
            const processedImages = await Promise.all(
                req.files.map(async (file) => {
                    // Read file and convert to base64
                    const buffer = await fs.readFile(file.path);
                    const base64 = buffer.toString('base64');
                    const mimeType = file.mimetype;

                    // Clean up temp file immediately
                    await fs.unlink(file.path);

                    return {
                        name: file.originalname,
                        data: `data:${mimeType};base64,${base64}`,
                        size: file.size,
                        mimeType: mimeType
                    };
                })
            );

            res.json({ images: processedImages });
        } catch (error) {
            console.error('Error processing images:', error);
            // Clean up any remaining files
            await Promise.all(req.files.map(f => fs.unlink(f.path).catch(() => { })));
            res.status(500).json({ error: 'Failed to process images' });
        }
    });
});

export default router;
