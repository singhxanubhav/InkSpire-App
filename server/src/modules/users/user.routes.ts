import { Router } from 'express';
import { UserController } from './user.controller';
import { validate } from '../../middleware/validate';
import { UpdateProfileSchema } from './user.schema';
import { verifyToken } from '../../middleware/auth';

const router = Router();

// All user routes should be protected
router.use(verifyToken);

router.patch('/me', validate(UpdateProfileSchema), UserController.updateProfile);

export default router;
