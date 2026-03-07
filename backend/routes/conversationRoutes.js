import express from 'express';
import {
  getOrCreateConversation,
  getConversations,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', getConversations);
router.post('/', getOrCreateConversation);

export default router;
