import { Request, Response } from 'express';
import { ProgressService } from './progress.service';

export class ProgressController {
  static async logProgress(req: Request, res: Response) {
    try {
      const log = await ProgressService.logProgress(req.user!.id, req.body);
      res.json({ success: true, data: log });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMyProgress(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const logs = await ProgressService.getMyProgress(req.user!.id, days);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const stats = await ProgressService.getStats(req.user!.id);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getLeaderboard(req: Request, res: Response) {
    try {
      const period = (req.query.period as 'week' | 'month') || 'week';
      const leaderboard = await ProgressService.getLeaderboard(req.user!.id, period);
      res.json({ success: true, data: leaderboard });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async exportProgress(req: Request, res: Response) {
    try {
      const csv = await ProgressService.exportProgress(req.user!.id);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="inkspire_progress.csv"');
      res.send(csv);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
