import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { prisma } from './database';

let io: Server;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL || '*',
      credentials: true,
    },
  });

  const matchNamespace = io.of('/match');

  // Authentication middleware
  matchNamespace.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, env.JWT_SECRET || 'secret') as { id: string; email: string };
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  matchNamespace.on('connection', (socket: Socket) => {
    console.log(`Socket connected to /match: ${socket.id}`);

    // Join a specific match room
    socket.on('join_match', async (matchId: string) => {
      try {
        const userId = socket.data.user.id;
        const match = await prisma.match.findUnique({ where: { id: matchId } });
        
        if (!match || (match.requesterId !== userId && match.receiveeId !== userId)) {
          return socket.emit('error', 'Not authorized to join this match');
        }

        const roomName = `match:${matchId}`;
        socket.join(roomName);
        console.log(`User ${userId} joined room ${roomName}`);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('leave_match', (matchId: string) => {
      const roomName = `match:${matchId}`;
      socket.leave(roomName);
    });

    // Typing indicators
    socket.on('typing', (matchId: string) => {
      socket.to(`match:${matchId}`).emit('idea:typing', socket.data.user.id);
    });

    socket.on('stop_typing', (matchId: string) => {
      socket.to(`match:${matchId}`).emit('idea:stop-typing', socket.data.user.id);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected from /match: ${socket.id}`);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
