import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from './auth.schema';

const router = Router();

router.post('/register', validate(RegisterSchema), AuthController.register);
router.post('/login', validate(LoginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh-token', AuthController.refreshTokens);
router.post('/forgot-password', validate(ForgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(ResetPasswordSchema), AuthController.resetPassword);
router.post('/verify-email', AuthController.verifyEmail);

export default router;
