import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function Leaderboard() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const res = await api.get(`/progress/leaderboard?period=${period}`);
      return res.data.data;
    }
  });

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isTop3 = item.rank <= 3;
    const rankColors = ['#f59e0b', '#94a3b8', '#b45309']; // Gold, Silver, Bronze

    return (
      <View style={styles.row}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, isTop3 && { color: rankColors[item.rank - 1] }]}>
            #{item.rank}
          </Text>
        </View>
        <View style={styles.avatarMini}>
          <Text style={styles.avatarText}>{item.displayName?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.nameText} numberOfLines={1}>{item.displayName}</Text>
        <Text style={styles.wordCountText}>{item.wordCount.toLocaleString()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.toggle}>
          <TouchableOpacity 
            style={[styles.toggleBtn, period === 'week' && styles.toggleBtnActive]}
            onPress={() => setPeriod('week')}
          >
            <Text style={[styles.toggleText, period === 'week' && styles.toggleTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, period === 'month' && styles.toggleBtnActive]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[styles.toggleText, period === 'month' && styles.toggleTextActive]}>Month</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#8b5cf6" style={{ marginVertical: 40 }} />
      ) : data?.top10?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Be the first to log words this {period}!</Text>
        </View>
      ) : (
        <View>
          {data?.top10.map((item: any, idx: number) => renderItem({ item, index: idx }))}
          
          {/* Current User Row - Anchored */}
          {data?.currentUserRank && data.currentUserRank.rank > 10 && (
            <View>
              <View style={styles.divider} />
              <View style={[styles.row, styles.currentUserRow]}>
                <View style={styles.rankContainer}>
                  <Text style={styles.rankText}>#{data.currentUserRank.rank}</Text>
                </View>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarText}>{data.currentUserRank.displayName?.[0]?.toUpperCase()}</Text>
                </View>
                <Text style={[styles.nameText, { fontWeight: '700' }]} numberOfLines={1}>You</Text>
                <Text style={styles.wordCountText}>{data.currentUserRank.wordCount.toLocaleString()}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#0f172a',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  rankContainer: {
    width: 32,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4f46e5',
  },
  nameText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
  },
  wordCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  currentUserRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  }
});
