import { Router } from 'express';
import { UserController } from './user.controller';
import { verifyToken } from '../../middleware/auth';
import { upload } from '../../middleware/upload';

const router = Router();

router.use(verifyToken);

router.get('/me', UserController.getMe);
router.patch('/me', UserController.updateProfile);
router.get('/discover', UserController.getDiscoverFeed);
router.post('/avatar', upload.single('avatar'), UserController.uploadAvatar);
router.patch('/me/push-token', UserController.updatePushToken);
router.get('/:id', UserController.getUserProfile);

export default router;
