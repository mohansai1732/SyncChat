import express from 'express';
import {
  getMessages,
  sendMessage,
  markSeen,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/:conversationId', getMessages);
router.post('/:conversationId', sendMessage);
router.post('/:conversationId/seen', markSeen);

export default router;
