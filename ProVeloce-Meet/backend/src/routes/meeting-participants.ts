import { Router, Request, Response } from 'express';
import { verifyAuth } from './auth';
import { MeetingParticipant } from '../models/MeetingParticipant';
import { Meeting } from '../models/Meeting';
import { User } from '../models/User';

const router = Router();

// Helper function to get user display name
const getUserDisplayName = (user: any): string => {
  if (user.firstName) {
    return user.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.firstName;
  }
  return user.username || user.email?.split('@')[0] || 'User';
};

// Track user joining a meeting - simplified, no transactions
router.post('/:meetingId/join', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Find meeting - optional, don't fail if not found
    let meeting = await Meeting.findOne({ streamCallId: meetingId });

    // Get user display info - try to get from DB, fallback to generic
    let userName = 'User';
    let userImageUrl: string | undefined;

    try {
      const user = await User.findOne({ clerkId: userId });
      if (user) {
        userName = getUserDisplayName(user);
        userImageUrl = user.imageUrl;
      } else {
        // Try to create user from Clerk (non-blocking)
        try {
          const { clerkClient } = await import('../config/clerk');
          const clerkUser = await clerkClient.users.getUser(userId);
          if (clerkUser) {
            userName = clerkUser.firstName
              ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
              : (clerkUser.username || 'User');
            userImageUrl = clerkUser.imageUrl;

            // Try to save to DB (non-blocking)
            try {
              const newUser = new User({
                clerkId: userId,
                email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@no-email.com`,
                username: clerkUser.username || undefined,
                firstName: clerkUser.firstName || undefined,
                lastName: clerkUser.lastName || undefined,
                imageUrl: clerkUser.imageUrl || undefined,
              });
              await newUser.save();
            } catch (saveError) {
              // Ignore save errors (e.g., duplicate key)
            }
          }
        } catch (clerkError) {
          // Ignore Clerk errors
        }
      }
    } catch (userError) {
      // Ignore user lookup errors
    }

    // Check if participant already exists
    let participant = await MeetingParticipant.findOne({ meetingId, userId });

    if (participant) {
      // If already exists but left, update to rejoin
      if (participant.leftAt) {
        participant.joinedAt = new Date();
        participant.leftAt = undefined;
        participant.duration = undefined;
        await participant.save();
      }
    } else {
      // Create new participant record
      const isHost = meeting?.hostId === userId;
      participant = new MeetingParticipant({
        meetingId,
        userId,
        userName,
        userImageUrl,
        joinedAt: new Date(),
        isHost,
      });

      try {
        await participant.save();
      } catch (saveError: any) {
        // Handle duplicate key error
        if (saveError?.code === 11000) {
          participant = await MeetingParticipant.findOne({ meetingId, userId });
        } else {
          throw saveError;
        }
      }

      // Try to add to meeting participants array (non-blocking)
      if (meeting && !meeting.participants.includes(userId)) {
        try {
          meeting.participants.push(userId);
          await meeting.save();
        } catch (meetingError) {
          // Ignore meeting update errors
        }
      }
    }

    // Try to create history entry (non-blocking, fire-and-forget)
    (async () => {
      try {
        const { History } = await import('../models/History');
        const historyEntry = new History({
          userId,
          meetingId,
          action: 'joined',
          timestamp: new Date(),
          metadata: { userName },
        });
        await historyEntry.save();
      } catch (historyError) {
        // Ignore history errors
      }
    })();

    // Try to update meeting status (non-blocking)
    if (meeting && !meeting.startTime) {
      try {
        meeting.startTime = new Date();
        if (meeting.status === 'scheduled') {
          meeting.status = 'ongoing';
        }
        await meeting.save();
      } catch (statusError) {
        // Ignore status update errors
      }
    }

    res.status(201).json(participant || { meetingId, userId, userName, joinedAt: new Date() });
  } catch (error: any) {
    console.error('Error tracking participant join:', error);
    // Still return success with minimal data - joining should never fail
    res.status(201).json({
      meetingId: req.params.meetingId,
      userId: req.userId,
      userName: 'User',
      joinedAt: new Date(),
      _note: 'Partial save - some features may be unavailable'
    });
  }
});

// Track user leaving a meeting - simplified, no transactions
router.post('/:meetingId/leave', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Find participant
    let participant = await MeetingParticipant.findOne({ meetingId, userId });

    if (!participant) {
      // Don't fail - just return success with minimal data
      return res.json({
        meetingId,
        userId,
        leftAt: new Date(),
        _note: 'No participant record found'
      });
    }

    // Update leave time and calculate duration
    if (!participant.leftAt) {
      participant.leftAt = new Date();
      const durationMs = participant.leftAt.getTime() - participant.joinedAt.getTime();
      participant.duration = Math.floor(durationMs / 1000);
      await participant.save();
    }

    // Try to create history entry (non-blocking, fire-and-forget)
    (async () => {
      try {
        const { History } = await import('../models/History');
        const historyEntry = new History({
          userId,
          meetingId,
          action: 'left',
          timestamp: new Date(),
          metadata: {
            userName: participant?.userName,
            duration: participant?.duration,
          },
        });
        await historyEntry.save();
      } catch (historyError) {
        // Ignore history errors
      }
    })();

    // Try to update meeting status if all left (non-blocking, fire-and-forget)
    (async () => {
      try {
        const activeParticipants = await MeetingParticipant.countDocuments({
          meetingId,
          leftAt: { $exists: false },
        });

        if (activeParticipants === 0) {
          const meeting = await Meeting.findOne({ streamCallId: meetingId });
          if (meeting && meeting.status === 'ongoing') {
            meeting.endTime = new Date();
            meeting.status = 'ended';
            if (meeting.startTime) {
              const durationMs = meeting.endTime.getTime() - meeting.startTime.getTime();
              meeting.duration = Math.floor(durationMs / 1000);
            }
            await meeting.save();
          }
        }
      } catch (meetingError) {
        // Ignore meeting update errors
      }
    })();

    res.json(participant);
  } catch (error: any) {
    console.error('Error tracking participant leave:', error);
    // Still return success - leaving should never fail
    res.json({
      meetingId: req.params.meetingId,
      userId: req.userId,
      leftAt: new Date(),
      _note: 'Partial save'
    });
  }
});

// Get all participants for a meeting
router.get('/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const participants = await MeetingParticipant.find({ meetingId }).sort({ joinedAt: -1 });
    res.json(participants);
  } catch (error: any) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants', details: error.message });
  }
});

// Get user's meeting attendance history
router.get('/user/:userId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.userId;

    if (userId !== requestingUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { limit = 100, offset = 0 } = req.query;
    const participants = await MeetingParticipant.find({ userId })
      .sort({ joinedAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    res.json(participants);
  } catch (error: any) {
    console.error('Error fetching user attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance', details: error.message });
  }
});

export { router as meetingParticipantRoutes };
