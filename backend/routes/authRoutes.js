import express from 'express';
import { signup, login, getMe, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use((req, res, next) => {
  console.log('[Auth Route]', req.method, req.path);
  next();
});
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);

export default router;
