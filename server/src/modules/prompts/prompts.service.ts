import { prisma } from '../../config/database';

export class PromptsService {
  static async getDailyPrompt() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Try to find today's published daily prompt
    let prompt = await prisma.prompt.findFirst({
      where: {
        type: 'DAILY',
        isPublished: true,
        publishedAt: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        _count: { select: { submissions: true } }
      }
    });

    // Fallback: If no prompt is scheduled for today, pick a random generic one
    if (!prompt) {
      prompt = await prisma.prompt.findFirst({
        where: { type: 'DAILY' },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { submissions: true } }
        }
      });
    }

    return prompt;
  }

  static async getCommunityPrompts(userId: string, cursor?: string) {
    const take = 10;
    const prompts = await prisma.prompt.findMany({
      where: { type: 'COMMUNITY', isPublished: false }, // Only unpublished show in browsing? Actually, let's show all COMMUNITY prompts or maybe sort by upvotes
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: {
        upvotes: { _count: 'desc' }
      },
      include: {
        author: { select: { id: true, displayName: true, avatar: true } },
        _count: { select: { upvotes: true, submissions: true } },
        upvotes: {
          where: { userId },
          select: { userId: true }
        }
      }
    });

    let nextCursor = null;
    if (prompts.length > take) {
      const nextItem = prompts.pop();
      nextCursor = nextItem!.id;
    }

    // Format response to include hasUpvoted boolean
    const formattedPrompts = prompts.map((p: any) => ({
      ...p,
      hasUpvoted: p.upvotes.length > 0,
      upvotes: undefined // remove the raw array
    }));

    return { data: formattedPrompts, nextCursor };
  }

  static async submitPrompt(userId: string, data: any) {
    // Rate limit check: max 3 per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const submissionsToday = await prisma.prompt.count({
      where: {
        authorId: userId,
        createdAt: { gte: today }
      }
    });

    if (submissionsToday >= 3) {
      throw new Error('You have reached the limit of 3 prompt suggestions per day.');
    }

    return prisma.prompt.create({
      data: {
        content: data.content,
        genre: data.genre,
        theme: data.theme,
        authorId: userId,
        type: 'COMMUNITY',
        isPublished: false
      }
    });
  }

  static async upvotePrompt(promptId: string, userId: string) {
    const existingUpvote = await prisma.promptUpvote.findUnique({
      where: {
        promptId_userId: { promptId, userId }
      }
    });

    if (existingUpvote) {
      // Remove upvote
      await prisma.promptUpvote.delete({
        where: { promptId_userId: { promptId, userId } }
      });
    } else {
      // Add upvote
      await prisma.promptUpvote.create({
        data: { promptId, userId }
      });
    }

    // Check if it hit 10 upvotes to auto-publish
    const count = await prisma.promptUpvote.count({ where: { promptId } });
    
    if (count >= 10) {
      await prisma.prompt.update({
        where: { id: promptId },
        data: { isPublished: true, publishedAt: new Date() }
      });
    }

    return { upvoted: !existingUpvote, newCount: count };
  }

  static async getPromptSubmissions(promptId: string, cursor?: string) {
    const take = 10;
    const submissions = await prisma.promptSubmission.findMany({
      where: { promptId },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, displayName: true, avatar: true } },
        _count: { select: { comments: true } }
      }
    });

    let nextCursor = null;
    if (submissions.length > take) {
      const nextItem = submissions.pop();
      nextCursor = nextItem!.id;
    }

    return { data: submissions, nextCursor };
  }

  static async submitResponse(promptId: string, userId: string, content: string) {
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    return prisma.promptSubmission.create({
      data: {
        promptId,
        authorId: userId,
        content,
        wordCount
      }
    });
  }

  static async getMyResponses(userId: string, cursor?: string) {
    const take = 10;
    const submissions = await prisma.promptSubmission.findMany({
      where: { authorId: userId },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        prompt: { select: { content: true, genre: true } },
        _count: { select: { comments: true } }
      }
    });

    let nextCursor = null;
    if (submissions.length > take) {
      const nextItem = submissions.pop();
      nextCursor = nextItem!.id;
    }

    return { data: submissions, nextCursor };
  }

  static async addComment(submissionId: string, userId: string, content: string) {
    return prisma.submissionComment.create({
      data: {
        submissionId,
        authorId: userId,
        content
      },
      include: {
        author: { select: { id: true, displayName: true, avatar: true } }
      }
    });
  }

  static async getComments(submissionId: string) {
    return prisma.submissionComment.findMany({
      where: { submissionId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, displayName: true, avatar: true } }
      }
    });
  }

  static async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.submissionComment.findUnique({ where: { id: commentId } });
    if (!comment || comment.authorId !== userId) {
      throw new Error('Not authorized to delete this comment');
    }
    return prisma.submissionComment.delete({ where: { id: commentId } });
  }
}
