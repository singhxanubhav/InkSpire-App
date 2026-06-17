import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface EventCardProps {
  event: any;
  onJoin: () => void;
}

export function EventCard({ event, onJoin }: EventCardProps) {
  const router = useRouter();

  const getBadgeIcon = () => {
    switch(event.type) {
      case 'SPRINT': return '⚡';
      case 'CHALLENGE': return '🏆';
      case 'WORKSHOP': return '📚';
      default: return '📝';
    }
  };

  const handlePress = () => {
    if (event.hasJoined || event.isLive || event.isPast) {
      router.push(`/sprint/${event.id}`);
    } else {
      onJoin();
    }
  };

  return (
    <View style={[styles.card, event.isLive && styles.liveCard]}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeEmoji}>{getBadgeIcon()}</Text>
          <Text style={styles.badgeText}>{event.type}</Text>
        </View>
        {event.isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{event.description}</Text>
      
      <View style={styles.footer}>
        <View style={styles.stats}>
          <Ionicons name="people" size={16} color="#64748b" />
          <Text style={styles.statsText}>{event.participantCount} joined</Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            event.hasJoined ? styles.buttonJoined : styles.buttonPrimary
          ]}
          onPress={handlePress}
        >
          <Text style={[
            styles.buttonText,
            event.hasJoined && styles.buttonTextJoined
          ]}>
            {event.isLive ? 'Enter Room' : event.hasJoined ? 'Joined ✓' : 'Join'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  liveCard: {
    borderColor: '#8b5cf6',
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeEmoji: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonPrimary: {
    backgroundColor: '#8b5cf6',
  },
  buttonJoined: {
    backgroundColor: '#f1f5f9',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonTextJoined: {
    color: '#8b5cf6',
  }
});
