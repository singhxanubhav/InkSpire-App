import { prisma } from '../../config/database';
import { Prisma, RequestStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

export class FeedbackService {
  static async createRequest(userId: string, data: any) {

    return prisma.feedbackRequest.create({
      data: {
        authorId: userId,
        title: data.title,
        excerpt: data.excerpt,
        genre: data.genre,
        focusAreas: data.focusAreas,
        context: data.context || null,
        status: 'OPEN',
      }
    });
  }

  static async getOpenRequests(userId: string, filters: any, cursor?: string) {
    const take = 10;
    const where: Prisma.FeedbackRequestWhereInput = {
      status: 'OPEN',
      authorId: { not: userId },
    };

    if (filters.genre) {
      where.genre = filters.genre;
    }
    if (filters.focusAreas && filters.focusAreas.length > 0) {
      where.focusAreas = { hasSome: filters.focusAreas };
    }

    let orderBy: Prisma.FeedbackRequestOrderByWithRelationInput = { createdAt: 'desc' };
    if (filters.sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (filters.sortBy === 'most_responses') {
      orderBy = { responses: { _count: 'desc' } };
    }

    const requests = await prisma.feedbackRequest.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy,
      include: {
        author: { select: { id: true, displayName: true, avatar: true } },
        _count: { select: { responses: true } },
        responses: {
          where: { reviewerId: userId },
          select: { id: true }
        }
      }
    });

    let nextCursor = null;
    if (requests.length > take) {
      const nextItem = requests.pop();
      nextCursor = nextItem!.id;
    }

    const formattedRequests = requests.map((r: any) => ({
      ...r,
      hasResponded: r.responses.length > 0,
      responses: undefined
    }));

    return { data: formattedRequests, nextCursor };
  }

  static async getMyRequests(userId: string, cursor?: string) {
    const take = 10;
    const requests = await prisma.feedbackRequest.findMany({
      where: { authorId: userId },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { responses: true } }
      }
    });

    let nextCursor = null;
    if (requests.length > take) {
      const nextItem = requests.pop();
      nextCursor = nextItem!.id;
    }

    return { data: requests, nextCursor };
  }

  static async getRequest(requestId: string, userId: string) {
    const request = await prisma.feedbackRequest.findUnique({
      where: { id: requestId },
      include: {
        author: { select: { id: true, displayName: true, avatar: true } },
        responses: {
          include: {
            reviewer: { select: { id: true, displayName: true, avatar: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!request) {
      throw new Error('Request not found');
    }

    const isOwner = request.authorId === userId;
    
    // If not owner, filter out other responses to protect privacy?
    // Wait, the requirement: "Full request detail + all responses (if owner) or own response only (if reviewer)."
    if (!isOwner) {
      request.responses = request.responses.filter((r: any) => r.reviewerId === userId);
    }

    return request;
  }

  static async submitFeedback(requestId: string, reviewerId: string, data: any) {
    const request = await prisma.feedbackRequest.findUnique({
      where: { id: requestId },
      include: { _count: { select: { responses: true } } }
    });

    if (!request) {
      throw new Error('Feedback request not found');
    }

    if (request.authorId === reviewerId) {
      throw new Error('Cannot review your own request');
    }

    // Removed word count limits

    const existingResponse = await prisma.feedbackResponse.findUnique({
      where: {
        requestId_reviewerId: { requestId, reviewerId }
      }
    });

    if (existingResponse) {
      throw new Error('You have already submitted feedback for this request.');
    }

    const response = await prisma.feedbackResponse.create({
      data: {
        requestId,
        reviewerId,
        overallImpression: data.overallImpression,
        clarityScore: data.clarityScore,
        pacingScore: data.pacingScore,
        dialogueScore: data.dialogueScore,
        structureScore: data.structureScore,
        detailedNotes: data.detailedNotes
      }
    });

    const newResponseCount = request._count.responses + 1;
    
    if (newResponseCount >= 3 && request.status === 'OPEN') {
      await prisma.feedbackRequest.update({
        where: { id: requestId },
        data: { status: 'IN_REVIEW' }
      });
    }

    await NotificationsService.createAndSend(
      request.authorId,
      'FEEDBACK_RECEIVED',
      'New Feedback Received!',
      'Someone has left constructive feedback on your writing.',
      { screen: 'feedback', requestId },
      requestId
    );

    return response;
  }

  static async getMyFeedbackGiven(userId: string, cursor?: string) {
    const take = 10;
    const responses = await prisma.feedbackResponse.findMany({
      where: { reviewerId: userId },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        request: {
          select: { title: true, author: { select: { displayName: true } } }
        }
      }
    });

    let nextCursor = null;
    if (responses.length > take) {
      const nextItem = responses.pop();
      nextCursor = nextItem!.id;
    }

    return { data: responses, nextCursor };
  }

  static async closeRequest(requestId: string, userId: string) {
    const request = await prisma.feedbackRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request not found');
    }

    if (request.authorId !== userId) {
      throw new Error('Not authorized to close this request');
    }

    return prisma.feedbackRequest.update({
      where: { id: requestId },
      data: { status: 'CLOSED' }
    });
  }
}
