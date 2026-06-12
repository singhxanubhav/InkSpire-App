import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json({ success: true, data: { user } });
    } catch (error) {
      if (error instanceof Error && (error.message.includes('already in use') || error.message.includes('already taken'))) {
        res.status(409).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error instanceof Error && error.message.includes('verify your email')) {
        res.status(403).json({ success: false, message: error.message });
      } else if (error instanceof Error && error.message.includes('Invalid')) {
        res.status(401).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      next(error);
    }
  }

  static async refreshTokens(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshTokens(refreshToken);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid')) {
        res.status(401).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await AuthService.forgotPassword(email);
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.query;
      if (!email || typeof email !== 'string') {
        res.status(400).json({ success: false, message: 'Email is required' });
        return;
      }
      await AuthService.resetPassword(req.body, email);
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid')) {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, token } = req.body;
      if (!email || !token) {
        res.status(400).json({ success: false, message: 'Email and token are required' });
        return;
      }
      await AuthService.verifyEmail(email, token);
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid')) {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  }
}
