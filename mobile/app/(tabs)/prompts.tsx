import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import PromptResponseModal from '../../components/features/prompts/PromptResponseModal';
import SuggestPromptModal from '../../components/features/prompts/SuggestPromptModal';
import ResponsesListModal from '../../components/features/prompts/ResponsesListModal';

export default function PromptsScreen() {
  const [activeTab, setActiveTab] = useState<'BROWSE' | 'MY_RESPONSES'>('BROWSE');
  const [cachedDailyPrompt, setCachedDailyPrompt] = useState<any>(null);
  
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showResponsesList, setShowResponsesList] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);

  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  // Fetch Daily Prompt
  const { data: dailyPromptData, isLoading: isLoadingDaily } = useQuery({
    queryKey: ['dailyPrompt'],
    queryFn: async () => {
      const res = await api.get('/prompts/daily');
      const prompt = res.data.data;
      if (prompt) {
        await AsyncStorage.setItem('cachedDailyPrompt', JSON.stringify(prompt));
        setCachedDailyPrompt(prompt);
      }
      return prompt;
    },
  });

  // Load cached prompt initially
  useEffect(() => {
    AsyncStorage.getItem('cachedDailyPrompt').then((val: string | null) => {
      if (val && !cachedDailyPrompt) {
        setCachedDailyPrompt(JSON.parse(val));
      }
    });
  }, []);

  const dailyPrompt = dailyPromptData || cachedDailyPrompt;

  // Fetch Community Prompts
  const {
    data: communityPromptsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingCommunity,
    refetch: refetchCommunity,
    isRefetching: isRefetchingCommunity
  } = useInfiniteQuery({
    queryKey: ['communityPrompts'],
    queryFn: async ({ pageParam }) => {
      const res = await api.get('/prompts/community', {
        params: { cursor: pageParam }
      });
      return res.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    enabled: activeTab === 'BROWSE'
  });

  // Fetch My Responses
  const {
    data: myResponsesData,
    fetchNextPage: fetchNextResponses,
    hasNextPage: hasNextResponses,
    isFetchingNextPage: isFetchingNextResponses,
    isLoading: isLoadingResponses,
    refetch: refetchResponses,
    isRefetching: isRefetchingResponses
  } = useInfiniteQuery({
    queryKey: ['myResponses'],
    queryFn: async ({ pageParam }) => {
      const res = await api.get('/prompts/my-submissions', {
        params: { cursor: pageParam }
      });
      return res.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    enabled: activeTab === 'MY_RESPONSES'
  });

  const communityPrompts = communityPromptsData ? communityPromptsData.pages.flatMap((p: any) => p.data) : [];
  const myResponses = myResponsesData ? myResponsesData.pages.flatMap((p: any) => p.data) : [];

  const handleUpvote = async (promptId: string, currentStatus: boolean, count: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Optimistic Update
    queryClient.setQueriesData({ queryKey: ['communityPrompts'] }, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          data: page.data.map((p: any) => 
            p.id === promptId 
              ? { ...p, hasUpvoted: !currentStatus, _count: { ...p._count, upvotes: currentStatus ? count - 1 : count + 1 } }
              : p
          )
        }))
      };
    });

    try {
      await api.post(`/prompts/${promptId}/upvote`);
    } catch (e) {
      console.error(e);
      queryClient.invalidateQueries({ queryKey: ['communityPrompts'] });
    }
  };

  const handleWriteResponse = (prompt: any) => {
    setSelectedPrompt(prompt);
    setShowResponseModal(true);
  };

  const renderDailyPrompt = () => {
    if (!dailyPrompt) return null;

    return (
      <TouchableOpacity 
        style={styles.dailyPromptCard}
        onPress={() => handleWriteResponse(dailyPrompt)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#4f46e5', '#ec4899', '#f43f5e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dailyPromptGradient}
        >
          <View style={styles.dailyBadge}>
            <Ionicons name="star" size={14} color="#fef08a" />
            <Text style={styles.dailyBadgeText}>Daily Challenge</Text>
            <View style={styles.actionDot} />
          </View>
          
          <Text style={styles.dailyPromptText}>"{dailyPrompt.content}"</Text>
          
          <View style={styles.dailyFooter}>
            <View style={styles.genreTag}>
              <Text style={styles.genreTagText}>{dailyPrompt.genre?.replace(/_/g, ' ')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.responseCount}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedPrompt(dailyPrompt);
                setShowResponsesList(true);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.responseAvatarStack}>
                <Ionicons name="people" size={16} color="#ffffff" />
              </View>
              <Text style={styles.responseCountText}>
                {dailyPrompt._count?.submissions || 0} responses
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#ffffff" style={{ opacity: 0.8 }} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderCommunityPrompt = ({ item }: { item: any }) => (
    <View style={styles.communityCard}>
      <View style={styles.communityContent}>
        <View style={styles.communityHeader}>
          <View style={styles.authorBadge}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniText}>{item.author?.displayName?.[0]?.toUpperCase() || 'A'}</Text>
            </View>
            <Text style={styles.communityAuthor}>{item.author?.displayName || 'Anonymous'}</Text>
          </View>
          <Text style={styles.communityGenre}>{item.genre?.replace(/_/g, ' ')}</Text>
        </View>
        
        <Text style={styles.communityPromptText} numberOfLines={4}>"{item.content}"</Text>
        
        <View style={styles.communityFooter}>
          <View style={styles.actionGroup}>
            <TouchableOpacity 
              style={[styles.actionBtn, item.hasUpvoted && styles.actionBtnActive]}
              onPress={() => handleUpvote(item.id, item.hasUpvoted, item._count?.upvotes || 0)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name={item.hasUpvoted ? "heart" : "heart-outline"} 
                size={20} 
                color={item.hasUpvoted ? "#ec4899" : "#64748b"} 
              />
              <Text style={[styles.actionText, item.hasUpvoted && styles.actionTextPink]}>
                {item._count?.upvotes || 0}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => {
                setSelectedPrompt(item);
                setShowResponsesList(true);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chatbubbles-outline" size={20} color="#64748b" />
              <Text style={styles.actionText}>{item._count?.submissions || 0}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.writeBtn}
            onPress={() => handleWriteResponse(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil" size={16} color="#ffffff" />
            <Text style={styles.writeBtnText}>Write</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderMyResponse = ({ item }: { item: any }) => (
    <View style={styles.myResponseCard}>
      <View style={styles.myResponseHeader}>
        <Ionicons name="document-text" size={16} color="#8b5cf6" />
        <Text style={styles.myResponseDate}>
          {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
      <View style={styles.myResponsePromptBox}>
        <Text style={styles.myResponsePromptText} numberOfLines={2}>"{item.prompt.content}"</Text>
      </View>
      <Text style={styles.myResponseContent} numberOfLines={5}>{item.content}</Text>
      <View style={styles.myResponseFooter}>
        <View style={styles.statPill}>
          <Ionicons name="text-outline" size={14} color="#64748b" />
          <Text style={styles.statText}>{item.wordCount} words</Text>
        </View>
        <TouchableOpacity 
          style={styles.statPillActive}
          onPress={() => {
            setSelectedPrompt(item.prompt);
            setShowResponsesList(true); // Since we need to view comments, opening the list might not perfectly go to *this* response yet, but it's a start.
            // Ideally, we'd open CommentThread directly here. We can just show the response in ResponsesList.
          }}
        >
          <Ionicons name="chatbubble-outline" size={14} color="#4f46e5" />
          <Text style={styles.statTextActive}>{item._count?.comments || 0} comments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Discover & Create</Text>
          <Text style={styles.headerTitle}>Writing Prompts</Text>
        </View>
        <View style={styles.headerIconBg}>
          <Ionicons name="sparkles" size={24} color="#8b5cf6" />
        </View>
      </View>

      <FlatList
        data={activeTab === 'BROWSE' ? communityPrompts : myResponses}
        keyExtractor={item => item.id}
        renderItem={activeTab === 'BROWSE' ? renderCommunityPrompt : renderMyResponse}
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={activeTab === 'BROWSE' ? isRefetchingCommunity : isRefetchingResponses} 
            onRefresh={activeTab === 'BROWSE' ? refetchCommunity : refetchResponses} 
            tintColor="#8b5cf6"
          />
        }
        onEndReached={() => {
          if (activeTab === 'BROWSE' && hasNextPage) fetchNextPage();
          if (activeTab === 'MY_RESPONSES' && hasNextResponses) fetchNextResponses();
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            {activeTab === 'BROWSE' && renderDailyPrompt()}
            
            {/* Tabs (Segmented Control Style) */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'BROWSE' && styles.activeTab]}
                onPress={() => setActiveTab('BROWSE')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === 'BROWSE' && styles.activeTabText]}>Explore</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'MY_RESPONSES' && styles.activeTab]}
                onPress={() => setActiveTab('MY_RESPONSES')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === 'MY_RESPONSES' && styles.activeTabText]}>My Responses</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'BROWSE' && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Community Prompts</Text>
                <TouchableOpacity 
                  style={styles.suggestBtn}
                  onPress={() => setShowSuggestModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={18} color="#ffffff" />
                  <Text style={styles.suggestBtnText}>Suggest</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          (activeTab === 'BROWSE' ? !isLoadingCommunity : !isLoadingResponses) ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="color-wand-outline" size={48} color="#8b5cf6" />
              </View>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'BROWSE' 
                  ? "Be the first to suggest a brilliant prompt for the community!" 
                  : "You haven't written any responses yet. Pick a prompt and let your creativity flow!"}
              </Text>
            </View>
          ) : (
            <ActivityIndicator style={{ marginTop: 40 }} color="#8b5cf6" size="large" />
          )
        }
      />

      <PromptResponseModal 
        isVisible={showResponseModal}
        prompt={selectedPrompt}
        onClose={() => setShowResponseModal(false)}
      />

      <SuggestPromptModal
        isVisible={showSuggestModal}
        onClose={() => setShowSuggestModal(false)}
      />

      <ResponsesListModal
        isVisible={showResponsesList}
        prompt={selectedPrompt}
        onClose={() => setShowResponsesList(false)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  dailyPromptCard: {
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  dailyPromptGradient: {
    borderRadius: 24,
    padding: 28,
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    gap: 6,
  },
  dailyBadgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fef08a',
    marginLeft: 4,
    shadowColor: '#fef08a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  dailyPromptText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 34,
    marginBottom: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  dailyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genreTag: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  genreTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  responseCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  responseAvatarStack: {
    marginRight: 2,
  },
  responseCountText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 6,
    marginBottom: 28,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  suggestBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  communityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  communityContent: {
    padding: 20,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4f46e5',
  },
  communityGenre: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: 'uppercase',
  },
  communityAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  communityPromptText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 26,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  communityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnActive: {
    // optional active styling
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  actionTextPink: {
    color: '#ec4899',
  },
  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  writeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  myResponseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  myResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  myResponseDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  myResponsePromptBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
    marginBottom: 16,
  },
  myResponsePromptText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  myResponseContent: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 26,
    marginBottom: 20,
  },
  myResponseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  statTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
