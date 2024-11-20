"use strict";
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3001;
const io = new Server(PORT, {
  cors: {
    origin: "*", // Allow any origin for simplicity, update this for production
    methods: ["GET", "POST"],
  },
});

let defaultValue = ""; // Stores the text data

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle the "get-text" event
  socket.on("get-text", () => {
    socket.join("room");
    socket.emit("load-text", defaultValue); // Send the current text data

    // Handle "save-text" event to update the stored text
    socket.on("save-text", (text) => {
      defaultValue = text;
    });

    // Handle "send-changes" event to broadcast changes to others in the room
    socket.on("send-changes", (delta) => {
      socket.broadcast.to("room").emit("receive-changes", delta);
    });
  });

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

console.log(`Socket.IO server running on port ${PORT}`);
