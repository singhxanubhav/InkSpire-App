import { prisma } from '../../config/database';
import { EventType } from '@prisma/client';

export class EventsService {
  static async getEvents(userId: string) {
    const now = new Date();
    // Fetch live, upcoming, and recent (ended within 24h)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const events = await prisma.event.findMany({
      where: {
        endTime: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      include: {
        _count: {
          select: { participants: true },
        },
        participants: {
          where: { userId },
          select: { id: true, wordCount: true },
        },
      },
    });

    return events.map(event => {
      const isLive = now >= event.startTime && now <= event.endTime;
      const isPast = now > event.endTime;
      const hasJoined = event.participants.length > 0;

      return {
        ...event,
        isLive,
        isPast,
        participantCount: event._count.participants,
        hasJoined,
        userWordCount: hasJoined ? event.participants[0].wordCount : 0,
      };
    });
  }

  static async getEvent(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          orderBy: { wordCount: 'desc' },
          take: 10,
          include: {
            user: {
              select: { id: true, displayName: true, avatar: true },
            },
          },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!event) throw new Error('Event not found');

    const hasJoined = await prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    return {
      ...event,
      hasJoined: !!hasJoined,
      participantCount: event._count.participants,
      leaderboard: event.participants.map((p, index) => ({
        rank: index + 1,
        userId: p.user.id,
        displayName: p.user.displayName,
        avatar: p.user.avatar,
        wordCount: p.wordCount,
      })),
    };
  }

  static async joinEvent(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const now = new Date();
    if (now > event.endTime) throw new Error('Cannot join ended event');

    if (event.maxParticipants) {
      const count = await prisma.eventParticipant.count({ where: { eventId } });
      if (count >= event.maxParticipants) throw new Error('Event is full');
    }

    const participant = await prisma.eventParticipant.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: {},
      create: { eventId, userId },
    });

    return participant;
  }

  static async updateWordCount(eventId: string, userId: string, wordCount: number) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const now = new Date();
    if (now < event.startTime || now > event.endTime) {
      throw new Error('Event is not currently active');
    }

    const participant = await prisma.eventParticipant.update({
      where: { eventId_userId: { eventId, userId } },
      data: { wordCount },
    });

    return participant;
  }

  static async leaveEvent(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const now = new Date();
    if (now >= event.startTime) {
      throw new Error('Cannot leave an event that has already started');
    }

    await prisma.eventParticipant.delete({
      where: { eventId_userId: { eventId, userId } },
    });

    return true;
  }

  static async createEvent(data: any) {
    return await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        targetWords: data.targetWords,
        maxParticipants: data.maxParticipants,
      },
    });
  }
}
