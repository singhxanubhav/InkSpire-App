import { Request, Response, NextFunction } from 'express';
import { IdeasService } from './ideas.service';
import { getIo } from '../../config/socket';

export class IdeasController {
  static async getIdeas(req: Request, res: Response, next: NextFunction) {
    try {
      const { matchId } = req.params;
      const userId = req.user!.id;
      const { cursor, type, isPinned, search } = req.query;

      const filters = {
        type: type as string,
        isPinned: isPinned !== undefined ? isPinned === 'true' : undefined,
        search: search as string,
      };

      const result = await IdeasService.getIdeas(matchId, userId, cursor as string, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async createIdea(req: Request, res: Response, next: NextFunction) {
    try {
      const { matchId } = req.params;
      const userId = req.user!.id;
      const idea = await IdeasService.createIdea(matchId, userId, req.body);
      
      const io = getIo();
      io.of('/match').to(`match:${matchId}`).emit('idea:created', idea);

      res.status(201).json(idea);
    } catch (error) {
      next(error);
    }
  }

  static async updateIdea(req: Request, res: Response, next: NextFunction) {
    try {
      const { matchId, ideaId } = req.params;
      const userId = req.user!.id;
      const idea = await IdeasService.updateIdea(ideaId, userId, req.body);
      
      const io = getIo();
      io.of('/match').to(`match:${matchId}`).emit('idea:updated', idea);

      res.json(idea);
    } catch (error) {
      next(error);
    }
  }

  static async deleteIdea(req: Request, res: Response, next: NextFunction) {
    try {
      const { matchId, ideaId } = req.params;
      const userId = req.user!.id;
      await IdeasService.deleteIdea(ideaId, userId);
      
      const io = getIo();
      io.of('/match').to(`match:${matchId}`).emit('idea:deleted', ideaId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async togglePin(req: Request, res: Response, next: NextFunction) {
    try {
      const { matchId, ideaId } = req.params;
      const userId = req.user!.id;
      const idea = await IdeasService.togglePin(ideaId, userId);
      
      const io = getIo();
      io.of('/match').to(`match:${matchId}`).emit('idea:pinned', { ideaId, isPinned: idea.isPinned });

      res.json(idea);
    } catch (error) {
      next(error);
    }
  }

  static async addReply(req: Request, res: Response, next: NextFunction) {
    try {
      const { matchId, ideaId } = req.params;
      const userId = req.user!.id;
      const { content } = req.body;
      
      const reply = await IdeasService.addReply(ideaId, userId, content);
      
      const io = getIo();
      io.of('/match').to(`match:${matchId}`).emit('reply:created', { ideaId, reply });

      res.status(201).json(reply);
    } catch (error) {
      next(error);
    }
  }

  static async deleteReply(req: Request, res: Response, next: NextFunction) {
    try {
      const { matchId, ideaId, replyId } = req.params;
      const userId = req.user!.id;
      
      await IdeasService.deleteReply(replyId, userId);
      
      const io = getIo();
      io.of('/match').to(`match:${matchId}`).emit('reply:deleted', { ideaId, replyId });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
