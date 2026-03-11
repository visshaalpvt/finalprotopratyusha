import { Router, Request, Response } from 'express';
import { StreamClient } from '@stream-io/node-sdk';
import { verifyAuth } from './auth';
import { isTokenExpiringSoon } from '../config/clerk';

const router = Router();

// Token expiry configuration
const TOKEN_EXPIRY_HOURS = 4; // 4 hours for long meetings
const TOKEN_REFRESH_BUFFER_SECONDS = 300; // Refresh 5 min before expiry

// Stream credentials getter
const getStreamCredentials = () => {
  const STREAM_API_KEY = process.env.STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;

  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    console.warn('⚠️  Stream API credentials are missing!');
  }

  return { STREAM_API_KEY, STREAM_API_SECRET };
};

// Stream client singleton
let streamClient: StreamClient | null = null;
const getStreamClient = () => {
  if (!streamClient) {
    const { STREAM_API_KEY, STREAM_API_SECRET } = getStreamCredentials();
    if (STREAM_API_KEY && STREAM_API_SECRET) {
      streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
    }
  }
  return streamClient;
};

/**
 * Generate Stream token for authenticated user
 * Extended to 4 hours for long meetings
 */
router.post('/token', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      console.error('[Stream] Token generation failed: User ID not found');
      return res.status(401).json({
        error: 'Unauthorized: User ID not found',
        details: 'Authentication token was valid but user ID could not be extracted'
      });
    }

    const { STREAM_API_KEY, STREAM_API_SECRET } = getStreamCredentials();

    if (!STREAM_API_KEY || !STREAM_API_SECRET) {
      console.error('[Stream] Token generation failed: API credentials missing');
      return res.status(500).json({
        error: 'Stream API credentials are not configured',
        details: 'STREAM_API_KEY and STREAM_API_SECRET must be set'
      });
    }

    // Generate Stream token with extended expiry
    const client = getStreamClient();
    if (!client) {
      return res.status(500).json({ error: 'Failed to initialize Stream client' });
    }

    const expirationTime = Math.floor(Date.now() / 1000) + (TOKEN_EXPIRY_HOURS * 3600);
    const issuedAt = Math.floor(Date.now() / 1000) - 60;
    const token = client.createToken(userId, expirationTime, issuedAt);

    if (!token || typeof token !== 'string') {
      console.error('[Stream] Client returned invalid token');
      return res.status(500).json({ error: 'Failed to generate Stream token' });
    }

    // Background: Cache token in MongoDB (non-blocking)
    cacheTokenInBackground(userId, token, expirationTime).catch((err) => {
      console.warn('[Stream] MongoDB cache failed (non-blocking):', err.message);
    });

    // Return token with metadata
    return res.json({
      token,
      expiresAt: expirationTime,
      expiresIn: TOKEN_EXPIRY_HOURS * 3600,
    });
  } catch (error: any) {
    console.error('[Stream] Unexpected error:', error.message);
    res.status(500).json({
      error: 'Failed to generate Stream token',
      details: error.message || 'An unexpected error occurred'
    });
  }
});

/**
 * Refresh token proactively (before expiry)
 */
router.post('/refresh', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { currentToken } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if current token needs refresh
    if (currentToken && !isTokenExpiringSoon(currentToken, TOKEN_REFRESH_BUFFER_SECONDS)) {
      return res.json({
        refreshed: false,
        message: 'Token still valid',
      });
    }

    const client = getStreamClient();
    if (!client) {
      return res.status(500).json({ error: 'Failed to initialize Stream client' });
    }

    const expirationTime = Math.floor(Date.now() / 1000) + (TOKEN_EXPIRY_HOURS * 3600);
    const issuedAt = Math.floor(Date.now() / 1000) - 60;
    const token = client.createToken(userId, expirationTime, issuedAt);

    // Cache in background
    cacheTokenInBackground(userId, token, expirationTime).catch(() => { });

    return res.json({
      refreshed: true,
      token,
      expiresAt: expirationTime,
      expiresIn: TOKEN_EXPIRY_HOURS * 3600,
    });
  } catch (error: any) {
    console.error('[Stream] Refresh error:', error.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

/**
 * Background token caching
 */
async function cacheTokenInBackground(userId: string, token: string, expirationTime: number) {
  try {
    const { User } = await import('../models/User');
    let user = await User.findOne({ clerkId: userId });

    if (user) {
      user.streamToken = token;
      user.streamTokenExpiry = new Date(expirationTime * 1000);
      await user.save();
    } else {
      const { clerkClient } = await import('../config/clerk');
      const clerkUser = await clerkClient.users.getUser(userId);

      if (clerkUser) {
        const newUser = new User({
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@no-email.com`,
          username: clerkUser.username || undefined,
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
          imageUrl: clerkUser.imageUrl || undefined,
          streamToken: token,
          streamTokenExpiry: new Date(expirationTime * 1000),
        });
        await newUser.save();
      }
    }
  } catch (error: any) {
    throw error;
  }
}

export { router as streamRoutes };
