import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../../services/api';
import { Button } from '../../ui/Button';
import { ActionModal } from '../../ui/ActionModal';
import { Toast } from '../../ui/Toast';

interface PartnerInfoProps {
  matchId: string;
  partner: any;
}

export default function PartnerInfo({ matchId, partner }: PartnerInfoProps) {
  const router = useRouter();
  const [isUnmatching, setIsUnmatching] = useState(false);
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success'|'error'|'info' });

  if (!partner) return null;

  const displayAvatar = partner.avatar || `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(partner.displayName || 'U')}&backgroundColor=6366f1&textColor=ffffff&fontSize=40`;

  const handleUnmatch = async () => {
    setIsUnmatching(true);
    setShowUnmatchConfirm(false);
    try {
      await api.post(`/matches/${matchId}/unmatch`);
      router.replace('/(tabs)/home');
    } catch (err) {
      console.error('Failed to unmatch', err);
      setToast({ visible: true, message: 'Failed to unmatch. Please try again.', type: 'error' });
      setIsUnmatching(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Image source={{ uri: displayAvatar }} style={styles.avatar} />
        <Text style={styles.name}>{partner.displayName}</Text>
        {partner.experienceLevel && (
          <Text style={styles.experience}>{partner.experienceLevel.replace('_', ' ')}</Text>
        )}
      </View>

      {partner.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{partner.bio}</Text>
        </View>
      )}

      {partner.genres && partner.genres.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genres</Text>
          <View style={styles.tagsContainer}>
            {partner.genres.map((genre: string) => (
              <View key={genre} style={styles.tag}>
                <Text style={styles.tagText}>{genre.replace('_', ' ').toLowerCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.spacer} />

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <Text style={styles.dangerText}>
          Unmatching will remove this user from your matches and permanently delete this shared idea workspace.
        </Text>
        <Button 
          title="Unmatch" 
          variant="danger" 
          onPress={() => setShowUnmatchConfirm(true)} 
          loading={isUnmatching}
          style={styles.unmatchButton}
        />
      </View>

      <ActionModal
        visible={showUnmatchConfirm}
        title={`Unmatch with ${partner.displayName}? This action cannot be undone.`}
        onClose={() => setShowUnmatchConfirm(false)}
        options={[
          { label: 'Unmatch User', icon: 'person-remove-outline', destructive: true, onPress: handleUnmatch }
        ]}
      />

      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e5e7eb',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  experience: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  tagText: {
    fontSize: 13,
    color: '#4f46e5',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  spacer: {
    height: 32,
  },
  dangerZone: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 40,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 8,
  },
  dangerText: {
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
    marginBottom: 16,
  },
  unmatchButton: {
    width: '100%',
  },
});
