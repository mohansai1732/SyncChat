import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { emitNewMessage, emitMessageSeen } from '../socket/index.js';

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before; // cursor for pagination

    const filter = { conversation: conversationId };
    if (before) filter.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(filter)
      .populate('sender', 'name avatar')
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
    const { content, type = 'text', imageUrl } = req.body;

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: content || '',
      type: type || (imageUrl ? 'image' : 'text'),
      imageUrl: imageUrl || '',
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: message.createdAt,
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .lean();

    const io = req.app.get('io');
    if (io) emitNewMessage(io, conversationId, populated);

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

export const markSeen = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
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
