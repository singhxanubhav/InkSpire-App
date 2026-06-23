import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { AvatarUpload } from '../../components/features/profile/AvatarUpload';
import { EditProfileModal } from '../../components/features/profile/EditProfileModal';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      await logout();
      router.replace('/');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#8b5cf6" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header Background */}
        <LinearGradient
          colors={['#4338ca', '#312e81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']} style={styles.safeHeader}>
            <View style={styles.headerNav}>
              <Text style={styles.headerTitle}>Profile</Text>
              <TouchableOpacity 
                style={styles.headerIconBtn} 
                onPress={() => setIsEditModalVisible(true)}
              >
                <Ionicons name="settings-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.profileBody}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
              <AvatarUpload currentAvatarUrl={profile.avatar} onUploadSuccess={handleAvatarUpload} />
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            <Text style={styles.username}>@{user?.email?.split('@')[0]}</Text>

            {profile.bio ? (
              <Text style={styles.bio}>{profile.bio}</Text>
            ) : (
              <Text style={styles.emptyBio}>No bio added yet.</Text>
            )}

            {/* Premium Stats Card */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={20} color="#8b5cf6" style={styles.statIcon} />
                <Text style={styles.statNumber}>{profile.totalMatches || 0}</Text>
                <Text style={styles.statLabel}>Matches</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="pencil" size={20} color="#10b981" style={styles.statIcon} />
                <Text style={styles.statNumber}>{profile.dailyWordCount || 0}</Text>
                <Text style={styles.statLabel}>Daily Words</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="flame" size={20} color="#f59e0b" style={styles.statIcon} />
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
          </View>

          {/* Genres Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Writing Genres</Text>
            <View style={styles.card}>
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
          </View>

          {/* Goals Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Goals</Text>
            <View style={styles.card}>
              <View style={styles.goalsContainer}>
                {profile.writingGoals?.map((goal: string, index: number) => (
                  <View key={index} style={styles.goalItem}>
                    <View style={styles.goalIconContainer}>
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    </View>
                    <Text style={styles.goalText}>{goal}</Text>
                  </View>
                ))}
                {(!profile.writingGoals || profile.writingGoals.length === 0) && (
                  <Text style={styles.emptyText}>No writing goals set.</Text>
                )}
              </View>
            </View>
          </View>

          {/* Peer Feedback Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Community</Text>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/feedback')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#f8fafc', '#f1f5f9']}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionIconWrapper}>
                    <Ionicons name="chatbubbles" size={22} color="#3b82f6" />
                  </View>
                  <View style={styles.actionTextWrapper}>
                    <Text style={styles.actionTitle}>Peer Feedback</Text>
                    <Text style={styles.actionDesc}>Browse requests and give critique</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <View style={[styles.section, { marginTop: 10 }]}>
            <TouchableOpacity 
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#dc2626', '#991b1b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.logoutButtonPremium}
              >
                <Ionicons name="log-out" size={22} color="#ffffff" />
                <Text style={styles.logoutTextPremium}>Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <EditProfileModal
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        initialData={profile}
        onSave={handleSaveProfile}
      />

      <ConfirmModal
        visible={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of InkSpire?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerGradient: {
    paddingBottom: 70,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  safeHeader: {
    // Ensuring safe area is applied within gradient
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginTop: -65,
    marginBottom: 20,
  },
  avatarContainer: {
    padding: 6,
    backgroundColor: '#f4f4f5',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  displayName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  username: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 16,
  },
  bio: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  emptyBio: {
    fontSize: 15,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    width: '100%',
    shadowColor: '#312e81',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
    borderWidth: 0,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e1b4b',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#312e81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 0,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  chipText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 15,
    fontStyle: 'italic',
  },
  goalsContainer: {
    gap: 16,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  goalIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  goalText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
  },
  actionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 0,
  },
  actionCardGradient: {
    padding: 24,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextWrapper: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  logoutButtonPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 24,
    shadowColor: '#991b1b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  logoutTextPremium: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
