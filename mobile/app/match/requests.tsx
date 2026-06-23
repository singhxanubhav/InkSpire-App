import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';

export default function MatchRequestsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [toast, setToast] = useState<{visible: boolean, message: string, type: 'success'|'error'|'info'}>({
    visible: false, message: '', type: 'info'
  });

  const fetchRequests = async () => {
    try {
      const response = await api.get('/matches/requests');
      setIncoming(response.data.incoming || []);
      setOutgoing(response.data.outgoing || []);
    } catch (error) {
      console.error('Failed to fetch requests', error);
      showToast('Failed to load requests.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRequests();
  };

  const showToast = (message: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({ visible: true, message, type });
  };

  const handleAction = async (matchId: string, action: 'accept' | 'decline' | 'unmatch') => {
    setActionLoading(matchId);
    try {
      await api.post(`/matches/${matchId}/${action}`);
      showToast(`Request ${action}ed successfully`, 'success');
      
      // Optimistic remove
      if (activeTab === 'incoming') {
        setIncoming(prev => prev.filter(req => req.id !== matchId));
      } else {
        setOutgoing(prev => prev.filter(req => req.id !== matchId));
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || `Failed to ${action} request`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const renderRequestItem = ({ item }: { item: any }) => {
    const isIncoming = activeTab === 'incoming';
    const profile = isIncoming ? item.requester : item.receivee;
    
    if (!profile) return null;
    
    const displayAvatar = profile.avatar || `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(profile.displayName || 'U')}&backgroundColor=6366f1&textColor=ffffff&fontSize=40`;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: displayAvatar }} style={styles.avatar} onError={() => {}} />
          <View style={styles.cardInfo}>
            <Text style={styles.name}>{profile.displayName}</Text>
            {profile.experienceLevel && (
              <Text style={styles.experience}>{profile.experienceLevel.replace('_', ' ')}</Text>
            )}
          </View>
        </View>
        
        {profile.bio && (
          <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
        )}

        {isIncoming ? (
          <View style={styles.actionRow}>
            <Button
              title="Decline"
              variant="outline"
              style={[styles.actionBtn, styles.declineBtn]}
              textStyle={styles.declineText}
              disabled={actionLoading === item.id}
              onPress={() => handleAction(item.id, 'decline')}
            />
            <Button
              title="Accept"
              variant="primary"
              style={styles.actionBtn}
              loading={actionLoading === item.id}
              disabled={actionLoading === item.id}
              onPress={() => handleAction(item.id, 'accept')}
            />
          </View>
        ) : (
          <View style={styles.actionRow}>
            <Button
              title="Cancel Request"
              variant="outline"
              style={styles.cancelBtn}
              loading={actionLoading === item.id}
              disabled={actionLoading === item.id}
              onPress={() => handleAction(item.id, 'unmatch')}
            />
          </View>
        )}
      </View>
    );
  };

  const currentData = activeTab === 'incoming' ? incoming : outgoing;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Match Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'incoming' && styles.activeTab]}
          onPress={() => setActiveTab('incoming')}
        >
          <Text style={[styles.tabText, activeTab === 'incoming' && styles.activeTabText]}>
            Incoming ({incoming.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'outgoing' && styles.activeTab]}
          onPress={() => setActiveTab('outgoing')}
        >
          <Text style={[styles.tabText, activeTab === 'outgoing' && styles.activeTabText]}>
            Outgoing ({outgoing.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={item => item.id}
          renderItem={renderRequestItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No {activeTab} requests right now.
              </Text>
            </View>
          }
        />
      )}

      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#2563eb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  experience: {
    fontSize: 13,
    color: '#6b7280',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 40,
  },
  declineBtn: {
    borderColor: '#ef4444',
  },
  declineText: {
    color: '#ef4444',
  },
  cancelBtn: {
    width: '100%',
    height: 40,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
  },
});
