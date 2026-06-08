import express from 'express';
import { uploadFile } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);
router.post('/file', upload.single('file'), uploadFile);

export default router;
