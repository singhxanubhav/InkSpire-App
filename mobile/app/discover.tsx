import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { WriterCard } from '../components/features/matches/WriterCard';
import { WriterProfileSheet } from '../components/features/matches/WriterProfileSheet';
import { Toast } from '../components/ui/Toast';
import { BackButton } from '../components/ui/BackButton';

export default function DiscoverScreen() {
  const [writers, setWriters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  
  const [selectedWriter, setSelectedWriter] = useState<any>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  
  const [toast, setToast] = useState<{visible: boolean, message: string, type: 'success'|'error'|'info'}>({
    visible: false,
    message: '',
    type: 'info'
  });

  const fetchWriters = async (cursor?: string, isRefresh = false) => {
    try {
      const endpoint = cursor ? `/users/discover?cursor=${cursor}` : '/users/discover';
      const response = await api.get(endpoint);
      
      const { data, nextCursor: newCursor } = response.data;
      
      if (isRefresh || !cursor) {
        setWriters(data);
      } else {
        setWriters(prev => [...prev, ...data]);
      }
      
      setNextCursor(newCursor);
    } catch (error) {
      console.error('Failed to fetch discover feed', error);
      showToast('Failed to load writers. Please try again.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchWriters();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchWriters(undefined, true);
  };

  const handleLoadMore = () => {
    if (!nextCursor || isLoadingMore || isLoading || isRefreshing) return;
    setIsLoadingMore(true);
    fetchWriters(nextCursor);
  };

  const showToast = (message: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({ visible: true, message, type });
  };

  const handleConnect = async (writer: any) => {
    setConnectingId(writer.id);
    try {
      await api.post('/matches/request', { receiveeId: writer.id });
      setPendingIds(prev => {
        const newSet = new Set(prev);
        newSet.add(writer.id);
        return newSet;
      });
      showToast(`Match request sent to ${writer.displayName}`, 'success');
      if (isSheetVisible) setIsSheetVisible(false);
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to send request';
      showToast(msg, 'error');
    } finally {
      setConnectingId(null);
    }
  };

  const openProfile = (writer: any) => {
    setSelectedWriter(writer);
    setIsSheetVisible(true);
  };

  const renderEmptyComponent = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No writers found</Text>
        <Text style={styles.emptyText}>We couldn't find any potential matches for you right now. Try updating your genres or check back later!</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton style={{ marginBottom: 12 }} />
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>Find your ideal writing partner</Text>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={writers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <WriterCard
              writer={item}
              onPress={() => openProfile(item)}
              onConnect={() => handleConnect(item)}
              isConnecting={connectingId === item.id}
              isPending={pendingIds.has(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? <ActivityIndicator style={styles.footerLoader} color="#2563eb" /> : null
          }
          ListEmptyComponent={renderEmptyComponent}
        />
      )}

      <WriterProfileSheet
        isVisible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        writer={selectedWriter}
        onConnect={() => handleConnect(selectedWriter)}
        isConnecting={selectedWriter ? connectingId === selectedWriter.id : false}
        isPending={selectedWriter ? pendingIds.has(selectedWriter.id) : false}
      />

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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 4,
  },
  listContent: {
    padding: 20,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  footerLoader: {
    marginVertical: 20,
  },
});
