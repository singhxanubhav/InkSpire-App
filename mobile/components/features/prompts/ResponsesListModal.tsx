import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Share, Modal, Platform, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import CommentThread from './CommentThread';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ResponsesListModalProps {
  isVisible: boolean;
  prompt: any;
  onClose: () => void;
}

export default function ResponsesListModal({ isVisible, prompt, onClose }: ResponsesListModalProps) {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
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
              {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleShare(item)} hitSlop={15} style={styles.iconBtn}>
          <Ionicons name="share-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.content}>{item.content}</Text>
      
      <View style={styles.footer}>
        <Text style={styles.wordCount}>{item.wordCount} words</Text>
        <TouchableOpacity 
          style={styles.commentBtn}
          onPress={() => setSelectedSubmissionId(item.id)}
          hitSlop={10}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#4f46e5" />
          <Text style={styles.commentText}>{item._count?.comments || 0} Comments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
          
          <Animated.View style={[styles.modalContent, { paddingBottom: insets.bottom, transform: [{ translateY: panY }] }]}>
            <View {...panResponder.panHandlers}>
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              <View style={styles.header}>
                <Text style={styles.title}>Responses</Text>
              </View>
            </View>

            {prompt && (
              <View style={styles.promptReference}>
                <View style={styles.promptIconBg}>
                  <Ionicons name="bulb-outline" size={18} color="#8b5cf6" />
                </View>
                <Text style={styles.promptText}>"{prompt.content}"</Text>
              </View>
            )}

            <View style={styles.listContainer}>
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
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
                      <Text style={styles.emptyTitle}>No responses yet</Text>
                      <Text style={styles.emptyText}>Be the first to write a story for this prompt!</Text>
                    </View>
                  }
                />
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>

      <CommentThread 
        isVisible={!!selectedSubmissionId}
        submissionId={selectedSubmissionId || ''}
        onClose={() => setSelectedSubmissionId(null)}
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
    height: '92%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  listContainer: {
    flex: 1, 
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
  promptReference: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  promptIconBg: {
    backgroundColor: '#ede9fe',
    padding: 8,
    borderRadius: 12,
  },
  promptText: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 22,
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 60,
  },
  responseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  authorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#4f46e5',
    fontWeight: '800',
    fontSize: 16,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  timeText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  content: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 26,
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  wordCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  commentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
  },
  emptyState: {
    paddingVertical: 60,
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
  }
});
