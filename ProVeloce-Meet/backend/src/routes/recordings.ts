import { Router, Request, Response } from 'express';
import { verifyAuth } from './auth';
import { Meeting } from '../models/Meeting';
import { Recording } from '../models/Recording';
import { History } from '../models/History';

const router = Router();

/**
 * Save recording metadata (called after local download completes)
 * POST /api/recordings/save
 */
router.post('/save', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const {
      meetingId,
      fileName,
      recordedAt,
      durationSeconds,
      fileSizeMB,
      meetingTitle,
      participants,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!meetingId || !fileName) {
      return res.status(400).json({ error: 'meetingId and fileName are required' });
    }

    // Create recording metadata
    const recording = new Recording({
      meetingId,
      userId,
      fileName,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      durationSeconds: durationSeconds || 0,
      fileSizeMB,
      meetingTitle,
      participants,
    });

    await recording.save();

    // Create history entry
    const historyEntry = new History({
      userId,
      meetingId,
      action: 'recorded',
      timestamp: new Date(),
      metadata: {
        fileName,
        durationSeconds,
        fileSizeMB,
        savedLocally: true,
      },
    });
    await historyEntry.save();

    console.log('[Recording] Saved metadata:', fileName);
    res.status(201).json(recording);
  } catch (error: any) {
    console.error('[Recording] Error saving metadata:', error.message);
    res.status(500).json({ error: 'Failed to save recording metadata' });
  }
});

/**
 * Get all recordings for current user
 * GET /api/recordings/my
 */
router.get('/my', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = 50, offset = 0 } = req.query;

    const recordings = await Recording.find({ userId })
      .sort({ recordedAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    res.json(recordings);
  } catch (error: any) {
    console.error('[Recording] Error fetching recordings:', error.message);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

/**
 * Get recordings for a specific meeting
 * GET /api/recordings/meeting/:meetingId
 */
router.get('/meeting/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const recordings = await Recording.find({ meetingId })
      .sort({ recordedAt: -1 });

    res.json(recordings);
  } catch (error: any) {
    console.error('[Recording] Error fetching meeting recordings:', error.message);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

/**
 * Delete recording metadata
 * DELETE /api/recordings/:recordingId
 */
router.delete('/:recordingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { recordingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const recording = await Recording.findById(recordingId);
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    // Only owner can delete
    if (recording.userId !== userId) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await Recording.deleteOne({ _id: recordingId });
    res.json({ message: 'Recording metadata deleted' });
  } catch (error: any) {
    console.error('[Recording] Error deleting recording:', error.message);
    res.status(500).json({ error: 'Failed to delete recording' });
  }
});

// =========================================
// Legacy endpoints (kept for compatibility)
// =========================================

// Save recording URL for a meeting (called by webhook or manually)
router.post('/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;
    const { recordingUrl, recordingId, duration } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Find meeting
    const meeting = await Meeting.findOne({ streamCallId: meetingId });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Only host can save recording
    if (meeting.hostId !== userId) {
      return res.status(403).json({ error: 'Only host can save recording' });
    }

    // Update meeting with recording info
    meeting.recordingUrl = recordingUrl;
    meeting.recordingId = recordingId;
    await meeting.save();

    // Create history entry
    const historyEntry = new History({
      userId: meeting.hostId,
      meetingId,
      action: 'recorded',
      timestamp: new Date(),
      metadata: {
        recordingUrl,
        recordingId,
        duration,
      },
    });
    await historyEntry.save();

    res.json(meeting);
  } catch (error: any) {
    console.error('Error saving recording:', error);
    res.status(500).json({ error: 'Failed to save recording', details: error.message });
  }
});

// Get all recordings for a host (legacy)
router.get('/host/:hostId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;
    const requestingUserId = req.userId;

    // Users can only view their own recordings
    if (hostId !== requestingUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { limit = 100, offset = 0 } = req.query;

    // Get local recordings
    const localRecordings = await Recording.find({ userId: hostId })
      .sort({ recordedAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    // Get cloud recordings from meetings (legacy)
    const meetings = await Meeting.find({
      hostId,
      recordingUrl: { $exists: true, $ne: null },
    })
      .sort({ endTime: -1, createdAt: -1 })
      .limit(Number(limit));

    // Format cloud recordings
    const cloudRecordings = meetings.map(meeting => ({
      type: 'cloud',
      meetingId: meeting.streamCallId,
      title: meeting.title,
      recordingUrl: meeting.recordingUrl,
      recordingId: meeting.recordingId,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      duration: meeting.endTime && meeting.startTime
        ? Math.floor((meeting.endTime.getTime() - meeting.startTime.getTime()) / 1000)
        : undefined,
      createdAt: meeting.createdAt,
    }));

    // Format local recordings
    const formattedLocal = localRecordings.map(r => ({
      type: 'local',
      _id: r._id,
      meetingId: r.meetingId,
      title: r.meetingTitle,
      fileName: r.fileName,
      durationSeconds: r.durationSeconds,
      fileSizeMB: r.fileSizeMB,
      recordedAt: r.recordedAt,
      createdAt: r.createdAt,
    }));

    // Combine and sort by date
    const allRecordings = [...formattedLocal, ...cloudRecordings]
      .sort((a, b) => {
        const dateA = (a as any).recordedAt || a.createdAt;
        const dateB = (b as any).recordedAt || b.createdAt;
        return new Date(dateB as Date).getTime() - new Date(dateA as Date).getTime();
      });

    res.json(allRecordings);
  } catch (error: any) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({ error: 'Failed to fetch recordings', details: error.message });
  }
});

// Get a specific recording (host only)
router.get('/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Check local recordings first
    const localRecording = await Recording.findOne({ meetingId, userId });
    if (localRecording) {
      return res.json({
        type: 'local',
        ...localRecording.toObject(),
        instruction: 'This recording is saved in your Downloads folder.',
      });
    }

    // Check cloud recordings (legacy)
    const meeting = await Meeting.findOne({ streamCallId: meetingId });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Only host can access recording
    if (meeting.hostId !== userId) {
      return res.status(403).json({ error: 'Only host can access this recording' });
    }

    if (!meeting.recordingUrl) {
      return res.status(404).json({ error: 'Recording not found for this meeting' });
    }

    res.json({
      type: 'cloud',
      meetingId: meeting.streamCallId,
      title: meeting.title,
      recordingUrl: meeting.recordingUrl,
      recordingId: meeting.recordingId,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      duration: meeting.endTime && meeting.startTime
        ? Math.floor((meeting.endTime.getTime() - meeting.startTime.getTime()) / 1000)
        : undefined,
    });
  } catch (error: any) {
    console.error('Error fetching recording:', error);
    res.status(500).json({ error: 'Failed to fetch recording', details: error.message });
  }
});

export { router as recordingRoutes };
