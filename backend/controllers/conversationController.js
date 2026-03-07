import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body;
    if (!participantId || participantId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Valid participant required.' });
    }
    const otherId = new mongoose.Types.ObjectId(participantId);
    const participants = [req.user._id, otherId].sort((a, b) => a.toString().localeCompare(b.toString()));
    let conversation = await Conversation.findOne({
      participants: { $all: participants, $size: 2 },
    })
      .populate('participants', 'name email avatar isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        select: 'content type imageUrl sender createdAt',
        populate: { path: 'sender', select: 'name' },
      });
    if (!conversation) {
      conversation = await Conversation.create({ participants });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email avatar isOnline lastSeen')
        .populate('lastMessage');
    }
    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email avatar isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        select: 'content type imageUrl sender createdAt seenBy',
        populate: { path: 'sender', select: 'name' },
      })
      .sort({ lastMessageAt: -1 })
      .lean();

    const withUnread = conversations.map((conv) => {
      const lastMsg = conv.lastMessage;
      const senderId = lastMsg?.sender?._id?.toString() ?? lastMsg?.sender?.toString();
      const unread =
        lastMsg &&
        senderId &&
        senderId !== req.user._id.toString() &&
        !lastMsg.seenBy?.some((id) => id.toString() === req.user._id.toString())
          ? 1
          : 0;
      return { ...conv, unreadCount: unread };
    });

    res.json(withUnread);
  } catch (error) {
    next(error);
  }
};
