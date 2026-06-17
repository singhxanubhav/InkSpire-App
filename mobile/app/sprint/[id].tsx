import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useSprintRoom } from '../../hooks/useSprintRoom';
import { CountdownTimer } from '../../components/features/events/CountdownTimer';
import { Leaderboard } from '../../components/features/events/Leaderboard';
import { useAuthStore } from '../../store/authStore';

export default function SprintRoomScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  
  // Prevent screen sleep
  useKeepAwake();

  const { data: event } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await api.get(`/events/${id}`);
      return res.data.data;
    }
  });

  const { leaderboard, isConnected, updateWordCount } = useSprintRoom(id as string);
  
  const [localCount, setLocalCount] = useState('0');
  const [sprintState, setSprintState] = useState<'UPCOMING' | 'LIVE' | 'ENDED'>('UPCOMING');
  
  // Debounce the socket emission
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleUpdate = useCallback((newCountStr: string) => {
    setLocalCount(newCountStr);
    const parsed = parseInt(newCountStr);
    if (!isNaN(parsed)) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        updateWordCount(parsed);
      }, 1000); // 1s debounce
    }
  }, [updateWordCount]);

  const increment = () => {
    const cur = parseInt(localCount) || 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleUpdate((cur + 50).toString());
  };

  const decrement = () => {
    const cur = parseInt(localCount) || 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleUpdate(Math.max(0, cur - 50).toString());
  };

  const handleBack = () => {
    if (sprintState === 'LIVE') {
      Alert.alert(
        'Leave Sprint?',
        'You can return while the sprint is still active. Your words are saved.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Sprint...</Text>
      </View>
    );
  }

  const myEntry = leaderboard.find(p => p.userId === user?.id);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
          <View style={[styles.connectionDot, isConnected ? styles.dotConnected : styles.dotDisconnected]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.topSection}>
        <CountdownTimer 
          startTime={event.startTime} 
          endTime={event.endTime} 
          onStateChange={setSprintState}
        />
        
        {sprintState === 'UPCOMING' ? (
          <Text style={styles.subText}>Get ready to write!</Text>
        ) : null}
      </View>

      <View style={styles.centerSection}>
        <Text style={styles.wordCountLabel}>Your Words</Text>
        <Text style={styles.hugeWordCount}>{myEntry?.wordCount || localCount}</Text>
        {event.targetWords ? (
          <Text style={styles.targetText}>
            Goal: {event.targetWords}
          </Text>
        ) : null}
      </View>

      <View style={styles.leaderboardSection}>
        <Text style={styles.leaderboardTitle}>Live Leaderboard</Text>
        <Leaderboard entries={leaderboard.slice(0, 5)} currentUserId={user?.id} />
      </View>

      {sprintState === 'LIVE' ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.controls}
        >
          <TouchableOpacity style={styles.controlBtn} onPress={decrement}>
            <Ionicons name="remove" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            value={localCount}
            onChangeText={handleUpdate}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#64748b"
          />
          
          <TouchableOpacity style={styles.controlBtn} onPress={increment}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      ) : null}

      {sprintState === 'ENDED' ? (
        <View style={styles.endedSection}>
          <Text style={styles.endedTitle}>Sprint Finished! 🎉</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleBack}>
            <Text style={styles.primaryBtnText}>Back to Events</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a', // Dark theme
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotConnected: {
    backgroundColor: '#10b981',
  },
  dotDisconnected: {
    backgroundColor: '#ef4444',
  },
  topSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  subText: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 16,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  wordCountLabel: {
    color: '#94a3b8',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  hugeWordCount: {
    fontSize: 80,
    fontWeight: '900',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  targetText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  leaderboardSection: {
    height: 250,
    paddingHorizontal: 16,
  },
  leaderboardTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  controlBtn: {
    backgroundColor: '#334155',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  endedSection: {
    padding: 24,
    alignItems: 'center',
  },
  endedTitle: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
});
