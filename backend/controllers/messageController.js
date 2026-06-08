import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { emitNewMessage, emitMessageSeen } from '../socket/index.js';

const findUserConversation = async (conversationId, userId) => {
  return Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });
};

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before; // cursor for pagination

    const conversation = await findUserConversation(conversationId, req.user._id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const filter = { conversation: conversationId };
    if (before) filter.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(filter)
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(messages.reverse());
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const {
      content,
      type = 'text',
      imageUrl,
      fileUrl,
      fileName,
      fileMimeType,
      fileSize,
    } = req.body;

    const conversation = await findUserConversation(conversationId, req.user._id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const messageType = fileUrl ? type : 'text';
    if (!content?.trim() && !imageUrl && !fileUrl) {
      return res.status(400).json({ message: 'Message content or file is required.' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: content || '',
      type: messageType,
      imageUrl: imageUrl || '',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileMimeType: fileMimeType || '',
      fileSize: fileSize || 0,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: message.createdAt,
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name')
      .lean();

    const populatedConversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        select: 'content type imageUrl fileUrl fileName fileMimeType fileSize sender createdAt seenBy',
        populate: { path: 'sender', select: 'name' },
      })
      .lean();

    const io = req.app.get('io');
    if (io) emitNewMessage(io, populatedConversation, populated);

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

export const markSeen = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await findUserConversation(conversationId, req.user._id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user._id } },
      { $addToSet: { seenBy: req.user._id } }
    );
    const io = req.app.get('io');
    if (io) emitMessageSeen(io, conversationId, { userId: req.user._id.toString() });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
