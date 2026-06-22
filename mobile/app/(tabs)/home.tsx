import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [activeMatches, setActiveMatches] = useState<any[]>([]);

  const { data: unreadData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data?.data?.count || 0;
    },
    refetchInterval: 30000, // Poll every 30s
  });

  const unreadCount = unreadData || 0;

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const [reqs, matchesRes] = await Promise.all([
          api.get('/matches/requests'),
          api.get('/matches')
        ]);
        if (reqs.data?.incoming) {
          setPendingRequests(reqs.data.incoming.length);
        }
        if (matchesRes.data) {
          setActiveMatches(matchesRes.data);
        }
      } catch (e) {
        // silently fail
      }
    };
    fetchMatches();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-gray-100">
        <View>
          <Text className="text-2xl font-extrabold text-gray-900">InkSpire</Text>
          <Text className="text-sm text-gray-500 font-medium">Hello, {user?.displayName || 'Writer'}</Text>
        </View>
        <TouchableOpacity 
          className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center relative"
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={20} color="#2563eb" />
          {unreadCount > 0 && (
            <View className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white items-center justify-center">
              <Text className="text-white text-[8px] font-bold">{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Match Requests Alert */}
        {pendingRequests > 0 && (
          <TouchableOpacity 
            className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6 flex-row items-center justify-between"
            onPress={() => router.push('/match/requests')}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center">
                <Ionicons name="people" size={20} color="#4f46e5" />
              </View>
              <View>
                <Text className="text-indigo-900 font-bold">Match Requests</Text>
                <Text className="text-indigo-700 text-sm">You have {pendingRequests} pending request{pendingRequests > 1 ? 's' : ''}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4f46e5" />
          </TouchableOpacity>
        )}

        {/* Quick Actions Grid */}
        <Text className="text-lg font-extrabold text-gray-900 mb-4">Quick Actions</Text>
        <View className="flex-row justify-between mb-8 gap-3">
          <TouchableOpacity 
            className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm items-center"
            onPress={() => router.push('/discover')}
          >
            <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mb-3">
              <Ionicons name="search" size={24} color="#3b82f6" />
            </View>
            <Text className="font-bold text-gray-900 text-center">Find Writers</Text>
            <Text className="text-xs text-gray-500 text-center mt-1">Matchmaking</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm items-center"
            onPress={() => router.push('/events')}
          >
            <View className="w-12 h-12 bg-purple-50 rounded-full items-center justify-center mb-3">
              <Ionicons name="flash" size={24} color="#8b5cf6" />
            </View>
            <Text className="font-bold text-gray-900 text-center">Live Sprints</Text>
            <Text className="text-xs text-gray-500 text-center mt-1">Join Events</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm items-center"
            onPress={() => router.push('/feedback')}
          >
            <View className="w-12 h-12 bg-emerald-50 rounded-full items-center justify-center mb-3">
              <Ionicons name="chatbubbles" size={24} color="#10b981" />
            </View>
            <Text className="font-bold text-gray-900 text-center">Feedback</Text>
            <Text className="text-xs text-gray-500 text-center mt-1">Get Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Active Workspaces / Matches */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-extrabold text-gray-900">Your Workspaces</Text>
            {activeMatches.length > 0 && (
              <Text className="text-sm font-bold text-indigo-600">{activeMatches.length} Active</Text>
            )}
          </View>

          {activeMatches.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {activeMatches.map((match) => (
                <TouchableOpacity 
                  key={match.matchId}
                  className="bg-white border border-gray-100 rounded-3xl p-5 mr-4 items-center w-36 shadow-sm"
                  onPress={() => router.push(`/match/${match.matchId}`)}
                >
                  <View className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full mb-3 items-center justify-center shadow-sm">
                    <Text className="text-xl font-extrabold text-indigo-600">
                      {match.partner?.displayName?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text className="font-bold text-gray-900 text-center mb-1" numberOfLines={1}>
                    {match.partner?.displayName}
                  </Text>
                  <View className="bg-indigo-50 px-2 py-1 rounded-md mt-1">
                    <Text className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Workspace</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View className="bg-white border border-gray-100 rounded-2xl p-6 items-center justify-center shadow-sm">
              <View className="w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-3">
                <Ionicons name="folder-open-outline" size={28} color="#9ca3af" />
              </View>
              <Text className="text-gray-900 font-bold mb-1">No Active Workspaces</Text>
              <Text className="text-gray-500 text-sm text-center">Match with a co-writer to start collaborating.</Text>
              <TouchableOpacity 
                className="mt-4 bg-indigo-50 px-6 py-2 rounded-full"
                onPress={() => router.push('/discover')}
              >
                <Text className="text-indigo-600 font-bold">Find a Match</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Daily Goal Card */}
        <View className="bg-white rounded-3xl p-6 mb-8 border border-gray-100 shadow-sm relative overflow-hidden">
          {/* Subtle background decoration */}
          <View className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50 rounded-full opacity-50" />
          
          <View className="flex-row justify-between items-end mb-6 relative z-10">
            <View>
              <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Daily Progress</Text>
              <Text className="text-2xl font-extrabold text-gray-900">0 <Text className="text-lg text-gray-400 font-medium">/ {user?.dailyWordCount || 500} words</Text></Text>
            </View>
            <View className="w-12 h-12 bg-blue-100 rounded-2xl items-center justify-center">
              <Ionicons name="pencil" size={24} color="#2563eb" />
            </View>
          </View>

          <View className="h-3 bg-gray-100 rounded-full w-full mb-6 overflow-hidden">
            <View className="h-full bg-blue-500 rounded-full w-2" />
          </View>

          <TouchableOpacity 
            className="bg-gray-900 py-4 rounded-2xl items-center shadow-sm"
            onPress={() => router.push('/progress')}
          >
            <Text className="text-white font-bold text-base">Log Words & View Stats</Text>
          </TouchableOpacity>
        </View>
        
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
