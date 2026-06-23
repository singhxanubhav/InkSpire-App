import { Request, Response } from 'express';
import { FeedbackService } from './feedback.service';

export class FeedbackController {
  static async createRequest(req: Request, res: Response) {
    try {
      const request = await FeedbackService.createRequest(req.user!.id, req.body);
      res.status(201).json({ status: 'success', data: request });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async getOpenRequests(req: Request, res: Response) {
    try {
      const { cursor, genre, focusAreas, sortBy } = req.query;
      const filters = {
        genre: genre as string,
        focusAreas: focusAreas ? (focusAreas as string).split(',') : [],
        sortBy: sortBy as string
      };
      const result = await FeedbackService.getOpenRequests(req.user!.id, filters, cursor as string);
      res.json({ status: 'success', data: result.data, nextCursor: result.nextCursor });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async getMyRequests(req: Request, res: Response) {
    try {
      const { cursor } = req.query;
      const result = await FeedbackService.getMyRequests(req.user!.id, cursor as string);
      res.json({ status: 'success', data: result.data, nextCursor: result.nextCursor });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async getRequest(req: Request, res: Response) {
    try {
      const request = await FeedbackService.getRequest(req.params.id, req.user!.id);
      res.json({ status: 'success', data: request });
    } catch (error: any) {
      res.status(404).json({ status: 'error', message: error.message });
    }
  }

  static async submitFeedback(req: Request, res: Response) {
    try {
      const response = await FeedbackService.submitFeedback(req.params.id, req.user!.id, req.body);
      res.status(201).json({ status: 'success', data: response });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async getMyFeedbackGiven(req: Request, res: Response) {
    try {
      const { cursor } = req.query;
      const result = await FeedbackService.getMyFeedbackGiven(req.user!.id, cursor as string);
      res.json({ status: 'success', data: result.data, nextCursor: result.nextCursor });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async closeRequest(req: Request, res: Response) {
    try {
      const request = await FeedbackService.closeRequest(req.params.id, req.user!.id);
      res.json({ status: 'success', data: request });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
}
