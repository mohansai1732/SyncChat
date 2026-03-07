import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const userSockets = new Map(); // userId -> Set(socketIds) for multi-tab

export const initSocket = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name');
      if (!user) return next(new Error('User not found'));
      socket.userId = user._id.toString();
      socket.userName = user.name;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() }).catch(() => {});

    socket.broadcast.emit('user:online', { userId });

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('disconnect', () => {
      const set = userSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          userSockets.delete(userId);
          User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() }).catch(() => {});
          socket.broadcast.emit('user:offline', { userId });
        }
      }
    });
  });

  return { userSockets, io };
};

export const emitNewMessage = (io, conversationId, message) => {
  io.to(`conv:${conversationId}`).emit('message:new', message);
};

export const emitMessageSeen = (io, conversationId, data) => {
  io.to(`conv:${conversationId}`).emit('message:seen', data);
};
