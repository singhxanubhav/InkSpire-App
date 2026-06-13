import { Request, Response } from 'express';
import { MatchesService } from './matches.service';
import { SendMatchRequestSchema } from './matches.schema';

export class MatchesController {
  static async sendMatchRequest(req: Request, res: Response) {
    try {
      const parsed = SendMatchRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error });
      }
      
      const requesterId = req.user!.id;
      const { receiveeId } = parsed.data;

      const match = await MatchesService.sendMatchRequest(requesterId, receiveeId);
      res.status(201).json(match);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getMyMatches(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const matches = await MatchesService.getMyMatches(userId);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getMatchRequests(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const requests = await MatchesService.getMatchRequests(userId);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async acceptRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const match = await MatchesService.acceptRequest(id as string, userId);
      res.json(match);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async declineRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const match = await MatchesService.declineRequest(id as string, userId);
      res.json(match);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async unmatch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const match = await MatchesService.unmatch(id as string, userId);
      res.json(match);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
