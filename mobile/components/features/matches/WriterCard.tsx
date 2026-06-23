import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../ui/Button';

interface WriterCardProps {
  writer: any;
  onPress: () => void;
  onConnect: () => void;
  isConnecting: boolean;
  isPending: boolean;
}

export function WriterCard({ writer, onPress, onConnect, isConnecting, isPending }: WriterCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [avatarError, setAvatarError] = useState(false);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Use PNG format from DiceBear - SVG is not supported by React Native's Image component
  const fallbackAvatar = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(writer.displayName || 'U')}&backgroundColor=6366f1&textColor=ffffff&fontSize=40`;
  const displayAvatar = (!avatarError && writer.avatar) ? writer.avatar : fallbackAvatar;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.header}>
          <Image
            source={{ uri: displayAvatar }}
            style={styles.avatar}
            onError={() => setAvatarError(true)}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.name} numberOfLines={1}>{writer.displayName}</Text>
            {writer.experienceLevel && (
              <Text style={styles.experience}>{writer.experienceLevel.replace('_', ' ')}</Text>
            )}
          </View>
          {writer.matchScore > 0 && (
            <View style={styles.matchBadge}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.matchScore}>{writer.matchScore}</Text>
            </View>
          )}
        </View>

        {writer.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {writer.bio}
          </Text>
        )}

        <View style={styles.genresContainer}>
          {writer.genres?.slice(0, 3).map((genre: string) => (
            <View key={genre} style={styles.genreChip}>
              <Text style={styles.genreText}>{genre.replace('_', ' ')}</Text>
            </View>
          ))}
          {writer.genres?.length > 3 && (
            <View style={styles.genreChip}>
              <Text style={styles.genreText}>+{writer.genres.length - 3}</Text>
            </View>
          )}
        </View>

        <Button
          title={isPending ? "Pending" : "Connect"}
          onPress={onConnect}
          variant={isPending ? "outline" : "primary"}
          loading={isConnecting}
          disabled={isPending || isConnecting}
          style={styles.connectButton}
          textStyle={styles.connectButtonText}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  experience: {
    fontSize: 13,
    color: '#6b7280',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  matchScore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  bio: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  genreChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genreText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  connectButton: {
    height: 40,
    borderRadius: 10,
  },
  connectButtonText: {
    fontSize: 14,
  },
});
