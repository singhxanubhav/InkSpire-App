import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import {
  RegisterSchema,
  LoginSchema,
} from './auth.schema';

const router = Router();

router.post('/register', validate(RegisterSchema), AuthController.register);
router.post('/login', validate(LoginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh-token', AuthController.refreshTokens);

export default router;
