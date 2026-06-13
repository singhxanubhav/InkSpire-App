import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';

export const useIdeaSync = (matchId: string) => {
  const queryClient = useQueryClient();
  const { socket, isConnected, joinRoom, leaveRoom } = useSocket('/match');
  const [partnerTyping, setPartnerTyping] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && socket) {
      joinRoom(matchId);

      socket.on('idea:created', (idea) => {
        // Optimistically update React Query cache for ideas
        queryClient.setQueriesData({ queryKey: ['ideas', matchId] }, (oldData: any) => {
          if (!oldData) return { pages: [[idea]], pageParams: [] };
          // Insert at the beginning of the first page
          const newPages = [...oldData.pages];
          if (newPages.length > 0) {
            newPages[0] = [idea, ...newPages[0]];
          }
          return { ...oldData, pages: newPages };
        });
      });

      socket.on('idea:updated', (updatedIdea) => {
        queryClient.setQueriesData({ queryKey: ['ideas', matchId] }, (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any[]) =>
              page.map((idea) => (idea.id === updatedIdea.id ? updatedIdea : idea))
            ),
          };
        });
      });

      socket.on('idea:deleted', (ideaId) => {
        queryClient.setQueriesData({ queryKey: ['ideas', matchId] }, (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any[]) =>
              page.filter((idea) => idea.id !== ideaId)
            ),
          };
        });
      });

      socket.on('idea:pinned', ({ ideaId, isPinned }) => {
        queryClient.setQueriesData({ queryKey: ['ideas', matchId] }, (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any[]) =>
              page.map((idea) => (idea.id === ideaId ? { ...idea, isPinned } : idea))
            ),
          };
        });
      });

      socket.on('reply:created', ({ ideaId, reply }) => {
        queryClient.setQueriesData({ queryKey: ['ideas', matchId] }, (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any[]) =>
              page.map((idea) => {
                if (idea.id === ideaId) {
                  return {
                    ...idea,
                    replies: [reply, ...(idea.replies || [])],
                    _count: { replies: (idea._count?.replies || 0) + 1 }
                  };
                }
                return idea;
              })
            ),
          };
        });
      });

      socket.on('reply:deleted', ({ ideaId, replyId }) => {
        queryClient.setQueriesData({ queryKey: ['ideas', matchId] }, (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any[]) =>
              page.map((idea) => {
                if (idea.id === ideaId) {
                  return {
                    ...idea,
                    replies: (idea.replies || []).filter((r: any) => r.id !== replyId),
                    _count: { replies: Math.max(0, (idea._count?.replies || 0) - 1) }
                  };
                }
                return idea;
              })
            ),
          };
        });
      });

      socket.on('idea:typing', (userId) => {
        setPartnerTyping(userId);
      });

      socket.on('idea:stop-typing', (userId) => {
        setPartnerTyping((prev) => (prev === userId ? null : prev));
      });
    }

    return () => {
      if (socket) {
        leaveRoom(matchId);
        socket.off('idea:created');
        socket.off('idea:updated');
        socket.off('idea:deleted');
        socket.off('idea:pinned');
        socket.off('reply:created');
        socket.off('reply:deleted');
        socket.off('idea:typing');
        socket.off('idea:stop-typing');
      }
    };
  }, [isConnected, socket, matchId, joinRoom, leaveRoom, queryClient]);

  return { partnerTyping };
};
