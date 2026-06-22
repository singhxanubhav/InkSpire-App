import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { AvatarUpload } from '../../components/features/profile/AvatarUpload';
import { EditProfileModal } from '../../components/features/profile/EditProfileModal';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProfile();
  };

  const handleSaveProfile = async (data: any) => {
    await api.patch('/users/me', data);
    setProfile((prev: any) => ({ ...prev, ...data }));
  };

  const handleAvatarUpload = (url: string) => {
    setProfile((prev: any) => ({ ...prev, avatar: url }));
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of InkSpire?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            try {
              const refreshToken = useAuthStore.getState().refreshToken;
              if (refreshToken) {
                await api.post('/auth/logout', { refreshToken }).catch(() => {});
              }
            } finally {
              await logout();
              router.replace('/'); // Redirect to auth flow root
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <AvatarUpload currentAvatarUrl={profile.avatar} onUploadSuccess={handleAvatarUpload} />

        <View style={styles.infoSection}>
          <Text style={styles.displayName}>{profile.displayName}</Text>
          <Text style={styles.username}>@{user?.email?.split('@')[0]}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.totalMatches || 0}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.dailyWordCount || 0}</Text>
              <Text style={styles.statLabel}>Daily Words</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>

          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.emptyBio}>No bio added yet.</Text>
          )}

          <Button 
            title="Edit Profile" 
            variant="outline" 
            onPress={() => setIsEditModalVisible(true)}
            style={styles.editButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genres</Text>
          <View style={styles.chipsContainer}>
            {profile.genres?.map((genre: string) => (
              <View key={genre} style={styles.chip}>
                <Text style={styles.chipText}>{genre.replace('_', ' ')}</Text>
              </View>
            ))}
            {(!profile.genres || profile.genres.length === 0) && (
              <Text style={styles.emptyText}>No genres selected.</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Writing Goals</Text>
          <View style={styles.goalsContainer}>
            {profile.writingGoals?.map((goal: string, index: number) => (
              <View key={index} style={styles.goalItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.goalText}>{goal}</Text>
              </View>
            ))}
            {(!profile.writingGoals || profile.writingGoals.length === 0) && (
              <Text style={styles.emptyText}>No goals set.</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Peer Feedback</Text>
          <View style={styles.goalsContainer}>
            <TouchableOpacity 
              style={[styles.goalItem, { backgroundColor: '#eff6ff', padding: 12, borderRadius: 12 }]}
              onPress={() => router.push('/feedback')}
            >
              <Ionicons name="chatbubbles" size={20} color="#2563eb" />
              <Text style={[styles.goalText, { fontWeight: '600' }]}>Browse Feedback Requests</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { marginTop: 20 }]}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EditProfileModal
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        initialData={profile}
        onSave={handleSaveProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  settingsButton: {
    padding: 8,
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyBio: {
    fontSize: 15,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  editButton: {
    width: '100%',
    marginBottom: 30,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
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
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    fontStyle: 'italic',
  },
  goalsContainer: {
    gap: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalText: {
    fontSize: 15,
    color: '#374151',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
