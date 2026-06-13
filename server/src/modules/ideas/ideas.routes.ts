import { Router } from 'express';
import { IdeasController } from './ideas.controller';
import { verifyToken } from '../../middleware/auth';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(verifyToken);

// /api/matches/:matchId/ideas
router.get('/', IdeasController.getIdeas);
router.post('/', IdeasController.createIdea);
router.patch('/:ideaId', IdeasController.updateIdea);
router.delete('/:ideaId', IdeasController.deleteIdea);

router.patch('/:ideaId/pin', IdeasController.togglePin);

router.post('/:ideaId/replies', IdeasController.addReply);
router.delete('/:ideaId/replies/:replyId', IdeasController.deleteReply);

export const ideasRouter = router;
