import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { api, BASE_URL } from '../services/api';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatar: string | null;
  wordCount: number;
  rank: number;
}

export function useSprintRoom(eventId: string) {
  const token = useAuthStore(state => state.accessToken);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const appState = useRef(AppState.currentState);
  const wordCountRef = useRef(0); // Keeps latest count for flushing

  const connect = useCallback(() => {
    if (!token) return;

    const socketUrl = BASE_URL.replace('/api', '/sprint');
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_sprint', eventId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('participant:joined', (data) => {
      setParticipantCount(prev => prev + 1);
      // We could add them to leaderboard with 0, or wait for fetch
    });

    socket.on('count:updated', (data: { userId: string, wordCount: number }) => {
      setLeaderboard(prev => {
        const updated = prev.map(p => 
          p.userId === data.userId ? { ...p, wordCount: data.wordCount } : p
        );
        return updated.sort((a, b) => b.wordCount - a.wordCount).map((p, i) => ({ ...p, rank: i + 1 }));
      });
    });

    return () => {
      socket.emit('leave_sprint', eventId);
      socket.disconnect();
    };
  }, [eventId, token]);

  // Initial fetch and connection
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const res = await api.get(`/events/${eventId}`);
        setLeaderboard(res.data.data.leaderboard || []);
        setParticipantCount(res.data.data.participantCount || 0);
      } catch (err) {
        console.error('Failed to fetch event data', err);
      }
    };

    fetchEventData();
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
    };
  }, [eventId, connect]);

  // AppState flush
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/active/) && 
        nextAppState.match(/inactive|background/)
      ) {
        // App is going to background. Flush current word count.
        if (socketRef.current?.connected) {
          socketRef.current.emit('update_word_count', {
            eventId,
            wordCount: wordCountRef.current
          });
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [eventId]);

  const updateWordCount = useCallback((count: number) => {
    wordCountRef.current = count;
    if (socketRef.current?.connected) {
      socketRef.current.emit('update_word_count', {
        eventId,
        wordCount: count
      });
    }
  }, [eventId]);

  return {
    leaderboard,
    participantCount,
    isConnected,
    updateWordCount
  };
}
