import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import after dotenv.config()
import connectDB from './config/database';
import { authRoutes } from './routes/auth';
import { streamRoutes } from './routes/stream';
import { meetingRoutes } from './routes/meeting';
import { chatRoutes } from './routes/chat';
import { historyRoutes } from './routes/history';
import { meetingParticipantRoutes } from './routes/meeting-participants';
import { recordingRoutes } from './routes/recordings';
import { meetingHistoryRoutes } from './routes/meeting-history';
import { webhookRoutes } from './routes/webhooks';
import { aiRoutes } from './routes/ai';
import { workspaceRoutes } from './routes/workspace';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Normalize FRONTEND_URL to remove trailing slashes for CORS matching
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const normalizedFrontendUrl = frontendUrl.replace(/\/+$/, ''); // Remove trailing slashes

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Normalize the origin by removing trailing slashes
    const normalizedOrigin = origin.replace(/\/+$/, '');

    // Check if the normalized origin matches the normalized frontend URL
    if (normalizedOrigin === normalizedFrontendUrl) {
      callback(null, true);
    } else {
      // Also allow localhost for development
      if (normalizedOrigin.startsWith('http://localhost:') || normalizedOrigin.startsWith('https://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
}));

// Middleware to enable iframe storage access
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'storage-access=(self)');
  next();
});

app.use(express.json());

// Connect to MongoDB
connectDB().catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/participants', meetingParticipantRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/meeting-history', meetingHistoryRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/workspaces', workspaceRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Proveloce Meet Backend Running' });
});

// Tracking/analytics endpoint (JSONP support for cross-origin requests)
app.get('/hybridaction/zybTrackerStatisticsAction', (req, res) => {
  try {
    const data = req.query.data || null;
    const callback = req.query.__callback__ || req.query.callback;

    const responseData = {
      success: true,
      received: data
    };

    // If callback is provided, return JSONP response
    if (callback && typeof callback === 'string') {
      // Sanitize callback name to prevent XSS
      const sanitizedCallback = callback.replace(/[^a-zA-Z0-9_.]/g, '');
      res.setHeader('Content-Type', 'application/javascript');
      res.send(`${sanitizedCallback}(${JSON.stringify(responseData)})`);
    } else {
      // No callback, return normal JSON response
      res.json(responseData);
    }
  } catch (error) {
    console.error('Error handling tracking request:', error);
    const errorResponse = { success: false, error: 'Internal server error' };
    const callback = req.query.__callback__ || req.query.callback;

    if (callback && typeof callback === 'string') {
      const sanitizedCallback = callback.replace(/[^a-zA-Z0-9_.]/g, '');
      res.setHeader('Content-Type', 'application/javascript');
      res.status(500).send(`${sanitizedCallback}(${JSON.stringify(errorResponse)})`);
    } else {
      res.status(500).json(errorResponse);
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ProVeloce Meet Backend API is running' });
});

// Handle Chrome DevTools well-known endpoint to prevent 404 errors
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).send(); // No Content - satisfies DevTools request
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

