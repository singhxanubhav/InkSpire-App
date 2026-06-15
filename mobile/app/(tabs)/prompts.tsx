import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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
          colors={['#8b5cf6', '#f43f5e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dailyPromptGradient}
        >
          <View style={styles.dailyBadge}>
            <Text style={styles.dailyBadgeText}>Today's Prompt</Text>
            {/* Subtle dot to encourage action */}
            <View style={styles.actionDot} />
          </View>
          <Text style={styles.dailyPromptText}>"{dailyPrompt.content}"</Text>
          <View style={styles.dailyFooter}>
            <View style={styles.genreTag}>
              <Text style={styles.genreTagText}>{dailyPrompt.genre}</Text>
            </View>
            <TouchableOpacity 
              style={styles.responseCount}
              onPress={() => {
                setSelectedPrompt(dailyPrompt);
                setShowResponsesList(true);
              }}
            >
              <Ionicons name="people" size={14} color="#ffffff" />
              <Text style={styles.responseCountText}>{dailyPrompt._count?.submissions || 0} responses</Text>
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
          <Text style={styles.communityGenre}>{item.genre}</Text>
          <Text style={styles.communityAuthor}>by {item.author?.displayName || 'Anonymous'}</Text>
        </View>
        <Text style={styles.communityPromptText} numberOfLines={3}>{item.content}</Text>
        
        <View style={styles.communityFooter}>
          <TouchableOpacity 
            style={[styles.upvoteBtn, item.hasUpvoted && styles.upvotedBtn]}
            onPress={() => handleUpvote(item.id, item.hasUpvoted, item._count?.upvotes || 0)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={item.hasUpvoted ? "arrow-up-circle" : "arrow-up-circle-outline"} size={20} color={item.hasUpvoted ? "#2563eb" : "#6b7280"} />
            <Text style={[styles.upvoteText, item.hasUpvoted && styles.upvotedText]}>{item._count?.upvotes || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.respondBtn}
            onPress={() => handleWriteResponse(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={18} color="#4b5563" />
            <Text style={styles.respondText}>Write</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.respondBtn}
            onPress={() => {
              setSelectedPrompt(item);
              setShowResponsesList(true);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="people-outline" size={18} color="#4b5563" />
            <Text style={styles.respondText}>{item._count?.submissions || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderMyResponse = ({ item }: { item: any }) => (
    <View style={styles.responseCard}>
      <Text style={styles.responsePromptText} numberOfLines={2}>Prompt: {item.prompt.content}</Text>
      <Text style={styles.responseText} numberOfLines={4}>{item.content}</Text>
      <View style={styles.responseFooter}>
        <Text style={styles.wordCount}>{item.wordCount} words</Text>
        <View style={styles.commentCount}>
          <Ionicons name="chatbubble-outline" size={14} color="#6b7280" />
          <Text style={styles.commentCountText}>{item._count?.comments || 0}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prompts</Text>
      </View>

      <FlatList
        data={activeTab === 'BROWSE' ? communityPrompts : myResponses}
        keyExtractor={item => item.id}
        renderItem={activeTab === 'BROWSE' ? renderCommunityPrompt : renderMyResponse}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={activeTab === 'BROWSE' ? isRefetchingCommunity : isRefetchingResponses} 
            onRefresh={activeTab === 'BROWSE' ? refetchCommunity : refetchResponses} 
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
            
            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'BROWSE' && styles.activeTab]}
                onPress={() => setActiveTab('BROWSE')}
              >
                <Text style={[styles.tabText, activeTab === 'BROWSE' && styles.activeTabText]}>Browse</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'MY_RESPONSES' && styles.activeTab]}
                onPress={() => setActiveTab('MY_RESPONSES')}
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
                >
                  <Ionicons name="add" size={16} color="#ffffff" />
                  <Text style={styles.suggestBtnText}>Suggest</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          (activeTab === 'BROWSE' ? !isLoadingCommunity : !isLoadingResponses) ? (
            <View style={styles.emptyState}>
              <Ionicons name="bulb-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'BROWSE' 
                  ? "Be the first to suggest a community prompt!" 
                  : "You haven't written any responses yet. Pick a prompt and start writing!"}
              </Text>
            </View>
          ) : (
            <ActivityIndicator style={{ marginTop: 40 }} />
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
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  dailyPromptCard: {
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  dailyPromptGradient: {
    borderRadius: 20,
    padding: 24,
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  dailyBadgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginLeft: 8,
  },
  dailyPromptText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 32,
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', // Proxy for Playfair Display
  },
  dailyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genreTag: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  genreTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  responseCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  responseCountText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#111827',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  suggestBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  communityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  communityContent: {
    padding: 16,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  communityGenre: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  communityAuthor: {
    fontSize: 12,
    color: '#6b7280',
  },
  communityPromptText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
    marginBottom: 16,
  },
  communityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upvotedBtn: {
    backgroundColor: '#eff6ff',
  },
  upvoteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  upvotedText: {
    color: '#2563eb',
  },
  respondBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  respondText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4b5563',
  },
  responseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  responsePromptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
    marginBottom: 12,
  },
  responseFooter: {
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
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentCountText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
