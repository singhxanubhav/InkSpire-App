import { Request, Response } from 'express';
import { EventsService } from './events.service';

export class EventsController {
  static async getEvents(req: Request, res: Response) {
    try {
      const events = await EventsService.getEvents(req.user!.id);
      res.json({ success: true, data: events });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getEvent(req: Request, res: Response) {
    try {
      const event = await EventsService.getEvent(req.params.id, req.user!.id);
      res.json({ success: true, data: event });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async joinEvent(req: Request, res: Response) {
    try {
      const participant = await EventsService.joinEvent(req.params.id, req.user!.id);
      res.json({ success: true, data: participant });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async leaveEvent(req: Request, res: Response) {
    try {
      await EventsService.leaveEvent(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Left event successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateWordCount(req: Request, res: Response) {
    try {
      const { wordCount } = req.body;
      const participant = await EventsService.updateWordCount(req.params.id, req.user!.id, wordCount);
      res.json({ success: true, data: participant });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async createEvent(req: Request, res: Response) {
    try {
      const event = await EventsService.createEvent(req.body);
      res.status(201).json({ success: true, data: event });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
