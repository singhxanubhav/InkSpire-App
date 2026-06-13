import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';

export class UserController {
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      
      const updatedUser = await UserService.updateProfile(req.user.id, req.body);
      res.status(200).json({ success: true, data: { user: updatedUser } });
    } catch (error) {
      next(error);
    }
  }
}
