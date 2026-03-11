import { Router, Request, Response } from 'express';
import { verifyAuth } from './auth';
import {
    TranscriptChunk,
    MeetingTranscript,
    MeetingAIInsight,
    MeetingMemory,
} from '../models/AIModels';
import aiService from '../utils/ai-service';

const router = Router();

/**
 * Check AI service status
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const available = await aiService.isOllamaAvailable();
        const models = available ? await aiService.getAvailableModels() : [];

        res.json({
            available,
            models,
            defaultModel: process.env.OLLAMA_MODEL || 'llama3',
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to check AI status', available: false });
    }
});

/**
 * Generate meeting summary
 */
router.post('/summarize/:meetingId', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { meetingId } = req.params;
        const { model } = req.body;

        // Check if insights already exist
        const existing = await MeetingAIInsight.findOne({ meetingId });
        if (existing) {
            return res.json({
                cached: true,
                insight: existing,
            });
        }

        // Get transcript
        const transcript = await MeetingTranscript.findOne({ meetingId });
        if (!transcript) {
            return res.status(404).json({ error: 'Transcript not found' });
        }

        // Check Ollama availability
        const available = await aiService.isOllamaAvailable();
        if (!available) {
            return res.status(503).json({
                error: 'AI service unavailable',
                details: 'Ollama is not running. Start it with: ollama serve',
            });
        }

        // Generate summary
        const startTime = Date.now();
        const result = await aiService.summarizeMeeting(transcript.fullText, { model });
        const processingTime = Date.now() - startTime;

        // Save insight
        const insight = new MeetingAIInsight({
            meetingId,
            summary: result.summary,
            decisions: result.decisions,
            actions: result.actions.map(a => ({
                title: a,
                status: 'pending',
            })),
            risks: result.risks,
            processingTime,
            modelUsed: model || process.env.OLLAMA_MODEL || 'llama3',
        });

        await insight.save();

        res.json({
            cached: false,
            insight,
            processingTime,
        });
    } catch (error: any) {
        console.error('[AI] Summarize error:', error.message);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

/**
 * Ask a question about a meeting
 */
router.post('/ask/:meetingId', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { meetingId } = req.params;
        const { question, model } = req.body;

        if (!question?.trim()) {
            return res.status(400).json({ error: 'Question is required' });
        }

        // Check Ollama availability
        const available = await aiService.isOllamaAvailable();
        if (!available) {
            return res.status(503).json({ error: 'AI service unavailable' });
        }

        // Get transcript chunks for context
        const transcript = await MeetingTranscript.findOne({ meetingId });
        if (!transcript) {
            return res.status(404).json({ error: 'Transcript not found' });
        }

        // For now, use full transcript (later: use vector search)
        const contextChunks = [transcript.fullText.substring(0, 8000)]; // Limit context

        const startTime = Date.now();
        const answer = await aiService.askMeeting(question, contextChunks, { model });
        const processingTime = Date.now() - startTime;

        res.json({
            question,
            answer,
            processingTime,
            modelUsed: model || process.env.OLLAMA_MODEL || 'llama3',
        });
    } catch (error: any) {
        console.error('[AI] Ask error:', error.message);
        res.status(500).json({ error: 'Failed to answer question' });
    }
});

/**
 * Get AI insights for a meeting
 */
router.get('/insights/:meetingId', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { meetingId } = req.params;

        const insight = await MeetingAIInsight.findOne({ meetingId });
        if (!insight) {
            return res.status(404).json({ error: 'No AI insights found' });
        }

        res.json(insight);
    } catch (error: any) {
        console.error('[AI] Get insights error:', error.message);
        res.status(500).json({ error: 'Failed to fetch insights' });
    }
});

/**
 * Store transcript chunk (called from frontend or webhook)
 */
router.post('/transcript/:meetingId', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { meetingId } = req.params;
        const { speakerId, speakerName, startTime, endTime, text, confidence } = req.body;

        if (!text?.trim()) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const chunk = new TranscriptChunk({
            meetingId,
            speakerId: speakerId || 'unknown',
            speakerName: speakerName || 'Unknown Speaker',
            startTime: startTime || 0,
            endTime: endTime || 0,
            text: text.trim(),
            confidence: confidence || 1.0,
        });

        await chunk.save();

        // Detect action items in real-time
        const items = await aiService.detectActionItems(text);

        res.status(201).json({
            chunk,
            detectedItems: items,
        });
    } catch (error: any) {
        console.error('[AI] Transcript error:', error.message);
        res.status(500).json({ error: 'Failed to store transcript' });
    }
});

/**
 * Merge transcript chunks into full transcript
 */
router.post('/transcript/:meetingId/merge', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { meetingId } = req.params;

        // Get all chunks
        const chunks = await TranscriptChunk.find({ meetingId }).sort({ startTime: 1 });
        if (chunks.length === 0) {
            return res.status(404).json({ error: 'No transcript chunks found' });
        }

        // Merge into full text
        const fullText = chunks.map(c =>
            `[${c.speakerName}] ${c.text}`
        ).join('\n');

        const speakers = [...new Set(chunks.map(c => c.speakerName))];
        const duration = chunks[chunks.length - 1]?.endTime || 0;
        const wordCount = fullText.split(/\s+/).length;

        // Upsert transcript
        const transcript = await MeetingTranscript.findOneAndUpdate(
            { meetingId },
            {
                fullText,
                speakers,
                duration,
                wordCount,
                updatedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        res.json(transcript);
    } catch (error: any) {
        console.error('[AI] Merge error:', error.message);
        res.status(500).json({ error: 'Failed to merge transcript' });
    }
});

/**
 * Update action item status
 */
router.patch('/insights/:meetingId/actions/:actionIndex', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { meetingId, actionIndex } = req.params;
        const { status, assignee, dueDate } = req.body;

        const insight = await MeetingAIInsight.findOne({ meetingId });
        if (!insight) {
            return res.status(404).json({ error: 'Insights not found' });
        }

        const index = parseInt(actionIndex, 10);
        if (index < 0 || index >= insight.actions.length) {
            return res.status(400).json({ error: 'Invalid action index' });
        }

        if (status) insight.actions[index].status = status;
        if (assignee !== undefined) insight.actions[index].assignee = assignee;
        if (dueDate !== undefined) insight.actions[index].dueDate = dueDate;

        await insight.save();

        res.json(insight.actions[index]);
    } catch (error: any) {
        console.error('[AI] Update action error:', error.message);
        res.status(500).json({ error: 'Failed to update action' });
    }
});

export { router as aiRoutes };
