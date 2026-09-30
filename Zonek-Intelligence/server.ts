import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Bridgehead Backend is running" });
  });

  // Extraction Sessions Store (In-memory for now, will move to Firebase)
  const sessions = new Map();

  // Socket.IO for real-time extraction updates
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("extraction:start", (data) => {
      const { sessionId, website, url } = data;
      sessions.set(sessionId, { status: 'active', items: [], website, url });
      console.log(`Extraction started for ${website}: ${sessionId}`);
      socket.join(sessionId);
      
      // Notify all clients (especially the dashboard) that a new session has started
      io.emit("session:created", { 
        id: sessionId, 
        website, 
        url, 
        status: 'active', 
        timestamp: new Date().toISOString() 
      });

      socket.emit("extraction:init_ack", { status: "ready" });
    });

    socket.on("data:batch", (data) => {
      const { sessionId, items, batchId } = data;
      const session = sessions.get(sessionId);
      if (session) {
        session.items.push(...items);
        console.log(`Received batch ${batchId} for ${sessionId}: ${items.length} items`);
        // Broadcast to all clients in this session (e.g., the dashboard)
        io.to(sessionId).emit("data:update", { 
          sessionId, 
          newItems: items, 
          totalCount: session.items.length 
        });
        socket.emit("data:ack", { batchId, status: "received" });
      }
    });

    socket.on("extraction:complete", (data) => {
      const { sessionId } = data;
      const session = sessions.get(sessionId);
      if (session) {
        session.status = 'completed';
        console.log(`Extraction completed for ${sessionId}`);
        io.to(sessionId).emit("status:complete", { sessionId, totalItems: session.items.length });
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Bridgehead Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
