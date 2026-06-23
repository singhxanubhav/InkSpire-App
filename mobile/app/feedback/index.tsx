import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { api } from '../../services/api';
import { FeedbackFilterSheet } from '../../components/features/feedback/FeedbackFilterSheet';

export default function BrowseRequestsScreen() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);

  // We keep track of "applied" filters so that we don't refetch on every toggle inside the sheet,
  // but rather only when the user clicks "Show Results" in the bottom sheet.
  const [appliedFilters, setAppliedFilters] = useState({
    genre: null as string | null,
    focus: [] as string[],
    sortBy: 'newest'
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: ['feedbackRequests', appliedFilters.genre, appliedFilters.focus, appliedFilters.sortBy],
    queryFn: async ({ pageParam }) => {
      const res = await api.get('/feedback/open', {
        params: { 
          cursor: pageParam,
          genre: appliedFilters.genre || undefined,
          focusAreas: appliedFilters.focus.length > 0 ? appliedFilters.focus.join(',') : undefined,
          sortBy: appliedFilters.sortBy
        }
      });
      return res.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
  });

  const requests = data ? data.pages.flatMap((p: any) => p.data) : [];

  const handleApplyFilters = () => {
    setAppliedFilters({
      genre: selectedGenre,
      focus: selectedFocus,
      sortBy: sortBy
    });
    setIsFilterSheetVisible(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (appliedFilters.genre) count++;
    count += appliedFilters.focus.length;
    return count;
  };

  const renderActionBar = () => {
    const activeCount = getActiveFilterCount();
    return (
      <View style={styles.actionBar}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity 
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
          onPress={() => setIsFilterSheetVisible(true)}
        >
          <Ionicons name="options-outline" size={20} color={activeCount > 0 ? '#0284c7' : '#475569'} />
          <Text style={[styles.filterBtnText, activeCount > 0 && styles.filterBtnTextActive]}>Filters</Text>
          {activeCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderRequestCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/feedback/${item.id}/give-feedback`)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.authorSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.author?.displayName?.[0]?.toUpperCase() || 'A'}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{item.author?.displayName || 'Anonymous'}</Text>
            <Text style={styles.timeAgo}>Just now</Text>
          </View>
        </View>
        <View style={styles.genreTag}>
          <Text style={styles.genreTagText}>{item.genre?.replace(/_/g, ' ')}</Text>
        </View>
      </View>
      
      <Text style={styles.title}>{item.title}</Text>
      
      <Text style={styles.excerpt} numberOfLines={3}>
        "{item.excerpt}"
      </Text>
      
      <View style={styles.focusContainer}>
        {item.focusAreas.map((focus: string) => (
          <View key={focus} style={styles.focusTag}>
            <Text style={styles.focusTagText}>{focus}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.stats}>
          <Ionicons name="chatbubble-outline" size={18} color="#94a3b8" />
          <Text style={styles.statsText}>{item._count?.responses || 0} responses</Text>
        </View>
        
        <View 
          style={[styles.giveFeedbackBtn, item.hasResponded && styles.giveFeedbackBtnDisabled]}
        >
          <Text style={[styles.giveFeedbackText, item.hasResponded && styles.giveFeedbackTextDisabled]}>
            {item.hasResponded ? 'Reviewed' : 'Review'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {renderActionBar()}
      
      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={renderRequestCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#8b5cf6" />
        }
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="document-text-outline" size={48} color="#94a3b8" />
              </View>
              <Text style={styles.emptyText}>No requests found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters or check back later.</Text>
              {getActiveFilterCount() > 0 && (
                <TouchableOpacity 
                  style={styles.clearFiltersBtn}
                  onPress={() => {
                    setSelectedGenre(null);
                    setSelectedFocus([]);
                    setSortBy('newest');
                    setAppliedFilters({ genre: null, focus: [], sortBy: 'newest' });
                  }}
                >
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <ActivityIndicator style={{ marginTop: 40 }} color="#8b5cf6" size="large" />
          )
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/feedback/submit')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <FeedbackFilterSheet
        isVisible={isFilterSheetVisible}
        onClose={() => setIsFilterSheetVisible(false)}
        selectedGenre={selectedGenre}
        setSelectedGenre={setSelectedGenre}
        selectedFocus={selectedFocus}
        setSelectedFocus={setSelectedFocus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onApply={handleApplyFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterBtnActive: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  filterBtnTextActive: {
    color: '#0284c7',
  },
  filterBadge: {
    backgroundColor: '#0284c7',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748b',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  genreTag: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  genreTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  excerpt: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 26,
    marginBottom: 20,
  },
  focusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  focusTag: {
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  focusTagText: {
    fontSize: 12,
    color: '#be185d',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 16,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  giveFeedbackBtn: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  giveFeedbackBtnDisabled: {
    backgroundColor: '#f1f5f9',
  },
  giveFeedbackText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  giveFeedbackTextDisabled: {
    color: '#94a3b8',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: '80%',
  },
  clearFiltersBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clearFiltersText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#8b5cf6',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  }
});
