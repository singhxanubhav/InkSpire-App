import { prisma } from '../../config/database';

export class IdeasService {
  static async getIdeas(matchId: string, userId: string, cursor?: string, filters?: any) {
    // Verify membership
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || (match.requesterId !== userId && match.receiveeId !== userId)) {
      throw new Error('Not authorized to access this match');
    }

    const take = 20;
    
    // Build where clause
    const whereClause: any = { matchId, deletedAt: null };
    if (filters?.type) whereClause.type = filters.type;
    if (filters?.isPinned !== undefined) whereClause.isPinned = filters.isPinned;
    if (filters?.search) {
      whereClause.OR = [
        { content: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search.toLowerCase() } }
      ];
    }

    const ideas = await prisma.idea.findMany({
      where: whereClause,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        author: { select: { id: true, displayName: true, avatar: true } },
        _count: { select: { replies: true } },
        replies: {
          take: 3, // preview latest 3 replies
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, displayName: true, avatar: true } }
          }
        }
      }
    });

    let nextCursor = null;
    if (ideas.length > take) {
      const nextItem = ideas.pop();
      nextCursor = nextItem!.id;
    }

    return { data: ideas, nextCursor };
  }

  static async createIdea(matchId: string, userId: string, data: any) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || (match.requesterId !== userId && match.receiveeId !== userId) || match.status !== 'ACCEPTED') {
      throw new Error('Invalid match for creating idea');
    }

    // Process tags
    let formattedTags: string[] = [];
    if (data.tags && Array.isArray(data.tags)) {
      formattedTags = [...new Set(data.tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean))] as string[];
    }

    return prisma.idea.create({
      data: {
        matchId,
        authorId: userId,
        type: data.type || 'OTHER',
        content: data.content,
        tags: formattedTags,
        isPinned: data.isPinned || false,
      },
      include: {
        author: { select: { id: true, displayName: true, avatar: true } },
        _count: { select: { replies: true } },
        replies: true,
      }
    });
  }

  static async updateIdea(ideaId: string, userId: string, data: any) {
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea || idea.authorId !== userId) {
      throw new Error('Not authorized to update this idea');
    }

    let formattedTags = idea.tags;
    if (data.tags && Array.isArray(data.tags)) {
      formattedTags = [...new Set(data.tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean))] as string[];
    }

    return prisma.idea.update({
      where: { id: ideaId },
      data: {
        content: data.content ?? idea.content,
        type: data.type ?? idea.type,
        tags: formattedTags,
        isPinned: data.isPinned ?? idea.isPinned,
      },
      include: {
        author: { select: { id: true, displayName: true, avatar: true } },
        _count: { select: { replies: true } },
        replies: true,
      }
    });
  }

  static async deleteIdea(ideaId: string, userId: string) {
    const idea = await prisma.idea.findUnique({ where: { id: ideaId }, include: { match: true } });
    if (!idea) throw new Error('Idea not found');
    if (idea.authorId !== userId && idea.match.requesterId !== userId && idea.match.receiveeId !== userId) {
      throw new Error('Not authorized to delete this idea');
    }

    return prisma.idea.delete({
      where: { id: ideaId }
    });
  }

  static async togglePin(ideaId: string, userId: string) {
    const idea = await prisma.idea.findUnique({ where: { id: ideaId }, include: { match: true } });
    if (!idea) throw new Error('Idea not found');
    if (idea.match.requesterId !== userId && idea.match.receiveeId !== userId) {
      throw new Error('Not authorized');
    }

    return prisma.idea.update({
      where: { id: ideaId },
      data: { isPinned: !idea.isPinned },
      include: {
        author: { select: { id: true, displayName: true, avatar: true } },
        _count: { select: { replies: true } },
      }
    });
  }

  static async addReply(ideaId: string, userId: string, content: string) {
    const idea = await prisma.idea.findUnique({ where: { id: ideaId }, include: { match: true } });
    if (!idea) throw new Error('Idea not found');
    if (idea.match.requesterId !== userId && idea.match.receiveeId !== userId) {
      throw new Error('Not authorized');
    }

    return prisma.ideaReply.create({
      data: {
        ideaId,
        authorId: userId,
        content
      },
      include: {
        author: { select: { id: true, displayName: true, avatar: true } }
      }
    });
  }

  static async deleteReply(replyId: string, userId: string) {
    const reply = await prisma.ideaReply.findUnique({ where: { id: replyId } });
    if (!reply || reply.authorId !== userId) {
      throw new Error('Not authorized to delete this reply');
    }

    return prisma.ideaReply.delete({ where: { id: replyId } });
  }

  static async getReplies(ideaId: string, userId: string) {
    const idea = await prisma.idea.findUnique({ where: { id: ideaId }, include: { match: true } });
    if (!idea) throw new Error('Idea not found');
    if (idea.match.requesterId !== userId && idea.match.receiveeId !== userId) {
      throw new Error('Not authorized');
    }

    return prisma.ideaReply.findMany({
      where: { ideaId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, displayName: true, avatar: true } }
      }
    });
  }
}
