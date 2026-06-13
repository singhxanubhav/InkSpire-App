import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import IdeaWorkspace from '../../components/features/ideas/IdeaWorkspace';
import PartnerInfo from '../../components/features/matches/PartnerInfo';

export default function MatchWorkspaceScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ideas' | 'partner'>('ideas');
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch partner details from the matches service
    const fetchMatchDetails = async () => {
      try {
        const response = await api.get('/matches');
        // Find this specific match
        const match = response.data.find((m: any) => m.matchId === id);
        if (match) {
          setPartner(match.partner);
        } else {
          // Fallback or handle error
          console.error("Match not found");
        }
      } catch (error) {
        console.error("Failed to fetch match details", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMatchDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{partner?.displayName || 'Workspace'}</Text>
          <Text style={styles.headerSubtitle}>Idea Exchange</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ideas' && styles.activeTab]}
          onPress={() => setActiveTab('ideas')}
        >
          <Ionicons name="bulb-outline" size={20} color={activeTab === 'ideas' ? '#4f46e5' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'ideas' && styles.activeTabText]}>Ideas</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'partner' && styles.activeTab]}
          onPress={() => setActiveTab('partner')}
        >
          <Ionicons name="person-outline" size={20} color={activeTab === 'partner' ? '#4f46e5' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'partner' && styles.activeTabText]}>Partner Info</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'ideas' ? (
          <IdeaWorkspace matchId={id as string} partner={partner} />
        ) : (
          <PartnerInfo matchId={id as string} partner={partner} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  activeTab: {
    borderBottomColor: '#4f46e5',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#4f46e5',
  },
  content: {
    flex: 1,
  },
});
