import { prisma } from '../../config/database';
import { UpdateProfileInput } from './user.schema';

export class UserService {
  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    
    // Omit sensitive data before returning
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            matchesInitiated: { where: { status: 'ACCEPTED' } },
            matchesReceived: { where: { status: 'ACCEPTED' } },
            notifications: { where: { isRead: false } }
          }
        }
      }
    });
    
    if (!user) throw new Error("User not found");
    
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    // Calculate total matches count
    const totalMatches = user._count.matchesInitiated + user._count.matchesReceived;
    
    return { ...userWithoutPassword, totalMatches, unreadNotifications: user._count.notifications };
  }

  static async getDiscoverFeed(currentUserId: string, cursor?: string, limit = 20) {
    // 1. Get current user's genres
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { genres: true }
    });
    
    if (!currentUser) throw new Error("User not found");

    // 2. Get users we already have matches/requests with
    const existingMatches = await prisma.match.findMany({
      where: {
        OR: [
          { requesterId: currentUserId },
          { receiveeId: currentUserId }
        ],
        status: {
          in: ['PENDING', 'ACCEPTED', 'DECLINED']
        }
      }
    });

    const excludedIds = new Set([currentUserId]);
    for (const m of existingMatches) {
      if (m.requesterId !== currentUserId) excludedIds.add(m.requesterId);
      if (m.receiveeId !== currentUserId) excludedIds.add(m.receiveeId);
    }

    // 3. Fetch potential matches (filtering out excluded)
    // We cannot sort by genre overlap directly in Prisma, so we fetch and sort in memory if needed
    // In a real app, this would be a raw SQL query or elasticsearch for scalability
    
    const queryArgs: any = {
      take: limit,
      where: {
        id: { notIn: Array.from(excludedIds) },
        isActive: true
      },
      select: {
        id: true,
        displayName: true,
        avatar: true,
        bio: true,
        genres: true,
        experienceLevel: true,
        availability: true,
        writingGoals: true
      }
    };
    
    if (cursor) {
      queryArgs.cursor = { id: cursor };
      queryArgs.skip = 1; // skip the cursor
    }

    const potentialMatches = await prisma.user.findMany(queryArgs);

    // Calculate score: +1 for each shared genre
    const scoredMatches = potentialMatches.map((user: any) => {
      const sharedGenres = user.genres.filter((g: any) => currentUser.genres.includes(g)).length;
      return { ...user, matchScore: sharedGenres };
    });

    // Sort by match score descending
    scoredMatches.sort((a: any, b: any) => b.matchScore - a.matchScore);

    const nextCursor = scoredMatches.length === limit ? scoredMatches[limit - 1].id : undefined;

    return { data: scoredMatches, nextCursor };
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        displayName: true,
        avatar: true,
        bio: true,
        genres: true,
        experienceLevel: true,
        availability: true,
        writingGoals: true,
        dailyWordCount: true
      }
    });
    
    if (!user) throw new Error("User not found");
    return user;
  }
}
