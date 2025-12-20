/**
 * Transcription Routes
 * Handles audio transcription endpoints using OpenAI Whisper
 */
import express from 'express';
import multer from 'multer';
import { processAudioTranscription } from '../services/transcriber.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for audio uploads
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/transcribe
 * Transcribe audio file using OpenAI Whisper, with optional GPT enhancement
 */
router.post('/', authenticateToken, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const mode = req.body.mode || 'default';

        const text = await processAudioTranscription(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            mode
        );

        res.json({ text });

    } catch (error) {
        console.error('Transcription error:', error);

        if (error.message.includes('OpenAI API key')) {
            return res.status(500).json({ error: error.message });
        }

        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

export default router;
