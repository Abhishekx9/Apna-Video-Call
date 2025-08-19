// server.js
// Minimal Socket.IO chat server (Node.js + Express)
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  // For React/Vite frontends on a different port, adjust origin accordingly.
  cors: { origin: "*" }
});

// Serve static client
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('✅ user connected:', socket.id);

  // User joins with a name
  socket.on('join', (username) => {
    socket.data.username = username || 'Anonymous';
    console.log(`👤 ${socket.data.username} joined (${socket.id})`);
    socket.broadcast.emit('user connected', socket.data.username);
  });

  // Global chat message
  socket.on('chat message', (msg) => {
    const payload = {
      id: Date.now().toString(36),
      user: socket.data.username || 'Anonymous',
      text: msg,
      ts: new Date().toISOString()
    };
    io.emit('chat message', payload); // broadcast to everyone (including sender)
  });

  // Typing indicator (notify others only)
  socket.on('typing', () => {
    socket.broadcast.emit('typing', socket.data.username || 'Someone');
  });

  // Optional: Rooms (basic demo)
  socket.on('join room', (room) => {
    if (!room) return;
    socket.join(room);
    socket.to(room).emit('room notice', `${socket.data.username || 'Someone'} joined ${room}`);
  });

  socket.on('room message', ({ room, message }) => {
    if (!room) return;
    const payload = {
      user: socket.data.username || 'Anonymous',
      text: message,
      room,
      ts: new Date().toISOString()
    };
    io.to(room).emit('room message', payload);
  });

  socket.on('disconnect', () => {
    io.emit('user disconnected', socket.data.username || 'Anonymous');
    console.log('❌ user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running at http://localhost:${PORT}`);
});
