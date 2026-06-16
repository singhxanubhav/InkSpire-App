import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ProgressDashboard } from '../../components/features/progress/ProgressDashboard';
import { WeeklyChart } from '../../components/features/progress/WeeklyChart';
import { StreakCard } from '../../components/features/progress/StreakCard';
import { Leaderboard } from '../../components/features/progress/Leaderboard';
import { LogWordsModal } from '../../components/features/progress/LogWordsModal';
import * as Haptics from 'expo-haptics';
import { documentDirectory, EncodingType, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProgressScreen() {
  const [isLogModalVisible, setIsLogModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['progressStats'],
    queryFn: async () => {
      const res = await api.get('/progress/stats');
      return res.data.data;
    }
  });

  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ['progressHistory'],
    queryFn: async () => {
      const res = await api.get('/progress/history?days=7');
      return res.data.data;
    }
  });

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchStats(),
      refetchHistory(),
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    ]);
    setIsRefreshing(false);
  }, []);

  const handleExport = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const response = await api.get('/progress/export');
      const csvContent = response.data;
      
      const fileUri = `${documentDirectory}inkspire_progress.csv`;
      await writeAsStringAsync(fileUri, csvContent, { encoding: EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error('Export failed', error);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = history?.find((log: any) => log.date.startsWith(todayStr));
  const todayWordCount = todayLog ? todayLog.wordCount : 0;
  const dailyGoal = stats?.dailyGoal || 500;

  const logModalRef = React.useRef<any>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress Tracker</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Ionicons name="download-outline" size={20} color="#2563eb" />
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <ProgressDashboard 
          todayWordCount={todayWordCount} 
          dailyGoal={dailyGoal}
          onLogPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            logModalRef.current?.present();
          }}
        />

        {stats && <StreakCard currentStreak={stats.currentStreak} longestStreak={stats.longestStreak} />}
        
        {history && stats && <WeeklyChart history={history} dailyGoal={dailyGoal} />}

        <Leaderboard />
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <LogWordsModal 
        ref={logModalRef}
        onClose={() => {}} 
        initialWordCount={todayWordCount}
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  }
});
