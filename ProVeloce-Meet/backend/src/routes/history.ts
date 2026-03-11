import { Router, Request, Response } from 'express';
import { verifyAuth } from './auth';
import { History } from '../models/History';

const router = Router();

// Get history for a user
router.get('/user/:userId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.userId;

    // Users can only view their own history
    if (userId !== requestingUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { limit = 100, offset = 0, meetingId } = req.query;

    const query: any = { userId };

    if (meetingId) {
      query.meetingId = meetingId;
    }

    const history = await History.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    res.json(history);
  } catch (error: any) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history', details: error.message });
  }
});

// Get history for a meeting
router.get('/meeting/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const history = await History.find({ meetingId })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    res.json(history);
  } catch (error: any) {
    console.error('Error fetching meeting history:', error);
    res.status(500).json({ error: 'Failed to fetch meeting history', details: error.message });
  }
});

// Create a history entry
router.post('/', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId, action, metadata } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    if (!meetingId || !action) {
      return res.status(400).json({ error: 'Meeting ID and action are required' });
    }

    const historyEntry = new History({
      userId,
      meetingId,
      action,
      metadata,
      timestamp: new Date(),
    });

    await historyEntry.save();

    res.status(201).json(historyEntry);
  } catch (error: any) {
    console.error('Error creating history entry:', error);
    res.status(500).json({ error: 'Failed to create history entry', details: error.message });
  }
});

export { router as historyRoutes };

