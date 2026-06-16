import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { api } from '../../services/api';

const GENRES = ['FANTASY', 'SCI_FI', 'ROMANCE', 'MYSTERY', 'THRILLER', 'HORROR', 'LITERARY_FICTION', 'HISTORICAL_FICTION', 'NON_FICTION', 'POETRY', 'OTHER'];
const FOCUS_AREAS = ['CLARITY', 'PACING', 'DIALOGUE', 'STRUCTURE', 'VOICE', 'CHARACTER'];

export default function BrowseRequestsScreen() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: ['feedbackRequests', selectedGenre, selectedFocus],
    queryFn: async ({ pageParam }) => {
      const res = await api.get('/feedback/open', {
        params: { 
          cursor: pageParam,
          genre: selectedGenre || undefined,
          focusAreas: selectedFocus.length > 0 ? selectedFocus.join(',') : undefined
        }
      });
      return res.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
  });

  const requests = data ? data.pages.flatMap((p: any) => p.data) : [];

  const toggleFocus = (focus: string) => {
    setSelectedFocus(prev => 
      prev.includes(focus) ? prev.filter(f => f !== focus) : [...prev, focus]
    );
  };

  const renderFilterBar = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={GENRES}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.chip, selectedGenre === item && styles.chipActive]}
            onPress={() => setSelectedGenre(selectedGenre === item ? null : item)}
          >
            <Text style={[styles.chipText, selectedGenre === item && styles.chipTextActive]}>
              {item.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterContent}
      />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FOCUS_AREAS}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.chip, selectedFocus.includes(item) && styles.chipActiveFocus]}
            onPress={() => toggleFocus(item)}
          >
            <Text style={[styles.chipText, selectedFocus.includes(item) && styles.chipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={[styles.filterContent, { marginTop: 8 }]}
      />
    </View>
  );

  const renderRequestCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.authorBadge}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>{item.author?.displayName?.[0]?.toUpperCase() || 'A'}</Text>
          </View>
          <Text style={styles.authorName}>{item.author?.displayName || 'Anonymous'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusBadgeText}>Open</Text>
          </View>
          <Text style={styles.genreTag}>{item.genre?.replace(/_/g, ' ')}</Text>
        </View>
      </View>
      
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.excerpt} numberOfLines={4}>"{item.excerpt.substring(0, 150)}..."</Text>
      
      <View style={styles.focusContainer}>
        {item.focusAreas.map((focus: string) => (
          <View key={focus} style={styles.focusTag}>
            <Text style={styles.focusTagText}>{focus}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.stats}>
          <Ionicons name="chatbubbles-outline" size={16} color="#64748b" />
          <Text style={styles.statsText}>{item._count?.responses || 0} responses</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.giveFeedbackBtn, item.hasResponded && styles.giveFeedbackBtnDisabled]}
          disabled={item.hasResponded}
          onPress={() => router.push(`/feedback/${item.id}/give-feedback`)}
        >
          <Text style={styles.giveFeedbackText}>
            {item.hasResponded ? 'Responded' : 'Give Feedback'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {renderFilterBar()}
      
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
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No open feedback requests.</Text>
              <Text style={styles.emptySubtext}>Check back soon or try changing filters.</Text>
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
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Request Feedback</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#8b5cf6',
  },
  chipActiveFocus: {
    backgroundColor: '#fce7f3',
    borderColor: '#ec4899',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#4f46e5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  genreTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8b5cf6',
    backgroundColor: '#f3f0ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5', // emerald-50
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0', // emerald-200
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981', // emerald-500
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669', // emerald-600
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  excerpt: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  focusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  focusTag: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  focusTagText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  giveFeedbackBtn: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  giveFeedbackBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  giveFeedbackText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});
