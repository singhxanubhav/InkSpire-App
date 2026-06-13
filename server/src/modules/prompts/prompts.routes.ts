import { Router } from 'express';
import { PromptsController } from './prompts.controller';
import { verifyToken } from '../../middleware/auth';

const router = Router();

router.use(verifyToken);

router.get('/daily', PromptsController.getDailyPrompt);
router.get('/community', PromptsController.getCommunityPrompts);
router.post('/community', PromptsController.submitPrompt);
router.post('/:id/upvote', PromptsController.upvotePrompt);

router.get('/:id/submissions', PromptsController.getPromptSubmissions);
router.post('/:id/submissions', PromptsController.submitResponse);
router.get('/my-submissions', PromptsController.getMyResponses);

router.get('/submissions/:submissionId/comments', PromptsController.getComments);
router.post('/submissions/:submissionId/comments', PromptsController.addComment);
router.delete('/comments/:commentId', PromptsController.deleteComment);

export default router;
