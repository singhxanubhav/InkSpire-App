import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmModal } from '../../ui/ConfirmModal';

interface CommentThreadProps {
  isVisible: boolean;
  submissionId: string;
  onClose: () => void;
}

export default function CommentThread({ isVisible, submissionId, onClose }: CommentThreadProps) {
  const [content, setContent] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const insets = useSafeAreaInsets();

  const panY = useRef(new Animated.Value(0)).current;

  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: 1000,
    duration: 300,
    useNativeDriver: true,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 1.5) {
          Keyboard.dismiss();
          closeAnim.start(() => {
            onClose();
          });
        } else {
          resetPositionAnim.start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (isVisible) {
      panY.setValue(0);
    } else {
      setContent('');
    }
  }, [isVisible]);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', submissionId],
    queryFn: async () => {
      const res = await api.get(`/prompts/submissions/${submissionId}/comments`);
      return res.data.data;
    },
    enabled: isVisible && !!submissionId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const res = await api.post(`/prompts/submissions/${submissionId}/comments`, { content: newContent });
      return res.data.data;
    },
    onMutate: async (newContent) => {
      await queryClient.cancelQueries({ queryKey: ['comments', submissionId] });
      const previousComments = queryClient.getQueryData(['comments', submissionId]);
      
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content: newContent,
        authorId: user?.id,
        createdAt: new Date().toISOString(),
        author: { displayName: user?.displayName || 'You' }
      };

      queryClient.setQueryData(['comments', submissionId], (old: any) => [...(old || []), optimisticComment]);
      return { previousComments };
    },
    onError: (err, newContent, context: any) => {
      queryClient.setQueryData(['comments', submissionId], context.previousComments);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['communityPrompts'] });
      queryClient.invalidateQueries({ queryKey: ['myResponses'] });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/prompts/comments/${commentId}`);
      return commentId;
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ['comments', submissionId] });
      const previousComments = queryClient.getQueryData(['comments', submissionId]);
      
      queryClient.setQueryData(['comments', submissionId], (old: any) => 
        (old || []).filter((c: any) => c.id !== commentId)
      );
      return { previousComments };
    },
    onError: (err, commentId, context: any) => {
      queryClient.setQueryData(['comments', submissionId], context.previousComments);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['communityPrompts'] });
      queryClient.invalidateQueries({ queryKey: ['myResponses'] });
    }
  });

  const handleSend = () => {
    if (!content.trim()) return;
    addCommentMutation.mutate(content.trim());
    setContent('');
    Keyboard.dismiss();
  };

  const handleLongPress = (comment: any) => {
    if (comment.authorId !== user?.id) return;
    setDeleteTargetId(comment.id);
  };

  const renderComment = ({ item }: { item: any }) => {
    const isOwn = item.authorId === user?.id;
    return (
      <TouchableOpacity 
        style={[styles.commentItem, isOwn && styles.ownCommentItem]} 
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
        activeOpacity={isOwn ? 0.7 : 1}
      >
        <View style={styles.commentHeader}>
          <Text style={[styles.commentAuthor, isOwn && styles.ownCommentAuthor]}>{isOwn ? 'You' : item.author?.displayName}</Text>
          <Text style={styles.commentTime}>
            {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.commentContent}>{item.content}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal
        visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => { Keyboard.dismiss(); onClose(); }} />
        
        <Animated.View style={[styles.modalContent, { paddingBottom: insets.bottom, transform: [{ translateY: panY }] }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Comments</Text>
            </View>
          </View>

          <View style={styles.listContainer}>
            {isLoading ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="#4f46e5" />
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={renderComment}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#d1d5db" />
                    <Text style={styles.emptyTitle}>No comments yet</Text>
                    <Text style={styles.emptyText}>Be the first to share your thoughts!</Text>
                  </View>
                }
              />
            )}
          </View>

          <View style={[styles.inputArea, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor="#9ca3af"
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !content.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!content.trim() || addCommentMutation.isPending}
            >
              <Ionicons name="send" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>

    <ConfirmModal
      visible={!!deleteTargetId}
      title="Delete Comment"
      message="Are you sure you want to delete this comment?"
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="danger"
      onConfirm={() => {
        if (deleteTargetId) deleteCommentMutation.mutate(deleteTargetId);
        setDeleteTargetId(null);
      }}
      onCancel={() => setDeleteTargetId(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '75%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  listContainer: {
    flex: 1, // Crucial for scrolling
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 20,
  },
  commentItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ownCommentItem: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  ownCommentAuthor: {
    color: '#4f46e5',
  },
  commentTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  commentContent: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 22,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 48,
    maxHeight: 120,
    fontSize: 15,
    color: '#0f172a',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#cbd5e1',
  }
});
