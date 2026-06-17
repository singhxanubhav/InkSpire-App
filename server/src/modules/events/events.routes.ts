import { Router } from 'express';
import { EventsController } from './events.controller';
import { verifyToken } from '../../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(verifyToken);

router.get('/', EventsController.getEvents);
router.post('/create', EventsController.createEvent); // For admin/testing
router.get('/:id', EventsController.getEvent);
router.post('/:id/join', EventsController.joinEvent);
router.post('/:id/leave', EventsController.leaveEvent);
router.post('/:id/words', EventsController.updateWordCount);

export default router;
