import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';

interface CommentThreadProps {
  isVisible: boolean;
  submissionId: string;
  onClose: () => void;
}

export default function CommentThread({ isVisible, submissionId, onClose }: CommentThreadProps) {
  const [content, setContent] = useState('');
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  
  const snapPoints = useMemo(() => ['50%', '90%'], []);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
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
    
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteCommentMutation.mutate(comment.id) }
      ]
    );
  };

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} onPress={onClose} />
  );

  const renderComment = ({ item }: { item: any }) => {
    const isOwn = item.authorId === user?.id;
    return (
      <TouchableOpacity 
        style={styles.commentItem} 
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
        activeOpacity={isOwn ? 0.7 : 1}
      >
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{isOwn ? 'You' : item.author?.displayName}</Text>
          <Text style={styles.commentTime}>
            {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.commentContent}>{item.content}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#e5e7eb', width: 40 }}
      backgroundStyle={{ backgroundColor: '#ffffff', borderRadius: 24 }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Comments</Text>
        <Ionicons name="close" size={24} color="#6b7280" onPress={onClose} />
      </View>

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
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No comments yet. Be the first to share your thoughts!</Text>
            </View>
          }
        />
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#9ca3af"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !content.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!content.trim() || addCommentMutation.isPending}
          >
            <Ionicons name="send" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100, // room for input
  },
  commentItem: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  commentTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  commentContent: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2, // align with input bottom roughly
  },
  sendBtnDisabled: {
    backgroundColor: '#9ca3af',
  }
});
