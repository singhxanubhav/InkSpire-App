import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';

interface LeaderboardProps {
  entries: any[];
  currentUserId?: string;
}

export function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {entries.map((entry, index) => {
        const isMe = entry.userId === currentUserId;
        
        return (
          <Animated.View 
            key={entry.userId}
            layout={Layout.springify()}
            entering={FadeIn}
            style={[styles.row, isMe && styles.myRow]}
          >
            <View style={styles.rankContainer}>
              <Text style={[styles.rank, isMe && styles.myText]}>{entry.rank}</Text>
            </View>
            
            {entry.avatar ? (
              <Image source={{ uri: entry.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{entry.displayName?.charAt(0) || '?'}</Text>
              </View>
            )}
            
            <View style={styles.info}>
              <Text style={[styles.name, isMe && styles.myText]} numberOfLines={1}>
                {entry.displayName} {isMe && '(You)'}
              </Text>
            </View>
            
            <View style={styles.scoreContainer}>
              <Text style={[styles.score, isMe && styles.myText]}>{entry.wordCount}</Text>
              <Text style={[styles.scoreLabel, isMe && styles.myText]}>words</Text>
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  myRow: {
    backgroundColor: '#8b5cf6',
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 12,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  myText: {
    color: '#fff',
  }
});
