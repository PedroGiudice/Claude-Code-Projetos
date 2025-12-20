/**
 * Transcription Service
 * Handles audio transcription using OpenAI Whisper API with optional GPT enhancement
 */
import fetch from 'node-fetch';

/**
 * Transcribe audio using OpenAI Whisper API
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - Audio file mimetype
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudio(audioBuffer, filename, mimetype) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in server environment.');
    }

    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', audioBuffer, {
        filename: filename,
        contentType: mimetype
    });
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');
    formData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            ...formData.getHeaders()
        },
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Whisper API error: ${response.status}`);
    }

    const data = await response.json();
    return data.text || '';
}

/**
 * Enhance transcribed text using GPT
 * @param {string} text - Original transcribed text
 * @param {string} mode - Enhancement mode ('prompt', 'vibe', 'instructions', 'architect')
 * @returns {Promise<string>} Enhanced text
 */
export async function enhanceTranscription(text, mode) {
    if (!text || mode === 'default') {
        return text;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return text; // Return original if no API key
    }

    try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey });

        let prompt, systemMessage, temperature = 0.7, maxTokens = 800;

        switch (mode) {
            case 'prompt':
                systemMessage = 'You are an expert prompt engineer who creates clear, detailed, and effective prompts.';
                prompt = `You are an expert prompt engineer. Transform the following rough instruction into a clear, detailed, and context-aware AI prompt.

Your enhanced prompt should:
1. Be specific and unambiguous
2. Include relevant context and constraints
3. Specify the desired output format
4. Use clear, actionable language
5. Include examples where helpful
6. Consider edge cases and potential ambiguities

Transform this rough instruction into a well-crafted prompt:
"${text}"

Enhanced prompt:`;
                break;

            case 'vibe':
            case 'instructions':
            case 'architect':
                systemMessage = 'You are a helpful assistant that formats ideas into clear, actionable instructions for AI agents.';
                temperature = 0.5;
                prompt = `Transform the following idea into clear, well-structured instructions that an AI agent can easily understand and execute.

IMPORTANT RULES:
- Format as clear, step-by-step instructions
- Add reasonable implementation details based on common patterns
- Only include details directly related to what was asked
- Do NOT add features or functionality not mentioned
- Keep the original intent and scope intact
- Use clear, actionable language an agent can follow

Transform this idea into agent-friendly instructions:
"${text}"

Agent instructions:`;
                break;

            default:
                return text; // No enhancement for unknown modes
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: prompt }
            ],
            temperature: temperature,
            max_tokens: maxTokens
        });

        return completion.choices[0].message.content || text;

    } catch (error) {
        console.error('GPT enhancement error:', error);
        return text; // Fall back to original on error
    }
}

/**
 * Full transcription pipeline: transcribe + optionally enhance
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - Audio file mimetype
 * @param {string} mode - Enhancement mode (default: 'default')
 * @returns {Promise<string>} Final transcribed (and possibly enhanced) text
 */
export async function processAudioTranscription(audioBuffer, filename, mimetype, mode = 'default') {
    const transcribedText = await transcribeAudio(audioBuffer, filename, mimetype);

    if (!transcribedText) {
        return '';
    }

    if (mode === 'default') {
        return transcribedText;
    }

    return await enhanceTranscription(transcribedText, mode);
}
