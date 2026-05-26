import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

export const getOrCreateConversation =
  async (req, res, next) => {

    try {

      const { participantId } =
        req.body;

      // Validate ID exists
      if (!participantId) {
        return res.status(400).json({
          message:
            'Participant ID required.',
        });
      }

      // Prevent self chat
      if (
        participantId ===
        req.user._id.toString()
      ) {
        return res.status(400).json({
          message:
            'Cannot create chat with yourself.',
        });
      }

      // Validate Mongo ObjectId
      if (
        !mongoose.Types.ObjectId.isValid(
          participantId
        )
      ) {
        return res.status(400).json({
          message:
            'Invalid participant ID.',
        });
      }

      // Check user exists
      const otherUser =
        await User.findById(
          participantId
        );

      if (!otherUser) {
        return res.status(404).json({
          message:
            'User not found.',
        });
      }

      const participants = [
        req.user._id,
        otherUser._id,
      ].sort((a, b) =>
        a
          .toString()
          .localeCompare(
            b.toString()
          )
      );

      // Find existing conversation
      let conversation =
        await Conversation.findOne({
          participants: {
            $all: participants,
            $size: 2,
          },
        })
          .populate(
            'participants',
            'name email avatar isOnline lastSeen'
          )
          .populate({
            path: 'lastMessage',

            select:
              'content type imageUrl sender createdAt',

            populate: {
              path: 'sender',
              select: 'name',
            },
          });

      // Create if not exists
      if (!conversation) {

        conversation =
          await Conversation.create({
            participants,
          });

        conversation =
          await Conversation.findById(
            conversation._id
          )
            .populate(
              'participants',
              'name email avatar isOnline lastSeen'
            )
            .populate(
              'lastMessage'
            );
      }

      res.json(conversation);

    } catch (error) {

      console.log(
        'Conversation creation error:',
        error
      );

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
