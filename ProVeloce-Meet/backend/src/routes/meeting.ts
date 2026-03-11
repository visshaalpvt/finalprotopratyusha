import { Router, Request, Response } from 'express';
import { verifyAuth } from './auth';
import { Meeting, IMeeting } from '../models/Meeting';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import { generateRoomId } from '../utils/room-utils';

const router = Router();

// Create a new meeting
router.post('/', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const { title, description, type, scheduledTime, participants = [] } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    // Get user info
    const user = await User.findOne({ clerkId: userId });

    // If user doesn't exist in MongoDB but is authenticated via Clerk, create them
    // This handles cases where the user hasn't hit the /stream/token endpoint yet
    let currentUser = user;

    if (!currentUser) {
      try {
        const { clerkClient } = await import('../config/clerk');
        const clerkUser = await clerkClient.users.getUser(userId);

        if (clerkUser) {
          currentUser = new User({
            clerkId: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@no-email.com`,
            username: clerkUser.username || undefined,
            firstName: clerkUser.firstName || undefined,
            lastName: clerkUser.lastName || undefined,
            imageUrl: clerkUser.imageUrl || undefined,
          });
          await currentUser.save();
          console.log('Auto-created user in meeting route:', userId);
        }
      } catch (err) {
        console.error('Failed to auto-create user in meeting route:', err);
        // Fall through to 404 if creation fails
      }
    }

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate Stream call ID
    const streamCallId = uuidv4();

    // Generate room code in XXX-XXXX-XXX format
    let roomCode = generateRoomId();
    // Ensure uniqueness
    let existingMeeting = await Meeting.findOne({ roomCode });
    while (existingMeeting) {
      roomCode = generateRoomId();
      existingMeeting = await Meeting.findOne({ roomCode });
    }

    const meetingLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/meeting/${streamCallId}`;

    // Note: Stream.io calls are created on-demand when users join via the frontend
    // No need to pre-create them on the backend

    // Get user's display name (firstName + lastName or username or email)
    const displayName = currentUser.firstName
      ? `${currentUser.firstName}${currentUser.lastName ? ` ${currentUser.lastName}` : ''}`
      : (currentUser.username || currentUser.email?.split('@')[0] || 'User');

    // For personal rooms, format title as "{Name}'s Meeting Room"
    const meetingTitle = type === 'personal'
      ? `${displayName}'s Meeting Room`
      : title;

    // Generate SEO metadata
    const seoTitle = `${meetingTitle} by ${displayName} - ProVeloce Meet`;
    const seoDescription = description ||
      `Join ${meetingTitle}${scheduledTime ? ` scheduled for ${new Date(scheduledTime).toLocaleDateString()}` : ''}. ${type.charAt(0).toUpperCase() + type.slice(1)} video meeting on ProVeloce Meet - secure online meeting platform.`;
    const seoKeywords = [
      'video meeting',
      'online meeting',
      'video conferencing',
      type === 'scheduled' ? 'scheduled meeting' : type === 'personal' ? 'personal room' : 'instant meeting',
      'secure collaboration',
    ];

    // Create meeting in MongoDB
    // For personal rooms, set status to 'ongoing' since they're started immediately
    const meeting = new Meeting({
      streamCallId,
      roomCode,
      title: meetingTitle,
      description,
      type,
      hostId: userId,
      hostName: displayName,
      hostImageUrl: currentUser.imageUrl,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      participants: [userId, ...participants],
      status: (type === 'instant' || type === 'personal') ? 'ongoing' : 'scheduled',
      startTime: (type === 'instant' || type === 'personal') ? new Date() : undefined,
      meetingLink,
      // SEO fields
      seoTitle,
      seoDescription,
      seoKeywords,
      isPublic: false, // Meetings are private by default
    });

    await meeting.save();

    res.status(201).json(meeting);
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting', details: error.message });
  }
});

// Get all meetings for a user
router.get('/', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const { status, type } = req.query;

    const query: any = {
      $or: [
        { hostId: userId },
        { participants: userId },
      ],
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const meetings = await Meeting.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(meetings);
  } catch (error: any) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings', details: error.message });
  }
});

// Find meeting by room code (public endpoint for joining) - must come before /:id
router.get('/code/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const formattedCode = code.toUpperCase().replace(/-/g, '').replace(/(.{3})(.{4})(.{3})/, '$1-$2-$3');

    const meeting = await Meeting.findOne({
      roomCode: formattedCode,
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check if meeting is still active
    if (meeting.status === 'ended' || meeting.status === 'cancelled') {
      return res.status(400).json({ error: 'Meeting has ended or been cancelled' });
    }

    res.json(meeting);
  } catch (error: any) {
    console.error('Error fetching meeting by code:', error);
    res.status(500).json({ error: 'Failed to fetch meeting', details: error.message });
  }
});

// Get a specific meeting by ID or room code
router.get('/:id', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Try to find by room code (XXX-XXXX-XXX format) or streamCallId
    const meeting = await Meeting.findOne({
      $or: [
        { streamCallId: id },
        { roomCode: id.toUpperCase() },
        { meetingLink: { $regex: id } },
      ],
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check if user has access (for personal rooms, allow anyone with the code)
    if (meeting.type !== 'personal' && meeting.hostId !== userId && !meeting.participants.includes(userId || '')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(meeting);
  } catch (error: any) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Failed to fetch meeting', details: error.message });
  }
});


// Update meeting status
router.patch('/:id/status', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    if (!['scheduled', 'ongoing', 'ended', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const meeting = await Meeting.findOne({ streamCallId: id });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Only host can update status
    if (meeting.hostId !== userId) {
      return res.status(403).json({ error: 'Only host can update meeting status' });
    }

    meeting.status = status;
    if (status === 'ongoing') {
      meeting.startTime = new Date();
    } else if (status === 'ended') {
      meeting.endTime = new Date();
    }

    await meeting.save();

    res.json(meeting);
  } catch (error: any) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Failed to update meeting', details: error.message });
  }
});

// Add participant to meeting
router.post('/:id/participants', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { participantId } = req.body;

    const meeting = await Meeting.findOne({ streamCallId: id });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (!meeting.participants.includes(participantId)) {
      meeting.participants.push(participantId);
      await meeting.save();
    }

    res.json(meeting);
  } catch (error: any) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Failed to add participant', details: error.message });
  }
});

// Delete meeting
router.delete('/:id', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const meeting = await Meeting.findOne({ streamCallId: id });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Only host can delete
    if (meeting.hostId !== userId) {
      return res.status(403).json({ error: 'Only host can delete meeting' });
    }

    await Meeting.deleteOne({ _id: meeting._id });

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting', details: error.message });
  }
});

export { router as meetingRoutes };

