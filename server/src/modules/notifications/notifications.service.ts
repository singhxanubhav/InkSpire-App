import { PrismaClient, NotificationType } from '@prisma/client';
import https from 'https';

const prisma = new PrismaClient();

// ─── Lightweight Expo Push Helper (replaces expo-server-sdk) ─────────────────
// expo-server-sdk v6+ is ESM-only and breaks CJS builds.
// We call Expo's Push API directly via Node's built-in https module.
// See: https://docs.expo.dev/push-notifications/sending-notifications/
// ─────────────────────────────────────────────────────────────────────────────

function isExpoPushToken(token: string): boolean {
  return /^ExponentPushToken\[.+\]$/.test(token) || /^[a-z\d]{8}-[a-z\d]{4}-[a-z\d]{4}-[a-z\d]{4}-[a-z\d]{12}$/i.test(token);
}

interface ExpoPushMessage {
  to: string;
  sound?: 'default' | null;
  title?: string;
  body?: string;
  data?: Record<string, any>;
}

function sendExpoPushNotification(message: ExpoPushMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify([message]);
    const options: https.RequestOptions = {
      hostname: 'exp.host',
      path: '/--/api/v2/push/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class NotificationsService {
  static async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: [
          { isRead: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } })
    ]);

    return { notifications, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async markRead(notificationId: string, userId: string) {
    return prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true }
    });
  }

  static async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  static async createAndSend(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: any = {},
    referenceId?: string
  ) {
    // 1. Create in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data ? JSON.parse(JSON.stringify(data)) : null,
        referenceId,
      }
    });

    // 2. Try pushing to Expo via direct HTTPS call (no ESM dependency)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { expoPushToken: true }
    });

    if (user?.expoPushToken && isExpoPushToken(user.expoPushToken)) {
      try {
        const response = await sendExpoPushNotification({
          to: user.expoPushToken,
          sound: 'default',
          title,
          body,
          data: { ...data, notificationId: notification.id, type },
        });

        // Handle DeviceNotRegistered error
        const tickets: any[] = response?.data || [];
        for (const ticket of tickets) {
          if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered') {
            await prisma.user.update({
              where: { id: userId },
              data: { expoPushToken: null }
            });
          }
        }
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }

    return notification;
  }
}
