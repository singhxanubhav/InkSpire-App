import { prisma } from '../../config/database';

export class MatchesService {
  static async sendMatchRequest(requesterId: string, receiveeId: string) {
    if (requesterId === receiveeId) {
      throw new Error("Cannot match with yourself");
    }

    // Check if match already exists
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { requesterId, receiveeId },
          { requesterId: receiveeId, receiveeId: requesterId }
        ]
      }
    });

    if (existingMatch) {
      throw new Error("Match request already exists between these users");
    }

    const match = await prisma.match.create({
      data: {
        requesterId,
        receiveeId,
        status: 'ACCEPTED'
      }
    });

    await prisma.notification.create({
      data: {
        userId: receiveeId,
        type: 'MATCH_REQUEST',
        referenceId: match.id,
      }
    });

    return match;
  }

  static async getMyMatches(userId: string) {
    const matches = await prisma.match.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userId },
          { receiveeId: userId }
        ]
      },
      include: {
        requester: {
          select: { id: true, displayName: true, avatar: true, bio: true, genres: true, experienceLevel: true }
        },
        receivee: {
          select: { id: true, displayName: true, avatar: true, bio: true, genres: true, experienceLevel: true }
        }
      }
    });

    // Map to partner data
    return matches.map((match: any) => {
      const partner = match.requesterId === userId ? match.receivee : match.requester;
      return { matchId: match.id, partner };
    });
  }

  static async getMatchRequests(userId: string) {
    const incoming = await prisma.match.findMany({
      where: { receiveeId: userId, status: 'PENDING' },
      include: {
        requester: {
          select: { id: true, displayName: true, avatar: true, bio: true, genres: true, experienceLevel: true }
        }
      }
    });

    const outgoing = await prisma.match.findMany({
      where: { requesterId: userId, status: 'PENDING' },
      include: {
        receivee: {
          select: { id: true, displayName: true, avatar: true, bio: true, genres: true, experienceLevel: true }
        }
      }
    });

    return { incoming, outgoing };
  }

  static async acceptRequest(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.receiveeId !== userId || match.status !== 'PENDING') {
      throw new Error("Invalid request");
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { status: 'ACCEPTED' }
    });

    await prisma.notification.create({
      data: {
        userId: updated.requesterId,
        type: 'MATCH_ACCEPTED',
        referenceId: updated.id,
      }
    });

    return updated;
  }

  static async declineRequest(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.receiveeId !== userId || match.status !== 'PENDING') {
      throw new Error("Invalid request");
    }

    return prisma.match.update({
      where: { id: matchId },
      data: { status: 'DECLINED' }
    });
  }

  static async unmatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || (match.requesterId !== userId && match.receiveeId !== userId)) {
      throw new Error("Invalid request");
    }

    return prisma.match.update({
      where: { id: matchId },
      data: { status: 'UNMATCHED' }
    });
  }
}
