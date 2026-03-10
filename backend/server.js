/**
 * server.js
 * Express + Socket.io backend for Inclusive Classroom AI.
 * Handles real-time transcript broadcasting, translation API, and session management.
 */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { translationRouter } from './translationController.js';
import { sessionManager } from './sessionController.js';
import { aiService } from './aiService.js';

const app = express();
const server = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || '*';

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL === '*' ? '*' : [FRONTEND_URL, 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

/* ---- Middleware ---- */
app.use(cors({
  origin: FRONTEND_URL === '*' ? '*' : [FRONTEND_URL, 'http://localhost:5173'],
}));
app.use(express.json());

/* ---- API Routes ---- */
app.use('/api', translationRouter);

app.get('/api/session', (_req, res) => {
  const session = sessionManager.getActiveSession();
  res.json(session || { active: false });
});

app.post('/api/summary', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: 'No transcript provided' });
  
  const summary = await aiService.generateSummary(transcript);
  res.json({ summary });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

/* ---- Socket.io Events ---- */
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Send current state to new client
  const session = sessionManager.getActiveSession();
  if (session) {
    socket.emit('session-info', session);
    socket.emit('lecture-status', { status: session.status });
    if (session.transcript.length > 0) {
      socket.emit('transcript-history', session.transcript);
    }
  }
  io.emit('student-count', sessionManager.getStudentCount());

  /* ---- Admin events ---- */

  socket.on('start-lecture', (data) => {
    const s = sessionManager.createSession(data?.title || 'Untitled Lecture');
    socket.join('admin');
    socket.data.role = 'admin';
    io.emit('session-info', s);
    io.emit('lecture-status', { status: 'running' });
    io.emit('student-count', sessionManager.getStudentCount());
    console.log(`[Lecture] Started: ${s.sessionId}`);
  });

  socket.on('pause-lecture', () => {
    sessionManager.updateStatus('paused');
    io.emit('lecture-status', { status: 'paused' });
  });

  socket.on('resume-lecture', () => {
    sessionManager.updateStatus('running');
    io.emit('lecture-status', { status: 'running' });
  });

  socket.on('end-lecture', () => {
    sessionManager.updateStatus('ended');
    io.emit('lecture-status', { status: 'ended' });
    io.emit('session-info', sessionManager.getActiveSession());
  });

  socket.on('transcript-update', (data) => {
    const entry = sessionManager.addTranscript(data.text, data.timestamp);
    io.emit('transcript-broadcast', entry);
  });

  socket.on('clear-transcript', () => {
    sessionManager.clearTranscript();
    io.emit('transcript-cleared');
  });

  /* ---- WebRTC Video Signaling ---- */
  socket.on('join-video-room', ({ roomId, isTeacher }) => {
    socket.join(roomId);
    console.log(`[Video] ${isTeacher ? 'Teacher' : 'Student'} ${socket.id} joined room ${roomId}`);
    // Notify others in room
    socket.to(roomId).emit('user-connected', {
      userId: socket.id,
      isTeacher,
      name: socket.data?.name || (isTeacher ? 'Teacher' : 'Student')
    });

    // Send room users' info to the new user so they can initiate connections
    const clients = io.sockets.adapter.rooms.get(roomId);
    const usersInRoom = [];
    if (clients) {
        for (const clientId of clients) {
            const clientSocket = io.sockets.sockets.get(clientId);
            if (clientSocket) {
                usersInRoom.push({
                    userId: clientId,
                    isTeacher: clientSocket.data?.role === 'admin',
                    name: clientSocket.data?.name || (clientSocket.id === socket.id ? userName : 'User')
                });
            }
        }
    }
    socket.emit('room-users', usersInRoom);
  });

  socket.on('request-join-room', ({ roomId, userName }) => {
    socket.join(`waiting-${roomId}`);
    // Send request to the teacher in the main roomId
    io.to(roomId).emit('join-request', {
      studentId: socket.id,
      userName
    });
  });

  socket.on('join-response', ({ studentId, roomId, status }) => {
    io.to(studentId).emit('join-response-result', { status, roomId });
    if (status === 'accepted') {
      // The student will proceed to emit 'join-video-room'
    } else {
      // Clean up the waiting room
      const studentSocket = io.sockets.sockets.get(studentId);
      if (studentSocket) studentSocket.leave(`waiting-${roomId}`);
    }
  });

  socket.on('webrtc-offer', (data) => {
    io.to(data.target).emit('webrtc-offer', {
      offer: data.offer,
      callerId: socket.id,
      isTeacher: data.isTeacher,
      name: data.name
    });
  });

  socket.on('webrtc-answer', (data) => {
    io.to(data.target).emit('webrtc-answer', {
      answer: data.answer,
      replierId: socket.id
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    io.to(data.target).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      senderId: socket.id
    });
  });

  /* ---- Student events ---- */

  socket.on('join-session', (data) => {
    socket.join('students');
    socket.data.role = 'student';
    socket.data.name = data?.name || 'Anonymous';
    sessionManager.addStudent(socket.id, socket.data.name);
    const newXp = sessionManager.addXP(socket.id, 10);
    socket.emit('xp-update', { xp: newXp, reason: 'Joined on time! ✨' });
    io.emit('student-count', sessionManager.getStudentCount());
    console.log(`[Student] Joined: ${socket.data.name} (XP: ${newXp})`);
  });

  socket.on('student-question', (data) => {
    const newXp = sessionManager.addXP(socket.id, 5);
    socket.emit('xp-update', { xp: newXp, reason: 'Asked a question 🙋‍♀️' });

    io.to('admin').emit('student-notification', {
      type: 'question',
      studentName: socket.data?.name || 'Anonymous',
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('student-feedback', (data) => {
    io.to('admin').emit('student-notification', {
      type: 'feedback',
      studentName: socket.data?.name || 'Anonymous',
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('admin-join', () => {
    socket.join('admin');
    socket.data.role = 'admin';
    console.log(`[Admin] Registered: ${socket.id}`);
  });

  socket.on('student-sign', (data) => {
    console.log(`[Server] Received student-sign from ${socket.id}:`, data.sign);
    const newXp = sessionManager.addXP(socket.id, 2);
    socket.emit('xp-update', { xp: newXp, reason: 'Used Sign Language 🖐️' });

    io.to('admin').emit('student-notification', {
      type: 'sign-language',
      studentName: socket.data?.name || 'Anonymous',
      sign: data.sign,
      meaning: data.meaning,
      icon: data.icon,
      confidence: data.confidence,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('ask-ai', async (data) => {
    console.log(`[AI] Assistant asked by ${socket.data.name}: ${data.question}`);
    const session = sessionManager.getActiveSession();
    const contextText = session ? session.transcript.map(t => t.text).join(' ') : "";
    
    // Add XP for using AI
    const newXp = sessionManager.addXP(socket.id, 1);
    socket.emit('xp-update', { xp: newXp, reason: 'Used AI Assistant 🤖' });

    socket.emit('ai-answer-start');
    const answer = await aiService.answerQuestion(data.question, contextText);
    socket.emit('ai-answer-done', { answer, question: data.question });
  });

  socket.on('request-summary', async () => {
    console.log('[Summary] Request received');
    const session = sessionManager.getActiveSession();
    if (!session || session.transcript.length === 0) {
      console.log('[Summary] Request aborted: No session or transcript empty');
      return;
    }
    
    const fullText = session.transcript.map(t => t.text).join(' ');
    console.log(`[Summary] Generating summary for text length: ${fullText.length}`);
    try {
      const summary = await aiService.generateSummary(fullText);
      console.log(`[Summary] Generation successful, broadcasting...`);
      io.emit('summary-generated', { summary });
    } catch (e) {
      console.error(`[Summary] Error during generation:`, e);
      io.emit('summary-generated', { summary: "AI Summary generation failed due to a server error." });
    }
  });

  /* ---- Disconnect ---- */

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('user-disconnected', socket.id);
      }
    }
  });

  socket.on('disconnect', () => {
    if (socket.data?.role === 'student') {
      sessionManager.removeStudent(socket.id);
      io.emit('student-count', sessionManager.getStudentCount());
    }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

/* ---- Start ---- */
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎓  Inclusive Classroom AI — Backend`);
  console.log(`   Server  → http://localhost:${PORT}`);
  console.log(`   Socket  → ready\n`);
});
