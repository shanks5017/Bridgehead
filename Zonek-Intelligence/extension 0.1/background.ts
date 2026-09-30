/**
 * Bridgehead Extension - Background Service Worker
 */

import { io } from "socket.io-client";

interface Session {
  sessionId: string;
  website: string;
  url: string;
  items: any[];
}

let socket: any = null;

// Initialize connection to Bridgehead Backend with WebSocket transport ONLY
// (Prohibits forbidden XHR polling in Chrome Service Workers)
function connectToBackend(appUrl: string) {
  try {
    if (socket) socket.disconnect();
    socket = io(appUrl, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socket.on("connect", () => {
      console.log("Connected to Bridgehead Backend via WebSocket");
    });

    socket.on("connect_error", (err: any) => {
      console.error("Socket connection error:", err.message);
    });

    socket.on("data:ack", (data: any) => {
      console.log("Batch acknowledged:", data.batchId);
    });
  } catch (error) {
    console.error("Failed to initialize Socket.IO backend:", error);
  }
}

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.type === "INIT_SESSION") {
      connectToBackend(message.appUrl);
      
      // Persist session metadata
      chrome.storage.local.set({ 
        lastSession: {
          sessionId: message.sessionId,
          website: message.website,
          url: message.url,
          items: []
        }
      });

      if (socket && socket.connected) {
        socket.emit("extraction:start", { 
          sessionId: message.sessionId, 
          website: message.website, 
          url: message.url 
        });
      }
      sendResponse({ status: "connected" });
    }

    if (message.type === "DATA_BATCH") {
      // Append to local storage for persistence
      chrome.storage.local.get(["lastSession"], (result) => {
        const lastSession = result.lastSession as Session | undefined;
        if (lastSession && lastSession.sessionId === message.sessionId) {
          const updatedItems = [...(lastSession.items || []), ...message.items];
          chrome.storage.local.set({ 
            lastSession: { ...lastSession, items: updatedItems }
          });
        }
      });

      if (socket && socket.connected) {
        socket.emit("data:batch", {
          sessionId: message.sessionId,
          batchId: message.batchId,
          items: message.items
        });
      }
      sendResponse({ status: "sent" });
    }

    if (message.type === "COMPLETE_SESSION") {
      if (socket && socket.connected) {
        socket.emit("extraction:complete", { sessionId: message.sessionId });
      }
      sendResponse({ status: "completed" });
    }

    if (message.type === "GET_LAST_SESSION") {
      chrome.storage.local.get(["lastSession"], (result) => {
        sendResponse(result.lastSession || null);
      });
      return true; // Keep channel open for async response
    }
  } catch (error) {
    console.error("Fatal error in message listener:", error);
    sendResponse({ error: "Internal Service Worker Error" });
  }

  return true;
});
