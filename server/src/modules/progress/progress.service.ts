import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export class ProgressService {
  static async logProgress(userId: string, data: { wordCount: number; projectName?: string; notes?: string; loggedAt?: string }) {
    // Normalize date to UTC midnight to avoid timezone issues
    let dateObj = new Date();
    if (data.loggedAt) {
      dateObj = new Date(data.loggedAt);
    }
    const date = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
    const projectName = data.projectName || 'Default';

    // Check if log exists for this user + date + project
    const existingLog = await prisma.writingLog.findUnique({
      where: {
        userId_date_projectName: {
          userId,
          date,
          projectName
        }
      }
    });

    if (existingLog) {
      return prisma.writingLog.update({
        where: { id: existingLog.id },
        data: {
          wordCount: data.wordCount, // Override word count. Alternatively, we could add. The prompt says "(override or add)" in UI, we'll let UI send the total.
          notes: data.notes ?? existingLog.notes
        }
      });
    }

    return prisma.writingLog.create({
      data: {
        userId,
        date,
        wordCount: data.wordCount,
        projectName,
        notes: data.notes
      }
    });
  }

  static async getMyProgress(userId: string, days: number) {
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days);
    const normalizedStart = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));

    const logs = await prisma.writingLog.findMany({
      where: {
        userId,
        date: { gte: normalizedStart }
      },
      orderBy: { date: 'asc' }
    });

    return logs;
  }

  static async getStats(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { dailyWordCount: true } });
    const dailyGoal = user?.dailyWordCount || 500;

    const allLogs = await prisma.writingLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    // Aggregate word counts by date (since user can have multiple projects per day)
    const logsByDate: Record<string, number> = {};
    let totalWordsAllTime = 0;
    
    for (const log of allLogs) {
      const dString = log.date.toISOString().split('T')[0];
      logsByDate[dString] = (logsByDate[dString] || 0) + log.wordCount;
      totalWordsAllTime += log.wordCount;
    }

    const uniqueDatesDesc = Object.keys(logsByDate).sort().reverse();
    
    // Calculate Streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    // We calculate streak by iterating from oldest to newest to find max
    const uniqueDatesAsc = [...uniqueDatesDesc].reverse();
    for (const dStr of uniqueDatesAsc) {
      const d = new Date(dStr);
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diffTime = Math.abs(d.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = d;
    }

    // Current streak (must include today or yesterday)
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const yesterdayUTC = new Date(todayUTC);
    yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);
    
    const todayStr = todayUTC.toISOString().split('T')[0];
    const yesterdayStr = yesterdayUTC.toISOString().split('T')[0];

    if (uniqueDatesDesc.length > 0) {
      const lastLoggedStr = uniqueDatesDesc[0];
      if (lastLoggedStr === todayStr || lastLoggedStr === yesterdayStr) {
        // Find how many consecutive days looking backwards
        currentStreak = 1;
        let checkDate = new Date(lastLoggedStr);
        for (let i = 1; i < uniqueDatesDesc.length; i++) {
          checkDate.setUTCDate(checkDate.getUTCDate() - 1);
          const expectedStr = checkDate.toISOString().split('T')[0];
          if (uniqueDatesDesc[i] === expectedStr) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Calculations for this week, this month, last 30 days avg
    let totalWordsThisMonth = 0;
    let totalWordsThisWeek = 0;
    let wordsLast30Days = 0;
    let goalsHitThisWeek = 0;

    const currentMonth = todayUTC.getUTCMonth();
    const currentYear = todayUTC.getUTCFullYear();
    
    // Get start of week (Monday)
    const dayOfWeek = todayUTC.getUTCDay() || 7; // Convert Sunday(0) to 7
    const startOfWeek = new Date(todayUTC);
    startOfWeek.setUTCDate(todayUTC.getUTCDate() - dayOfWeek + 1);

    const startOf30Days = new Date(todayUTC);
    startOf30Days.setUTCDate(todayUTC.getUTCDate() - 30);

    for (const [dStr, count] of Object.entries(logsByDate)) {
      const d = new Date(dStr);
      
      if (d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear) {
        totalWordsThisMonth += count;
      }
      if (d >= startOfWeek) {
        totalWordsThisWeek += count;
        if (count >= dailyGoal) {
          goalsHitThisWeek++;
        }
      }
      if (d >= startOf30Days) {
        wordsLast30Days += count;
      }
    }

    const averageWordsPerDay = Math.round(wordsLast30Days / 30);

    return {
      currentStreak,
      longestStreak,
      totalWordsAllTime,
      totalWordsThisMonth,
      totalWordsThisWeek,
      averageWordsPerDay,
      goalsHitThisWeek,
      dailyGoal
    };
  }

  static async getLeaderboard(userId: string, period: 'week' | 'month') {
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    
    let startDate = new Date(todayUTC);
    if (period === 'week') {
      const dayOfWeek = todayUTC.getUTCDay() || 7;
      startDate.setUTCDate(todayUTC.getUTCDate() - dayOfWeek + 1);
    } else {
      startDate.setUTCDate(1);
    }

    const logs = await prisma.writingLog.groupBy({
      by: ['userId'],
      _sum: { wordCount: true },
      where: { date: { gte: startDate } },
      orderBy: { _sum: { wordCount: 'desc' } }
    });

    const userIds = logs.map(l => l.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true, avatar: true }
    });

    const leaderboard = logs.map((log, index) => {
      const user = users.find(u => u.id === log.userId);
      return {
        rank: index + 1,
        userId: log.userId,
        displayName: user?.displayName || 'Unknown',
        avatar: user?.avatar,
        wordCount: log._sum.wordCount || 0
      };
    });

    let currentUserRank = leaderboard.find(l => l.userId === userId);
    
    // If user has 0 words, they are not in the list. Give them rank based on total users + 1
    if (!currentUserRank) {
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true, avatar: true } });
      currentUserRank = {
        rank: leaderboard.length + 1,
        userId,
        displayName: me?.displayName || 'Unknown',
        avatar: me?.avatar || null,
        wordCount: 0
      };
      leaderboard.push(currentUserRank); // Optionally push them to the end of the full list
    }

    const top10 = leaderboard.slice(0, 10);
    
    return {
      top10,
      currentUserRank
    };
  }

  static async exportProgress(userId: string) {
    const logs = await prisma.writingLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    let csvContent = 'Date,Project,Word Count,Notes\n';
    logs.forEach(log => {
      const date = log.date.toISOString().split('T')[0];
      const project = `"${log.projectName?.replace(/"/g, '""') || ''}"`;
      const words = log.wordCount;
      const notes = `"${log.notes?.replace(/"/g, '""') || ''}"`;
      csvContent += `${date},${project},${words},${notes}\n`;
    });

    return csvContent;
  }
}
