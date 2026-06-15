import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import CommentThread from './CommentThread';

interface ResponsesListModalProps {
  isVisible: boolean;
  prompt: any;
  onClose: () => void;
}

export default function ResponsesListModal({ isVisible, prompt, onClose }: ResponsesListModalProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['90%', '100%'], []);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible]);

  const { data: responsesData, isLoading } = useQuery({
    queryKey: ['promptSubmissions', prompt?.id],
    queryFn: async () => {
      if (!prompt?.id) return { data: [], nextCursor: null };
      const res = await api.get(`/prompts/${prompt.id}/submissions`);
      return res.data;
    },
    enabled: isVisible && !!prompt?.id,
  });

  const handleShare = async (response: any) => {
    try {
      await Share.share({
        message: `Prompt: "${prompt.content}"\n\n"${response.content}"\n\n- ${response.author?.displayName || 'Anonymous'} via InkSpire`,
      });
    } catch (error: any) {
      console.error('Error sharing:', error.message);
    }
  };

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} onPress={onClose} />
  );

  const renderResponse = ({ item }: { item: any }) => (
    <View style={styles.responseCard}>
      <View style={styles.authorHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.author?.displayName?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.authorName}>{item.author?.displayName || 'Anonymous'}</Text>
            <Text style={styles.timeText}>
              {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleShare(item)} hitSlop={10}>
          <Ionicons name="share-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.content}>{item.content}</Text>
      
      <View style={styles.footer}>
        <Text style={styles.wordCount}>{item.wordCount} words</Text>
        <TouchableOpacity 
          style={styles.commentBtn}
          onPress={() => setSelectedSubmissionId(item.id)}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#6b7280" />
          <Text style={styles.commentText}>{item._count?.comments || 0} Comments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onDismiss={onClose}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#e5e7eb', width: 40 }}
        backgroundStyle={{ backgroundColor: '#f9fafb', borderRadius: 24 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Responses</Text>
          <Ionicons name="close" size={24} color="#6b7280" onPress={onClose} />
        </View>

        {prompt && (
          <View style={styles.promptReference}>
            <Text style={styles.promptText}>"{prompt.content}"</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : (
          <FlatList
            data={responsesData?.data || []}
            keyExtractor={item => item.id}
            renderItem={renderResponse}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No responses yet. Be the first to write!</Text>
              </View>
            }
          />
        )}
      </BottomSheetModal>

      <CommentThread 
        isVisible={!!selectedSubmissionId}
        submissionId={selectedSubmissionId || ''}
        onClose={() => setSelectedSubmissionId(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  promptReference: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  promptText: {
    fontSize: 14,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  responseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  authorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: 14,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  content: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  wordCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4b5563',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  }
});
