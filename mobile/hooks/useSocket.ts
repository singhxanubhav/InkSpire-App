import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { storage } from '../utils/storage';

// Assuming server is running locally on port 8000 for Android/iOS emulator or localhost for web
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';

let socketInstance: Socket | null = null;

export const useSocket = (namespace: string = '/match') => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connectSocket = async () => {
      if (!socketInstance) {
        const token = await storage.getItem('accessToken');
        if (!token) return;

        socketInstance = io(`${SOCKET_URL}${namespace}`, {
          auth: { token },
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
        });

        socketInstance.on('connect', () => {
          setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
          setIsConnected(false);
        });
      } else {
        setIsConnected(socketInstance.connected);
      }
    };

    connectSocket();

    return () => {
      // We don't necessarily want to disconnect on unmount of a single component
      // if it's meant to be a singleton, but for this app it's fine
    };
  }, [namespace]);

  const joinRoom = useCallback((matchId: string) => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('join_match', matchId);
    }
  }, []);

  const leaveRoom = useCallback((matchId: string) => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('leave_match', matchId);
    }
  }, []);

  const emitTyping = useCallback((matchId: string, isTyping: boolean) => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit(isTyping ? 'typing' : 'stop_typing', matchId);
    }
  }, []);

  return {
    socket: socketInstance,
    isConnected,
    joinRoom,
    leaveRoom,
    emitTyping,
  };
};
