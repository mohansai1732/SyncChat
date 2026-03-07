import express from 'express';
import { searchUsers, getUserById } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/search', searchUsers);
router.get('/:id', getUserById);

export default router;
