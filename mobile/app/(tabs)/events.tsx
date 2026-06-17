import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { EventCard } from '../../components/features/events/EventCard';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function EventsScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: events, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await api.get('/events');
      return res.data.data;
    }
  });

  const joinMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await api.post(`/events/${eventId}/join`);
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/sprint/${eventId}`);
    }
  });

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const liveEvents = events?.filter((e: any) => e.isLive) || [];
  const upcomingEvents = events?.filter((e: any) => !e.isLive && !e.isPast) || [];
  const pastEvents = events?.filter((e: any) => e.isPast) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events & Sprints</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {liveEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Live Now</Text>
            {liveEvents.map((event: any) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onJoin={() => joinMutation.mutate(event.id)} 
              />
            ))}
          </View>
        )}

        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {upcomingEvents.map((event: any) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onJoin={() => joinMutation.mutate(event.id)} 
              />
            ))}
          </View>
        )}

        {pastEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Events</Text>
            {pastEvents.map((event: any) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onJoin={() => {}} 
              />
            ))}
          </View>
        )}

        {(!events || events.length === 0) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No events available right now.</Text>
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
  }
});
