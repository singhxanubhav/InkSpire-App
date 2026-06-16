import { Router } from 'express';
import { ProgressController } from './progress.controller';
import { verifyToken } from '../../middleware/auth';

const router = Router();

router.use(verifyToken);

router.post('/', ProgressController.logProgress);
router.get('/history', ProgressController.getMyProgress);
router.get('/stats', ProgressController.getStats);
router.get('/leaderboard', ProgressController.getLeaderboard);
router.get('/export', ProgressController.exportProgress);

export default router;
