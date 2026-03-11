import { Router, Request, Response } from 'express';
import { verifyAuth } from './auth';
import { Meeting } from '../models/Meeting';
import { MeetingParticipant } from '../models/MeetingParticipant';
import { Chat } from '../models/Chat';
import { History } from '../models/History';

const router = Router();

// Get comprehensive meeting history for a user
router.get('/user/:userId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.userId;

    // Users can only view their own history
    if (userId !== requestingUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { limit = 50, offset = 0 } = req.query;

    // Get all meetings the user participated in
    const participants = await MeetingParticipant.find({ userId })
      .sort({ joinedAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    // Get meeting details for each participation
    const meetingIds = participants.map(p => p.meetingId);
    const meetings = await Meeting.find({ streamCallId: { $in: meetingIds } });

    // Create a map for quick lookup
    const meetingMap = new Map(meetings.map(m => [m.streamCallId, m]));

    // Build comprehensive history
    const history = await Promise.all(
      participants.map(async (participant) => {
        const meeting = meetingMap.get(participant.meetingId);
        
        // Get chat messages for this meeting
        const chatMessages = await Chat.find({ meetingId: participant.meetingId })
          .sort({ timestamp: 1 })
          .limit(100);

        // Get all history entries for this meeting
        const historyEntries = await History.find({ 
          meetingId: participant.meetingId 
        })
          .sort({ timestamp: 1 });

        return {
          meetingId: participant.meetingId,
          meeting: meeting ? {
            title: meeting.title,
            type: meeting.type,
            hostId: meeting.hostId,
            hostName: meeting.hostName,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            scheduledTime: meeting.scheduledTime,
            status: meeting.status,
            duration: meeting.duration,
            recordingUrl: meeting.recordingUrl,
          } : null,
          participation: {
            joinedAt: participant.joinedAt,
            leftAt: participant.leftAt,
            duration: participant.duration,
            isHost: participant.isHost,
          },
          chatMessages: chatMessages.map(msg => ({
            id: msg._id,
            userId: msg.userId,
            userName: msg.userName,
            message: msg.message,
            timestamp: msg.timestamp,
          })),
          historyEntries: historyEntries.map(entry => ({
            action: entry.action,
            timestamp: entry.timestamp,
            metadata: entry.metadata,
          })),
        };
      })
    );

    res.json(history);
  } catch (error: any) {
    console.error('Error fetching meeting history:', error);
    res.status(500).json({ error: 'Failed to fetch meeting history', details: error.message });
  }
});

// Get history for a specific meeting
router.get('/meeting/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Find meeting
    const meeting = await Meeting.findOne({ streamCallId: meetingId });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check if user participated in this meeting
    const participant = await MeetingParticipant.findOne({ meetingId, userId });
    if (!participant && meeting.hostId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all participants
    const participants = await MeetingParticipant.find({ meetingId })
      .sort({ joinedAt: 1 });

    // Get chat messages
    const chatMessages = await Chat.find({ meetingId })
      .sort({ timestamp: 1 });

    // Get history entries
    const historyEntries = await History.find({ meetingId })
      .sort({ timestamp: 1 });

    res.json({
      meeting: {
        streamCallId: meeting.streamCallId,
        title: meeting.title,
        type: meeting.type,
        hostId: meeting.hostId,
        hostName: meeting.hostName,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        scheduledTime: meeting.scheduledTime,
        status: meeting.status,
        duration: meeting.duration,
        recordingUrl: meeting.recordingUrl,
      },
      participants: participants.map(p => ({
        userId: p.userId,
        userName: p.userName,
        userImageUrl: p.userImageUrl,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        duration: p.duration,
        isHost: p.isHost,
      })),
      chatMessages: chatMessages.map(msg => ({
        id: msg._id,
        userId: msg.userId,
        userName: msg.userName,
        userImageUrl: msg.userImageUrl,
        message: msg.message,
        timestamp: msg.timestamp,
      })),
      historyEntries: historyEntries.map(entry => ({
        userId: entry.userId,
        action: entry.action,
        timestamp: entry.timestamp,
        metadata: entry.metadata,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching meeting history:', error);
    res.status(500).json({ error: 'Failed to fetch meeting history', details: error.message });
  }
});

export { router as meetingHistoryRoutes };

