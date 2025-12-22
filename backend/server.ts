import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import imageRoutes from './routes/images';
import statsRoutes from './routes/stats';
import conversationRoutes from './routes/conversations';
import userRoutes from './routes/users';
import communityRoutes from './routes/community'; // Join the Hive
import './models/ensureModels';
import http from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'NODE_ENV'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Connect to Database
connectDB();

const app = express();
const httpServer = http.createServer(app);

// Configure Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for dev, restrict in prod
    methods: ["GET", "POST"]
  }
});

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_post', (postId) => {
    socket.join(postId);
    console.log(`User ${socket.id} joined post room: ${postId}`);
  });

  // Join a personal user room for notifications
  socket.on('join_user', (userId) => {
    socket.join(userId);
    console.log(`User ${socket.id} joined personal room: ${userId}`);
  });

  // Join a specific conversation
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation: ${conversationId}`);
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    // data: { conversationId, senderId, text, media, recipientIds }
    // In a real implementation, we would save to DB here via Controller or Service
    // For now, we relay to the conversation room and recipients

    console.log('Message received:', data);

    // Emit to everyone in the conversation (including sender)
    io.to(data.conversationId).emit('receive_message', data);

    // Also emit a 'notification' to recipients if they aren't in the conversation
    if (data.recipientIds && Array.isArray(data.recipientIds)) {
      data.recipientIds.forEach((uid: string) => {
        io.to(uid).emit('new_message_notification', data);
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// ... (Rest of middleware)

// Serve uploaded files statically with CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/stats', statsRoutes);

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Bridgehead API is running!',
    socket_enabled: true,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ... (Error handling)

const PORT = process.env.PORT || 5001;

const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT} (Socket.io enabled)`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

export default app;