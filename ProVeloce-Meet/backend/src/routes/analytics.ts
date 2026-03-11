import { Router, Request, Response } from 'express';
import { verifyAuth } from './auth';
import { Meeting } from '../models/Meeting';
import { MeetingParticipant } from '../models/MeetingParticipant';

const router = Router();

/**
 * Get meeting analytics for authenticated user
 */
router.get('/meetings', verifyAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { startDate, endDate, limit = 50 } = req.query;

        const query: any = {
            $or: [
                { hostId: userId },
                { 'participants.userId': userId },
            ],
        };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate as string);
            if (endDate) query.createdAt.$lte = new Date(endDate as string);
        }

        const meetings = await Meeting.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string, 10))
            .select('title status startTime endTime participantCount');

        // Calculate stats
        const totalMeetings = meetings.length;
        const totalDuration = meetings.reduce((acc, m) => {
            if (m.startTime && m.endTime) {
                const start = new Date(m.startTime).getTime();
                const end = new Date(m.endTime).getTime();
                return acc + (end - start);
            }
            return acc;
        }, 0);

        const avgDuration = totalMeetings > 0 ? totalDuration / totalMeetings : 0;
        const totalParticipants = meetings.reduce((acc, m) => acc + (m.participantCount || 1), 0);

        res.json({
            stats: {
                totalMeetings,
                totalDurationMs: totalDuration,
                avgDurationMs: avgDuration,
                totalParticipants,
                avgParticipants: totalMeetings > 0 ? totalParticipants / totalMeetings : 0,
            },
            meetings: meetings.map(m => ({
                id: m._id,
                title: m.title,
                status: m.status,
                startTime: m.startTime,
                endTime: m.endTime,
                durationMs: m.startTime && m.endTime
                    ? new Date(m.endTime).getTime() - new Date(m.startTime).getTime()
                    : null,
                participantCount: m.participantCount,
            })),
        });
    } catch (error: any) {
        console.error('[Analytics] Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

/**
 * Get network quality stats for a meeting
 */
router.get('/network/:meetingId', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { meetingId } = req.params;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get meeting
        const meeting = await Meeting.findOne({ streamCallId: meetingId });
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Check if user participated
        if (meeting.hostId !== userId) {
            const participant = await MeetingParticipant.findOne({
                meetingId: meeting._id,
                clerkId: userId,
            });
            if (!participant) {
                return res.status(403).json({ error: 'Not authorized' });
            }
        }

        // Return placeholder network stats
        // In production, these would come from Stream webhooks
        res.json({
            meetingId,
            stats: {
                avgLatencyMs: null,
                avgPacketLoss: null,
                avgBitrate: null,
                qualityScore: null,
                note: 'Network stats require Stream webhook integration',
            },
        });
    } catch (error: any) {
        console.error('[Analytics] Network error:', error.message);
        res.status(500).json({ error: 'Failed to fetch network stats' });
    }
});

/**
 * Get error tracking summary
 */
router.get('/errors', verifyAuth, async (req: Request, res: Response) => {
    try {
        // Placeholder for error tracking
        // In production, integrate with Sentry or similar
        res.json({
            summary: {
                last24h: 0,
                last7d: 0,
                topErrors: [],
            },
            note: 'Error tracking requires integration with external service',
        });
    } catch (error: any) {
        console.error('[Analytics] Errors endpoint:', error.message);
        res.status(500).json({ error: 'Failed to fetch error stats' });
    }
});

export { router as analyticsRoutes };
