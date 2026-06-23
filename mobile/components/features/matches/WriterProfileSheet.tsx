import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../ui/Button';

interface WriterProfileSheetProps {
  isVisible: boolean;
  onClose: () => void;
  writer: any | null;
  onConnect: () => void;
  isConnecting: boolean;
  isPending: boolean;
}

export function WriterProfileSheet({ 
  isVisible, 
  onClose, 
  writer, 
  onConnect, 
  isConnecting,
  isPending
}: WriterProfileSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['70%', '90%'], []);

  useEffect(() => {
    if (isVisible && writer) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible, writer]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} onPress={onClose} />
    ),
    [onClose]
  );

  if (!writer) return null;

  const displayAvatar = writer.avatar || `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(writer.displayName || 'U')}&backgroundColor=6366f1&textColor=ffffff&fontSize=40`;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#e5e7eb', width: 40 }}
      backgroundStyle={{ backgroundColor: '#ffffff', borderRadius: 24 }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>

        <View style={styles.profileInfo}>
          <Image source={{ uri: displayAvatar }} style={styles.avatar} />
          <Text style={styles.displayName}>{writer.displayName}</Text>
          {writer.matchScore > 0 && (
            <View style={styles.overlapBadge}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.overlapText}>{writer.matchScore} shared genre{writer.matchScore > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <Button 
            title={isPending ? "Pending Request" : "Send Match Request"} 
            onPress={onConnect}
            loading={isConnecting}
            disabled={isConnecting || isPending}
            style={styles.connectButton}
            variant={isPending ? 'outline' : 'primary'}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{writer.bio || "No bio provided."}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience & Availability</Text>
          <View style={styles.tagRow}>
            {writer.experienceLevel && (
              <View style={styles.tag}>
                <Ionicons name="school-outline" size={16} color="#4b5563" />
                <Text style={styles.tagText}>{writer.experienceLevel.replace('_', ' ')}</Text>
              </View>
            )}
            {writer.availability && (
              <View style={styles.tag}>
                <Ionicons name="time-outline" size={16} color="#4b5563" />
                <Text style={styles.tagText}>{writer.availability.replace('_', ' ')}</Text>
              </View>
            )}
          </View>
        </View>

        {writer.genres && writer.genres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genres</Text>
            <View style={styles.chipsContainer}>
              {writer.genres.map((genre: string) => (
                <View key={genre} style={styles.chip}>
                  <Text style={styles.chipText}>{genre.replace('_', ' ')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {writer.writingGoals && writer.writingGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Writing Goals</Text>
            <View style={styles.goalsContainer}>
              {writer.writingGoals.map((goal: string, index: number) => (
                <View key={index} style={styles.goalItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                  <Text style={styles.goalText}>{goal}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  closeBtn: {
    padding: 4,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e5e7eb',
    marginBottom: 12,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  overlapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  overlapText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
  },
  actionRow: {
    marginBottom: 24,
  },
  connectButton: {
    width: '100%',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  goalsContainer: {
    gap: 10,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalText: {
    fontSize: 15,
    color: '#374151',
  },
});
