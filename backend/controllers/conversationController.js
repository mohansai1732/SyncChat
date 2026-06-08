import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

export const getOrCreateConversation =
  async (req, res, next) => {

    try {

      const { participantId } =
        req.body;

      console.log(
        'BODY:',
        req.body
      );

      console.log(
        'participantId:',
        participantId
      );

      console.log(
        'req.user:',
        req.user?._id?.toString()
      );

      // Validate ID exists
      if (!participantId) {

        console.log(
          'ERROR: participantId missing'
        );

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

        console.log(
          'ERROR: self conversation attempt'
        );

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

        console.log(
          'ERROR: invalid ObjectId'
        );

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

        console.log(
          'ERROR: user not found'
        );

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
            'name email isOnline lastSeen'
          )
          .populate({
            path: 'lastMessage',

            select:
              'content type imageUrl fileUrl fileName fileMimeType fileSize sender createdAt seenBy',

            populate: {
              path: 'sender',
              select: 'name',
            },
          });

      // Create if not exists
      if (!conversation) {

        console.log(
          'Creating new conversation...'
        );

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
              'name email isOnline lastSeen'
            )
            .populate(
              'lastMessage'
            );
      } else {

        console.log(
          'Existing conversation found'
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
      .populate('participants', 'name email isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        select: 'content type imageUrl fileUrl fileName fileMimeType fileSize sender createdAt seenBy',
        populate: { path: 'sender', select: 'name' },
      })
      .sort({ lastMessageAt: -1 })
      .lean();

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversations.map((conv) => conv._id) },
          sender: { $ne: req.user._id },
          seenBy: { $ne: req.user._id },
        },
      },
      { $group: { _id: '$conversation', count: { $sum: 1 } } },
    ]);

    const unreadByConversation = new Map(
      unreadCounts.map((item) => [item._id.toString(), item.count])
    );

    const withUnread = conversations.map((conv) => {
      return { ...conv, unreadCount: unreadByConversation.get(conv._id.toString()) || 0 };
    });

    res.json(withUnread);
  } catch (error) {
    next(error);
  }
};
