import { Router, Request, Response } from 'express';
import { verifyAuth } from './auth';
import { Chat } from '../models/Chat';
import { User } from '../models/User';
import { MeetingParticipant } from '../models/MeetingParticipant';
import { clerkClient } from '../config/clerk';

const router = Router();

/**
 * Get or create user from Clerk (with fallback to provided info)
 * Never returns null - always provides usable user info
 */
async function getOrCreateUser(
  userId: string,
  fallback?: { name?: string; avatar?: string }
): Promise<{ displayName: string; imageUrl?: string; clerkId: string }> {
  // Try to find existing user in DB
  const existingUser = await User.findOne({ clerkId: userId });
  if (existingUser) {
    return {
      clerkId: userId,
      displayName: getUserDisplayName(existingUser),
      imageUrl: existingUser.imageUrl,
    };
  }

  // Try to fetch from Clerk
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    if (clerkUser) {
      // Create user in DB
      const newUser = new User({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@unknown.com`,
        username: clerkUser.username || undefined,
        firstName: clerkUser.firstName || undefined,
        lastName: clerkUser.lastName || undefined,
        imageUrl: clerkUser.imageUrl || undefined,
      });

      await newUser.save().catch(() => { }); // Ignore duplicate errors
      console.log('[Chat] Auto-created user from Clerk:', userId);

      return {
        clerkId: userId,
        displayName: getUserDisplayName(newUser),
        imageUrl: clerkUser.imageUrl,
      };
    }
  } catch (error: any) {
    console.warn('[Chat] Clerk lookup failed, using fallback:', error.message);
  }

  // Use fallback info from request body
  return {
    clerkId: userId,
    displayName: fallback?.name || 'Participant',
    imageUrl: fallback?.avatar,
  };
}

/**
 * Get user display name from user document
 */
function getUserDisplayName(user: any): string {
  if (user.firstName) {
    return user.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.firstName;
  }
  return user.username || user.email?.split('@')[0] || 'User';
}

/**
 * Auto-register participant in meeting (upsert)
 * Called when user sends a message or joins
 */
async function ensureParticipant(
  meetingId: string,
  userId: string,
  userName: string,
  userImageUrl?: string
): Promise<void> {
  try {
    await MeetingParticipant.findOneAndUpdate(
      { meetingId, userId },
      {
        $setOnInsert: {
          meetingId,
          userId,
          userName,
          userImageUrl,
          joinedAt: new Date(),
          isHost: false,
        },
      },
      { upsert: true, new: true }
    );
  } catch (error: any) {
    // Ignore duplicate key errors (race condition)
    if (error.code !== 11000) {
      console.warn('[Chat] Failed to upsert participant:', error.message);
    }
  }
}

// Get chat messages for a meeting
router.get('/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Chat.find({ meetingId })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    res.json(messages.reverse()); // Return in chronological order
  } catch (error: any) {
    console.error('[Chat] Error fetching messages:', error.message);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Send a chat message (supports both new and legacy formats)
router.post('/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;
    const {
      message,
      content, // Alternative field name
      encryptedMessage,
      iv,
      // Frontend-provided sender info (fallback)
      senderId,
      senderName,
      senderAvatar,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Support both encrypted and plaintext messages
    const messageContent = message || content;
    const isEncrypted = !!(encryptedMessage && iv);
    const hasContent = !!(messageContent?.trim() || encryptedMessage);

    if (!hasContent) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Get user info with frontend fallback (NEVER fails)
    const userInfo = await getOrCreateUser(userId, {
      name: senderName,
      avatar: senderAvatar,
    });

    // Auto-register as participant (non-blocking)
    ensureParticipant(meetingId, userId, userInfo.displayName, userInfo.imageUrl);

    const chatMessage = new Chat({
      meetingId,
      userId,
      userName: userInfo.displayName,
      userImageUrl: userInfo.imageUrl,
      message: isEncrypted ? '[Encrypted]' : messageContent.trim(),
      encryptedMessage: isEncrypted ? encryptedMessage : undefined,
      iv: isEncrypted ? iv : undefined,
      isEncrypted,
      timestamp: new Date(),
    });

    await chatMessage.save();
    res.status(201).json(chatMessage);
  } catch (error: any) {
    console.error('[Chat] Error sending message:', error.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send encrypted chat message (E2EE)
router.post('/:meetingId/encrypted', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;
    const { encryptedMessage, iv, senderName, senderAvatar } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!encryptedMessage || !iv) {
      return res.status(400).json({ error: 'Encrypted message and IV are required' });
    }

    // Get user info with fallback
    const userInfo = await getOrCreateUser(userId, {
      name: senderName,
      avatar: senderAvatar,
    });

    // Auto-register as participant
    ensureParticipant(meetingId, userId, userInfo.displayName, userInfo.imageUrl);

    const chatMessage = new Chat({
      meetingId,
      userId,
      userName: userInfo.displayName,
      userImageUrl: userInfo.imageUrl,
      message: '[Encrypted]',
      encryptedMessage,
      iv,
      isEncrypted: true,
      timestamp: new Date(),
    });

    await chatMessage.save();
    res.status(201).json(chatMessage);
  } catch (error: any) {
    console.error('[Chat] Error sending encrypted message:', error.message);
    res.status(500).json({ error: 'Failed to send encrypted message' });
  }
});

// Register participant when joining meeting
router.post('/:meetingId/join', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;
    const { userName, userImageUrl, isHost } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user info
    const userInfo = await getOrCreateUser(userId, {
      name: userName,
      avatar: userImageUrl,
    });

    // Upsert participant
    const participant = await MeetingParticipant.findOneAndUpdate(
      { meetingId, userId },
      {
        $set: {
          userName: userInfo.displayName,
          userImageUrl: userInfo.imageUrl,
          leftAt: undefined, // Clear leftAt on rejoin
        },
        $setOnInsert: {
          meetingId,
          userId,
          joinedAt: new Date(),
          isHost: isHost || false,
        },
      },
      { upsert: true, new: true }
    );

    res.json(participant);
  } catch (error: any) {
    console.error('[Chat] Error joining meeting:', error.message);
    res.status(500).json({ error: 'Failed to join meeting' });
  }
});

// Mark participant as left
router.post('/:meetingId/leave', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const participant = await MeetingParticipant.findOneAndUpdate(
      { meetingId, userId },
      {
        $set: {
          leftAt: new Date(),
        },
      },
      { new: true }
    );

    if (participant && participant.joinedAt) {
      const duration = Math.floor(
        (new Date().getTime() - new Date(participant.joinedAt).getTime()) / 1000
      );
      participant.duration = duration;
      await participant.save();
    }

    res.json({ message: 'Left meeting', participant });
  } catch (error: any) {
    console.error('[Chat] Error leaving meeting:', error.message);
    res.status(500).json({ error: 'Failed to leave meeting' });
  }
});

// Delete a chat message (only by sender)
router.delete('/:meetingId/:messageId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const message = await Chat.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await Chat.deleteOne({ _id: messageId });
    res.json({ message: 'Message deleted' });
  } catch (error: any) {
    console.error('[Chat] Error deleting message:', error.message);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export { router as chatRoutes };
