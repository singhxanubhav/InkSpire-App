import { Request, Response } from 'express';
import { PromptsService } from './prompts.service';

export class PromptsController {
  static async getDailyPrompt(req: Request, res: Response) {
    try {
      const prompt = await PromptsService.getDailyPrompt();
      res.json({ success: true, data: prompt });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getCommunityPrompts(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const cursor = req.query.cursor as string;
      const result = await PromptsService.getCommunityPrompts(userId, cursor);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async submitPrompt(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const prompt = await PromptsService.submitPrompt(userId, req.body);
      res.status(201).json({ success: true, data: prompt });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async upvotePrompt(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const result = await PromptsService.upvotePrompt(id, userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getPromptSubmissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cursor = req.query.cursor as string;
      const result = await PromptsService.getPromptSubmissions(id, cursor);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async submitResponse(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { content } = req.body;
      const submission = await PromptsService.submitResponse(id, userId, content);
      res.status(201).json({ success: true, data: submission });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMyResponses(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const cursor = req.query.cursor as string;
      const result = await PromptsService.getMyResponses(userId, cursor);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async addComment(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { submissionId } = req.params;
      const { content } = req.body;
      const comment = await PromptsService.addComment(submissionId, userId, content);
      res.status(201).json({ success: true, data: comment });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getComments(req: Request, res: Response) {
    try {
      const { submissionId } = req.params;
      const comments = await PromptsService.getComments(submissionId);
      res.json({ success: true, data: comments });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteComment(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { commentId } = req.params;
      await PromptsService.deleteComment(commentId, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
