import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useIdeaSync } from '../../../hooks/useIdeaSync';
import { useAuthStore } from '../../../store/authStore';
import IdeaCard from './IdeaCard';
import IdeaComposer from './IdeaComposer';

interface IdeaWorkspaceProps {
  matchId: string;
  partner: any;
}

const IDEA_TYPES = ['ALL', 'CHARACTER', 'PLOT', 'WORLD', 'DIALOGUE', 'OTHER'];

export default function IdeaWorkspace({ matchId, partner }: IdeaWorkspaceProps) {
  const user = useAuthStore(state => state.user);
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Setup Socket sync
  const { partnerTyping } = useIdeaSync(matchId);
  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Ideas
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ['ideas', matchId, filterType, debouncedSearch],
    queryFn: async ({ pageParam }) => {
      const params: any = { cursor: pageParam };
      if (filterType !== 'ALL') params.type = filterType;
      if (debouncedSearch) params.search = debouncedSearch;
      
      const res = await api.get(`/matches/${matchId}/ideas`, { params });
      return res.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
  });

  // Flatten pages
  const ideas = data ? data.pages.flatMap((page: any) => page.data || page) : [];

  const handleSendIdea = async (ideaData: any) => {
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticIdea = {
      id: tempId,
      matchId,
      authorId: user?.id,
      type: ideaData.type || 'OTHER',
      content: ideaData.content,
      tags: ideaData.tags || [],
      isPinned: false,
      createdAt: new Date().toISOString(),
      author: { id: user?.id, displayName: user?.displayName || 'You', avatar: user?.avatar },
      _count: { replies: 0 },
      replies: []
    };

    queryClient.setQueriesData({ queryKey: ['ideas', matchId] }, (oldData: any) => {
      if (!oldData) return { pages: [{ data: [optimisticIdea], nextCursor: null }], pageParams: [] };
      const newPages = [...oldData.pages];
      if (newPages.length > 0) {
        newPages[0] = { ...newPages[0], data: [optimisticIdea, ...newPages[0].data] };
      }
      return { ...oldData, pages: newPages };
    });

    try {
      await api.post(`/matches/${matchId}/ideas`, ideaData);
    } catch (err) {
      console.error("Failed to post idea", err);
      queryClient.invalidateQueries({ queryKey: ['ideas', matchId] });
    }
  };

  const renderIdea = ({ item }: { item: any }) => (
    <IdeaCard 
      idea={item} 
      matchId={matchId}
      isOwn={item.authorId === user?.id}
      partnerName={partner?.displayName || 'Partner'}
    />
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ideas, characters, tags..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={IDEA_TYPES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filtersContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filterType === item && styles.activeFilterChip]}
              onPress={() => setFilterType(item)}
            >
              <Text style={[styles.filterText, filterType === item && styles.activeFilterText]}>
                {item === 'ALL' ? 'All' : item.charAt(0) + item.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Ideas List */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : isError ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Failed to load ideas.</Text>
          </View>
        ) : (
          <FlatList
            data={ideas}
            keyExtractor={(item: any) => item.id}
            renderItem={renderIdea}
            inverted
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="bulb-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No ideas yet</Text>
                <Text style={styles.emptyText}>
                  Start sharing ideas with {partner?.displayName || 'your partner'}. What are you working on?
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Typing Indicator */}
      {partnerTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{partner?.displayName || 'Partner'} is typing...</Text>
        </View>
      )}

      {/* Composer */}
      <IdeaComposer matchId={matchId} onSend={handleSendIdea} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  filtersWrapper: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterChip: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  activeFilterText: {
    color: '#4f46e5',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  typingIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  typingText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
