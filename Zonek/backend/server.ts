import express, { Request, Response, NextFunction } from 'express';
// Trigger restart
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

import { verifySupabaseConnection } from './config/db';
import authRoutes        from './routes/auth';
import postRoutes        from './routes/posts';
import imageRoutes       from './routes/images';
import statsRoutes       from './routes/stats';
import conversationRoutes from './routes/conversations';
import userRoutes        from './routes/users';
import communityRoutes   from './routes/community';
import aiRoutes          from './routes/ai';
import govRoutes         from './routes/gov';
import { launchEngines } from './utils/engineLauncher';

// Load environment variables
dotenv.config();

// Validate required env vars
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'NODE_ENV'];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Verify Supabase connectivity on startup
verifySupabaseConnection();

// Auto-launch sub-engines in development
if (process.env.NODE_ENV === 'development') {
  launchEngines();
}

const app = express();
const httpServer = http.createServer(app);

// ---------------------------------------------------------------------------
// CORS — Allow any localhost port in dev, or the explicit FRONTEND_URL in prod
// ---------------------------------------------------------------------------
const isDev = process.env.NODE_ENV === 'development';
const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow requests with no origin (curl, mobile apps, Postman)
  if (!origin) return callback(null, true);
  // In dev: allow any localhost port
  if (isDev && /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
  // Otherwise check against the explicit FRONTEND_URL
  const allowed = process.env.FRONTEND_URL || 'http://localhost:3000';
  if (origin === allowed) return callback(null, true);
  callback(new Error(`CORS: origin '${origin}' not allowed`));
};

// ---------------------------------------------------------------------------
// SOCKET.IO — Real-time messaging
// ---------------------------------------------------------------------------
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_post', (postId: string) => {
    socket.join(postId);
  });

  socket.on('join_user', (userId: string) => {
    socket.join(userId);
  });

  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
  });

  socket.on('send_message', (data: {
    conversationId: string;
    senderId: string;
    text?: string;
    media?: any[];
    recipientIds?: string[];
  }) => {
    // Relay to the conversation room (all participants)
    io.to(data.conversationId).emit('receive_message', data);

    // Also emit a notification to each recipient's personal room
    if (data.recipientIds && Array.isArray(data.recipientIds)) {
      data.recipientIds.forEach((uid) => {
        io.to(uid).emit('new_message_notification', data);
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ---------------------------------------------------------------------------
// MIDDLEWARE
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// ---------------------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------------------
app.use('/api/auth',          authRoutes);
app.use('/api/posts',         postRoutes);
app.use('/api/images',        imageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/community',     communityRoutes);
app.use('/api/stats',         statsRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/gov',           govRoutes);

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Bridgehead API is running!',
    database: 'Supabase (PostgreSQL)',
    storage: 'Supabase Storage',
    socket_enabled: true,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ---------------------------------------------------------------------------
// START
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5001;

const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT} (Socket.io enabled)`);
  console.log(`🗄️  Database: Supabase — https://icsoljtmqwqibwpqhwyf.supabase.co`);
});

process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err?.message ?? err);
  server.close(() => process.exit(1));
});

export default app;