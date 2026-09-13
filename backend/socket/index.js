import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const userSockets = new Map(); // userId -> Set(socketIds) for multi-tab
const activeCalls = new Map(); // userId -> peerId

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

  const notifyOtherSockets = (userId, excludeSocketId, event, data) => {
    const sockets = userSockets.get(userId);
    if (!sockets) return;
    for (const sid of sockets) {
      if (sid !== excludeSocketId) {
        io.to(sid).emit(event, data);
      }
    }
  };

  io.on('connection', (socket) => {
    const userId = socket.userId;
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);
    socket.join(`user:${userId}`);

    User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() }).catch(() => {});

    socket.broadcast.emit('user:online', { userId });

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    // ==========================================
    // WEBRTC CALL SIGNALING
    // ==========================================

    // Outgoing call invite from caller
    socket.on('call:invite', ({ callId, toUserId, conversationId, callType, offer }) => {
      if (!toUserId || toUserId === userId) return;

      const targetSockets = userSockets.get(toUserId);
      const isOnline = targetSockets && targetSockets.size > 0;

      // 1. Check if recipient is connected
      if (!isOnline) {
        socket.emit('call:unavailable', {
          callId,
          toUserId,
          reason: 'User is offline',
        });
        return;
      }

      // 2. Check if recipient or caller is already in an active call
      if (activeCalls.has(toUserId) || activeCalls.has(userId)) {
        socket.emit('call:busy', {
          callId,
          toUserId,
          reason: 'User is busy on another call',
        });
        return;
      }

      // 3. Relay incoming call to recipient's room
      io.to(`user:${toUserId}`).emit('call:incoming', {
        callId,
        caller: {
          _id: userId,
          name: socket.userName,
        },
        conversationId,
        callType,
        offer,
      });
    });

    // Call accepted by recipient
    socket.on('call:accept', ({ callId, toUserId, answer }) => {
      if (!toUserId) return;

      // Register both participants in activeCalls map
      activeCalls.set(userId, toUserId);
      activeCalls.set(toUserId, userId);

      // Relay acceptance to caller
      io.to(`user:${toUserId}`).emit('call:accepted', {
        callId,
        answer,
        responder: {
          _id: userId,
          name: socket.userName,
        },
      });

      // Dismiss duplicate incoming ringing modals on user's other open tabs/devices
      notifyOtherSockets(userId, socket.id, 'call:cancelled', { callId });
    });

    // Call rejected / declined by recipient
    socket.on('call:reject', ({ callId, toUserId, reason = 'declined' }) => {
      if (!toUserId) return;

      io.to(`user:${toUserId}`).emit('call:rejected', {
        callId,
        reason,
      });

      // Dismiss duplicate incoming ringing modals on user's other open tabs/devices
      notifyOtherSockets(userId, socket.id, 'call:cancelled', { callId });
    });

    // ICE Candidate exchange
    socket.on('call:ice-candidate', ({ callId, toUserId, candidate }) => {
      if (!toUserId || !candidate) return;

      io.to(`user:${toUserId}`).emit('call:ice-candidate', {
        callId,
        candidate,
        fromUserId: userId,
      });
    });

    // Call ended by either participant
    socket.on('call:end', ({ callId, toUserId }) => {
      activeCalls.delete(userId);
      if (toUserId) {
        activeCalls.delete(toUserId);
        io.to(`user:${toUserId}`).emit('call:ended', { callId, fromUserId: userId });
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      const set = userSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          userSockets.delete(userId);
          User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() }).catch(() => {});
          socket.broadcast.emit('user:offline', { userId });

          // If disconnected during an active call, notify peer and clean up map
          if (activeCalls.has(userId)) {
            const peerId = activeCalls.get(userId);
            activeCalls.delete(userId);
            activeCalls.delete(peerId);
            io.to(`user:${peerId}`).emit('call:ended', {
              fromUserId: userId,
              reason: 'disconnected',
            });
          }
        }
      }
    });
  });

  return { userSockets, activeCalls, io };
};

export const emitNewMessage = (io, conversation, message) => {
  const conversationId = conversation._id.toString();
  const participantRooms = conversation.participants.map((participantId) => {
    return `user:${(participantId._id || participantId).toString()}`;
  });

  io.to([`conv:${conversationId}`, ...participantRooms]).emit('message:new', {
    ...message,
    conversationDetails: conversation,
  });
};

export const emitMessageSeen = (io, conversationId, data) => {
  io.to(`conv:${conversationId}`).emit('message:seen', data);
};
