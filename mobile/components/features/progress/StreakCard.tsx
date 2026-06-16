import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
  // Generate mock past 30 days grid dots (for visual effect mostly since we only pass streak numbers, 
  // ideally we pass the full history array, but for visual flair we'll mock based on current streak)
  // Real implementation: pass history and color dots based on wordCount > 0
  const totalDots = 30;
  const dots = Array.from({ length: totalDots }).map((_, i) => {
    // Fill the last `currentStreak` dots
    return i >= totalDots - currentStreak;
  });

  const getMessage = () => {
    if (currentStreak === 0) return "You missed yesterday. Start fresh today!";
    if (currentStreak === longestStreak && currentStreak > 1) return `New personal best! ${currentStreak}-day streak!`;
    return `${currentStreak}-day streak! Keep it up!`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.streakInfo}>
          <Text style={styles.title}>Current Streak 🔥</Text>
          <View style={styles.numberRow}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>days</Text>
          </View>
          <Text style={styles.message}>{getMessage()}</Text>
        </View>

        <View style={styles.longestBadge}>
          <Ionicons name="trophy" size={16} color="#d97706" />
          <Text style={styles.longestText}>Best: {longestStreak}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {dots.map((isFilled, idx) => (
          <View 
            key={idx} 
            style={[styles.dot, isFilled ? styles.dotFilled : styles.dotEmpty]} 
          />
        ))}
      </View>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  streakInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ea580c', // orange-600
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  message: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  longestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7', // amber-50
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  longestText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309', // amber-700
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  dotFilled: {
    backgroundColor: '#f97316', // orange-500
  },
  dotEmpty: {
    backgroundColor: '#f1f5f9', // slate-100
  }
});
